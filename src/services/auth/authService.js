/**
 * @file authService.js
 * Supabase Authentication & User Profile Service for MOODIFY V1.5.
 *
 * Implements:
 * - Email/Password Registration with automatic profile creation
 * - Secure Sign In and Session Persistence
 * - Password Recovery & Reset Flow
 * - Profile Retrieval and Modification
 * - Standalone Demo/Guest Session fallback for testing without live Supabase
 */

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient.js';

const DEMO_USER_STORAGE_KEY = 'moodify_demo_user_session';

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.authListeners = new Set();
    this.initialized = false;
  }

  /**
   * Initializes auth state, checks active session, and sets up listener.
   */
  async init() {
    if (this.initialized) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          this.currentUser = session.user;
          await this.loadProfile(session.user.id);
        }

        // Listen for Supabase auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            this.currentUser = session.user;
            await this.loadProfile(session.user.id);
          } else {
            this.currentUser = null;
            this.currentProfile = null;
          }
          this._notifyListeners(event, this.currentUser, this.currentProfile);
        });
      } catch (err) {
        console.warn('[AuthService] Supabase session retrieval error:', err);
      }
    } else {
      // Local standalone demo session
      this._loadLocalDemoSession();
    }

    this.initialized = true;
    this._notifyListeners('INITIALIZED', this.currentUser, this.currentProfile);
  }

  _loadLocalDemoSession() {
    try {
      if (typeof localStorage === 'undefined') return;
      const saved = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentUser = parsed.user;
        this.currentProfile = parsed.profile;
      }
    } catch {
      this.currentUser = null;
      this.currentProfile = null;
    }
  }

  _saveLocalDemoSession(user, profile) {
    try {
      if (typeof localStorage === 'undefined') return;
      if (user) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user, profile }));
      } else {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[AuthService] Failed to save demo session:', err);
    }
  }

  /**
   * Registers a new user account.
   */
  async signUp({ email, password, username, displayName }) {
    if (!email || !password) throw new Error('Email and password are required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            display_name: displayName || username || email.split('@')[0]
          }
        }
      });

      if (error) throw error;
      this.currentUser = data.user;

      if (data.user) {
        await this.loadProfile(data.user.id);
      }
      return { user: data.user, session: data.session };
    } else {
      // Standalone simulation for testing & offline mode
      const simulatedUser = {
        id: `usr-${Date.now()}`,
        email,
        created_at: new Date().toISOString()
      };
      const simulatedProfile = {
        id: simulatedUser.id,
        username: username || email.split('@')[0],
        display_name: displayName || username || email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username || email}`,
        bio: 'Sonic explorer crafting moodscapes on MOODIFY.',
        created_at: new Date().toISOString()
      };

      this.currentUser = simulatedUser;
      this.currentProfile = simulatedProfile;
      this._saveLocalDemoSession(simulatedUser, simulatedProfile);
      this._notifyListeners('SIGNED_UP', simulatedUser, simulatedProfile);
      return { user: simulatedUser, profile: simulatedProfile };
    }
  }

  /**
   * Logs in an existing user.
   */
  async signIn({ email, password }) {
    if (!email || !password) throw new Error('Email and password are required.');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      this.currentUser = data.user;
      await this.loadProfile(data.user.id);
      return { user: data.user, session: data.session };
    } else {
      // Standalone simulation
      const simulatedUser = {
        id: `usr-demo-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        email,
        created_at: new Date().toISOString()
      };
      const simulatedProfile = {
        id: simulatedUser.id,
        username: email.split('@')[0],
        display_name: email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`,
        bio: 'Passionate music lover and mood curator.',
        created_at: new Date().toISOString()
      };

      this.currentUser = simulatedUser;
      this.currentProfile = simulatedProfile;
      this._saveLocalDemoSession(simulatedUser, simulatedProfile);
      this._notifyListeners('SIGNED_IN', simulatedUser, simulatedProfile);
      return { user: simulatedUser, profile: simulatedProfile };
    }
  }

  /**
   * Logs out the current user and clears session data.
   */
  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    this.currentUser = null;
    this.currentProfile = null;
    this._saveLocalDemoSession(null, null);
    this._notifyListeners('SIGNED_OUT', null, null);
  }

  /**
   * Requests a password reset email.
   */
  async resetPassword(email) {
    if (!email) throw new Error('Email address is required.');
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset_password=true`
      });
      if (error) throw error;
      return true;
    } else {
      console.info('[AuthService] Simulated password reset sent to:', email);
      return true;
    }
  }

  /**
   * Loads user profile from the profiles table.
   */
  async loadProfile(userId) {
    if (!userId) return null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        this.currentProfile = data;
        return data;
      }
    }
    return this.currentProfile;
  }

  /**
   * Updates user profile fields.
   */
  async updateProfile(updates) {
    if (!this.currentUser) throw new Error('User must be logged in to update profile.');

    const updated = {
      ...this.currentProfile,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.currentUser.id);

      if (error) throw error;
    }

    this.currentProfile = updated;
    if (!isSupabaseConfigured) {
      this._saveLocalDemoSession(this.currentUser, this.currentProfile);
    }
    this._notifyListeners('PROFILE_UPDATED', this.currentUser, this.currentProfile);
    return this.currentProfile;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  getProfile() {
    return this.currentProfile;
  }

  onAuthStateChange(callback) {
    this.authListeners.add(callback);
    // Immediately invoke with current state
    if (this.initialized) {
      callback('CURRENT_STATE', this.currentUser, this.currentProfile);
    }
    return () => this.authListeners.delete(callback);
  }

  _notifyListeners(event, user, profile) {
    for (const listener of this.authListeners) {
      try {
        listener(event, user, profile);
      } catch (err) {
        console.error('[AuthService] Error in auth listener:', err);
      }
    }
  }
}

export const authService = new AuthService();
