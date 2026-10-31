/**
 * @file spotify-oauth.test.js
 * Unit Test Suite for Spotify PKCE Authorization Flow & Verification.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SpotifyAuth, SPOTIFY_SCOPES } from '../src/services/spotify/spotifyAuth.js';

describe('MOODIFY Spotify PKCE Authorization Engine', () => {
  test('Generates high-entropy random strings of specified length', () => {
    const auth = new SpotifyAuth();
    const str1 = auth.generateRandomString(64);
    const str2 = auth.generateRandomString(64);

    assert.strictEqual(str1.length, 64);
    assert.strictEqual(str2.length, 64);
    assert.notStrictEqual(str1, str2);
  });

  test('Generates valid base64url code challenge from verifier', async () => {
    const auth = new SpotifyAuth();
    const verifier = 'test-verifier-string-1234567890-abcdefghijklmnopqrstuvwxyz';
    const challenge = await auth.generateCodeChallenge(verifier);

    assert.ok(challenge);
    assert.strictEqual(typeof challenge, 'string');
    // Base64url should not contain '+', '/', or '='
    assert.strictEqual(challenge.includes('+'), false);
    assert.strictEqual(challenge.includes('/'), false);
    assert.strictEqual(challenge.includes('='), false);
  });

  test('Enforces presence of Client ID before initiating authorization', async () => {
    const auth = new SpotifyAuth();
    auth.clientId = '';

    await assert.rejects(
      async () => auth.initiateLogin(''),
      /Spotify Client ID is required/
    );
  });

  test('Calculates and returns clean redirect URI defaults to 127.0.0.1 loopback', () => {
    const auth = new SpotifyAuth();
    const uri = auth.getRedirectUri();
    assert.strictEqual(uri, 'http://127.0.0.1:5173/');
  });

  test('Ensures authorization URL and token exchange share identical redirect_uri', async () => {
    const auth = new SpotifyAuth();
    auth.clientId = 'test-client-id-123';
    const authUrl = await auth.initiateLogin();
    const parsed = new URL(authUrl);

    const authRedirectUri = parsed.searchParams.get('redirect_uri');
    assert.strictEqual(authRedirectUri, auth.redirectUri);
    assert.strictEqual(authRedirectUri, 'http://127.0.0.1:5173/');
  });

  test('Security Check: Never requires, accepts, or stores a Spotify Client Secret', () => {
    const auth = new SpotifyAuth();
    assert.strictEqual(auth.clientSecret, undefined);
    assert.strictEqual(typeof auth.initiateLogin, 'function');
    // Verify that Spotify client code does not reference any client_secret
    const authCode = fs.readFileSync('src/services/spotify/spotifyAuth.js', 'utf8');
    assert.strictEqual(authCode.includes('client_secret'), false);
    assert.strictEqual(authCode.includes('VITE_SPOTIFY_CLIENT_SECRET'), false);
  });

  test('Includes required read-only user and playlist scopes', () => {
    assert.ok(SPOTIFY_SCOPES.includes('playlist-read-private'));
    assert.ok(SPOTIFY_SCOPES.includes('playlist-read-collaborative'));
    assert.ok(SPOTIFY_SCOPES.includes('user-library-read'));
    assert.ok(SPOTIFY_SCOPES.includes('user-read-private'));
    assert.ok(SPOTIFY_SCOPES.includes('user-read-email'));
  });
});
