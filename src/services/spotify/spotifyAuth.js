/**
 * @file spotifyAuth.js
 * Spotify Authorization Code Flow with PKCE (Proof Key for Code Exchange).
 *
 * Implements Spotify's officially supported public client authorization flow:
 * - High-entropy cryptographic verifier and SHA-256 challenge generation
 * - CSRF state parameter validation
 * - Scopes: playlist-read-private, playlist-read-collaborative, user-library-read, user-read-private, user-read-email
 * - Secure token exchange without client secret (Zero Secrets in Browser)
 * - Automatic token expiry tracking and refresh
 */

import { spotifyClient } from './spotifyClient.js';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient.js';
import { authService } from '../auth/authService.js';

const STORAGE_KEYS = {
  CODE_VERIFIER: 'moodify_spotify_code_verifier',
  AUTH_STATE: 'moodify_spotify_auth_state',
  REFRESH_TOKEN: 'moodify_spotify_refresh_token',
  TOKEN_EXPIRY: 'moodify_spotify_token_expires_at'
};

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-read-private',
  'user-read-email'
].join(' ');

export class SpotifyAuth {
  constructor() {
    this.clientId = typeof localStorage !== 'undefined' ? (localStorage.getItem('moodify_spotify_client_id') || import.meta.env?.VITE_SPOTIFY_CLIENT_ID || '') : '';
    this.redirectUri = this.getRedirectUri();
    this.isAuthenticating = false;
  }

  getRedirectUri() {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return 'http://localhost:5173/';
  }

  setClientId(id) {
    this.clientId = id ? id.trim() : '';
    if (typeof localStorage !== 'undefined') {
      if (this.clientId) {
        localStorage.setItem('moodify_spotify_client_id', this.clientId);
      } else {
        localStorage.removeItem('moodify_spotify_client_id');
      }
    }
    spotifyClient.setClientId(this.clientId);
  }

  /**
   * Generates a cryptographically random string for PKCE verifier and state
   */
  generateRandomString(length = 64) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const values = new Uint8Array(length);
      crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        text += possible[values[i] % possible.length];
      }
    } else {
      // Fallback for tests/environments without crypto.getRandomValues
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
    }
    return text;
  }

  /**
   * Computes SHA-256 hash and encodes to base64url for PKCE challenge
   */
  async generateCodeChallenge(codeVerifier) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }
    // Fallback simple base64url representation for test environments
    return Buffer.from(codeVerifier).toString('base64url');
  }

  /**
   * Initiates Spotify PKCE Authorization Redirect
   */
  async initiateLogin(customClientId = null) {
    const activeClientId = customClientId || this.clientId;
    if (!activeClientId) {
      throw new Error('Spotify Client ID is required. Please provide a Client ID.');
    }

    this.setClientId(activeClientId);

    const verifier = this.generateRandomString(64);
    const challenge = await this.generateCodeChallenge(verifier);
    const state = this.generateRandomString(32);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier);
      sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    }

    const params = new URLSearchParams({
      client_id: activeClientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: state,
      scope: SPOTIFY_SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge
    });

    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
    return authUrl;
  }

  /**
   * Inspects URL parameters upon redirect and handles code exchange
   */
  async handleRedirectCallback() {
    if (typeof window === 'undefined' || !window.location.search) return false;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      this._cleanUrlParams();
      throw new Error(`Spotify Authorization failed: ${error}`);
    }

    if (!code) return false;

    // Validate CSRF state
    const savedState = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) : null;
    if (savedState && state !== savedState) {
      this._cleanUrlParams();
      throw new Error('Invalid OAuth state parameter. Potential CSRF attack detected.');
    }

    const codeVerifier = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER) : null;
    if (!codeVerifier) {
      this._cleanUrlParams();
      throw new Error('PKCE Code Verifier not found in session storage.');
    }

    this.isAuthenticating = true;

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || `Token exchange error: ${response.status}`);
      }

      const tokenData = await response.json();
      await this._processTokenResponse(tokenData);

      // Clean up session storage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      }

      this._cleanUrlParams();
      this.isAuthenticating = false;
      return true;
    } catch (err) {
      this._cleanUrlParams();
      this.isAuthenticating = false;
      throw err;
    }
  }

  /**
   * Stores access token in memory & updates user connection in database if logged in
   * @private
   */
  async _processTokenResponse(tokenData) {
    const { access_token, refresh_token, expires_in } = tokenData;
    
    spotifyClient.setAccessToken(access_token);

    const expiresAt = Date.now() + (expires_in * 1000);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString());
      if (refresh_token) {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }
    }

    // If user is authenticated in Supabase, update connection status
    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('spotify_connections').upsert({
          user_id: user.id,
          connection_status: 'connected',
          connected_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('[SpotifyAuth] Failed to update spotify_connections table:', err);
      }
    }
  }

  /**
   * Refreshes the Spotify access token using the stored refresh token
   */
  async refreshAccessToken() {
    const refreshToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
    if (!refreshToken || !this.clientId) return null;

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        this.disconnect();
        return null;
      }

      const tokenData = await response.json();
      await this._processTokenResponse(tokenData);
      return tokenData.access_token;
    } catch (err) {
      console.warn('[SpotifyAuth] Refresh token failed:', err);
      return null;
    }
  }

  /**
   * Disconnects Spotify account and cleans state
   */
  async disconnect() {
    spotifyClient.setAccessToken(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('spotify_connections').upsert({
          user_id: user.id,
          connection_status: 'disconnected',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('[SpotifyAuth] Failed to update disconnect state:', err);
      }
    }
  }

  _cleanUrlParams() {
    if (typeof window !== 'undefined' && window.history && window.location) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
}

export const spotifyAuth = new SpotifyAuth();
