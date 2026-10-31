/**
 * @file moodService.js
 * Comprehensive Mood Management Service for MOODIFY V1.5.
 *
 * Implements:
 * - 12 System Default Moods (Party, Happy, Cheerful, Lonely, Romantic, Chill, Energetic, Nostalgic, Melancholic, Surprised, Dreamy, Confident)
 * - Custom Mood Creation, Renaming, Color modification, Deletion
 * - Multiple Mood Assignments per track (track_moods)
 * - Bulk mood assignment
 * - Multi-mood track filtering and search
 * - Dual backend support: Supabase PostgreSQL (when authenticated) with resilient local storage fallback
 */

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient.js';
import { authService } from '../auth/authService.js';

export const DEFAULT_MOODS = [
  { id: 'def-party', name: 'Party', category: 'party', color: '#F59E0B', emoji: '🥳', isDefault: true },
  { id: 'def-happy', name: 'Happy', category: 'joyful', color: '#FBBF24', emoji: '☀️', isDefault: true },
  { id: 'def-cheerful', name: 'Cheerful', category: 'joyful', color: '#34D399', emoji: '😊', isDefault: true },
  { id: 'def-lonely', name: 'Lonely', category: 'melancholy', color: '#64748B', emoji: '🌧️', isDefault: true },
  { id: 'def-romantic', name: 'Romantic', category: 'romantic', color: '#F43F5E', emoji: '🌹', isDefault: true },
  { id: 'def-chill', name: 'Chill', category: 'chill', color: '#38BDF8', emoji: '☕', isDefault: true },
  { id: 'def-energetic', name: 'Energetic', category: 'energetic', color: '#EF4444', emoji: '🔥', isDefault: true },
  { id: 'def-nostalgic', name: 'Nostalgic', category: 'chill', color: '#D97706', emoji: '📼', isDefault: true },
  { id: 'def-melancholic', name: 'Melancholic', category: 'melancholy', color: '#818CF8', emoji: '💧', isDefault: true },
  { id: 'def-surprised', name: 'Surprised', category: 'energetic', color: '#EC4899', emoji: '⚡', isDefault: true },
  { id: 'def-dreamy', name: 'Dreamy', category: 'focused', color: '#A855F7', emoji: '🌌', isDefault: true },
  { id: 'def-confident', name: 'Confident', category: 'energetic', color: '#10B981', emoji: '🦁', isDefault: true }
];

const LOCAL_STORAGE_KEYS = {
  CUSTOM_MOODS: 'moodify_v1_5_custom_moods',
  TRACK_MOOD_MAP: 'moodify_v1_5_track_mood_map'
};

export class MoodService {
  constructor() {
    this.customMoods = this._loadLocalCustomMoods();
    // Map: trackId (string) -> Set of mood names / IDs
    this.trackMoodMap = this._loadLocalTrackMoodMap();
    this.listeners = new Set();
  }

  _loadLocalCustomMoods() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_MOODS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  _saveLocalCustomMoods() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_MOODS, JSON.stringify(this.customMoods));
    } catch (err) {
      console.warn('[MoodService] Failed to save custom moods locally:', err);
    }
  }

  _loadLocalTrackMoodMap() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TRACK_MOOD_MAP);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  _saveLocalTrackMoodMap() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(LOCAL_STORAGE_KEYS.TRACK_MOOD_MAP, JSON.stringify(this.trackMoodMap));
    } catch (err) {
      console.warn('[MoodService] Failed to save track mood map locally:', err);
    }
  }

  /**
   * Returns all available moods (12 defaults + user custom moods)
   */
  async getAllMoods() {
    const user = authService.getUser();

    if (user && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[MoodService] Failed to fetch moods from Supabase:', error);
        throw new Error(`Database error fetching moods: ${error.message}`);
      }

      if (data && data.length > 0) {
        return data.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          color: m.color,
          emoji: this._getEmojiForMood(m.name),
          isDefault: m.is_default
        }));
      }
    }

    return [...DEFAULT_MOODS, ...this.customMoods];
  }

  /**
   * Creates a new custom mood
   */
  async createCustomMood({ name, color = '#A855F7', category = 'custom' }) {
    if (!name || !name.trim()) throw new Error('Mood name cannot be empty.');
    const trimmedName = name.trim();

    // Check duplicate
    const all = await this.getAllMoods();
    if (all.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A mood named "${trimmedName}" already exists.`);
    }

    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('moods')
        .insert({
          user_id: user.id,
          name: trimmedName,
          color,
          category,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        console.error('[MoodService] Failed to create custom mood in Supabase:', error);
        throw new Error(`Database error creating custom mood: ${error.message}`);
      }
      const created = {
        id: data.id,
        name: data.name,
        category: data.category,
        color: data.color,
        emoji: '✨',
        isDefault: false
      };
      this._emitChange();
      return created;
    } else {
      const newMood = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        category,
        color,
        emoji: '✨',
        isDefault: false
      };
      this.customMoods.push(newMood);
      this._saveLocalCustomMoods();
      this._emitChange();
      return newMood;
    }
  }

  /**
   * Renames or modifies color of a custom mood
   */
  async updateCustomMood(moodId, { name, color }) {
    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      const updates = {};
      if (name) updates.name = name.trim();
      if (color) updates.color = color;

      const { data, error } = await supabase
        .from('moods')
        .update(updates)
        .eq('id', moodId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[MoodService] Failed to update custom mood in Supabase:', error);
        throw new Error(`Database error updating mood: ${error.message}`);
      }
      this._emitChange();
      return data;
    } else {
      const mood = this.customMoods.find(m => m.id === moodId);
      if (!mood) throw new Error('Custom mood not found.');
      if (name) mood.name = name.trim();
      if (color) mood.color = color;
      this._saveLocalCustomMoods();
      this._emitChange();
      return mood;
    }
  }

  /**
   * Deletes a custom mood (system default moods cannot be deleted)
   */
  async deleteCustomMood(moodId) {
    const isDefault = DEFAULT_MOODS.some(m => m.id === moodId);
    if (isDefault) throw new Error('Default system moods cannot be deleted.');

    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('moods')
        .delete()
        .eq('id', moodId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[MoodService] Failed to delete custom mood from Supabase:', error);
        throw new Error(`Database error deleting mood: ${error.message}`);
      }
    } else {
      this.customMoods = this.customMoods.filter(m => m.id !== moodId);
      this._saveLocalCustomMoods();
    }
    this._emitChange();
  }

  /**
   * Assigns multiple moods to a track (additive)
   * Ensures the track exists in public.tracks before linking in public.track_moods.
   * @param {string|Object} trackOrId
   * @param {Array<string>} moodNames
   */
  async assignMoodsToTrack(trackOrId, moodNames) {
    if (!trackOrId || !Array.isArray(moodNames)) return;

    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
    const trackObj = typeof trackOrId === 'object' ? trackOrId : null;

    const current = new Set(this.trackMoodMap[trackId] || []);
    for (const m of moodNames) {
      if (m && m.trim()) current.add(m.trim().toLowerCase());
    }
    this.trackMoodMap[trackId] = Array.from(current);
    this._saveLocalTrackMoodMap();

    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      try {
        // 1. Ensure track exists in public.tracks to get a valid UUID
        const provider = trackObj?.provider || (trackId.startsWith('spotify') ? 'spotify' : 'moodify_native');
        const providerTrackId = trackObj?.providerTrackId || trackObj?.spotifyId || trackId;
        const title = trackObj?.title || trackId;
        const artist = trackObj?.artist || 'MOODIFY Artist';

        const { data: trackRow, error: trackErr } = await supabase
          .from('tracks')
          .upsert({
            user_id: user.id,
            provider,
            provider_track_id: providerTrackId,
            title,
            artist,
            album: trackObj?.album || '',
            cover_url: trackObj?.cover || '',
            duration_s: trackObj?.duration || 0,
            preview_url: trackObj?.previewUrl || null,
            external_url: trackObj?.externalUrl || null,
            user_notes: trackObj?.userNotes || ''
          }, { onConflict: 'user_id,provider,provider_track_id' })
          .select('id')
          .single();

        if (trackErr) {
          console.error('[MoodService] Failed to upsert track in Supabase:', trackErr);
          throw new Error(`Database error upserting track: ${trackErr.message}`);
        }

        const dbTrackId = trackRow.id;

        // 2. Resolve mood IDs from database
        const { data: dbMoods, error: moodsErr } = await supabase.from('moods').select('id, name');
        if (moodsErr) throw moodsErr;

        if (dbMoods) {
          for (const mName of moodNames) {
            const matched = dbMoods.find(dm => dm.name.toLowerCase() === mName.toLowerCase());
            if (matched) {
              const { error: tmErr } = await supabase.from('track_moods').upsert({
                user_id: user.id,
                track_id: dbTrackId,
                mood_id: matched.id,
                assignment_source: 'user_assigned'
              }, { onConflict: 'track_id,mood_id' });

              if (tmErr) {
                console.error('[MoodService] Failed to upsert track_moods in Supabase:', tmErr);
                throw tmErr;
              }
            }
          }
        }
      } catch (err) {
        console.error('[MoodService] Failed to persist track_moods in database:', err);
        throw err;
      }
    }

    this._emitChange();
  }

  /**
   * Loads all track mood assignments for the active authenticated user from Supabase.
   */
  async loadTrackMoodsFromSupabase(userId) {
    if (!userId || !isSupabaseConfigured || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('track_moods')
        .select('track_id, mood_id, tracks(provider_track_id), moods(name)')
        .eq('user_id', userId);

      if (error) {
        console.error('[MoodService] Failed to load track moods from Supabase:', error);
        return;
      }

      if (data) {
        this.trackMoodMap = {};
        for (const row of data) {
          const trackKey = row.tracks?.provider_track_id || row.track_id;
          const moodName = row.moods?.name;
          if (trackKey && moodName) {
            if (!this.trackMoodMap[trackKey]) {
              this.trackMoodMap[trackKey] = [];
            }
            if (!this.trackMoodMap[trackKey].includes(moodName.toLowerCase())) {
              this.trackMoodMap[trackKey].push(moodName.toLowerCase());
            }
          }
        }
        this._saveLocalTrackMoodMap();
        this._emitChange();
      }
    } catch (err) {
      console.warn('[MoodService] Error loading track moods from Supabase:', err);
    }
  }

  /**
   * Clears in-memory and local cache on user sign out for airtight isolation.
   */
  clearUserData() {
    this.trackMoodMap = {};
    this.customMoods = [];
    this._saveLocalTrackMoodMap();
    this._saveLocalCustomMoods();
    this._emitChange();
  }

  /**
   * Removes a specific mood assignment from a track
   */
  async removeMoodFromTrack(trackId, moodName) {
    if (!this.trackMoodMap[trackId]) return;
    const norm = moodName.toLowerCase();
    this.trackMoodMap[trackId] = this.trackMoodMap[trackId].filter(m => m.toLowerCase() !== norm);
    this._saveLocalTrackMoodMap();
    this._emitChange();
  }

  /**
   * Retrieves all moods assigned to a specific track
   */
  getTrackMoods(track) {
    if (!track) return [];
    const assigned = this.trackMoodMap[track.id] || [];
    // If none assigned yet, fallback to track.mood or track.userMoodTags
    if (assigned.length === 0) {
      if (track.userMoodTags && track.userMoodTags.length > 0) return track.userMoodTags;
      if (track.mood) return [track.mood];
      return ['chill'];
    }
    return assigned;
  }

  /**
   * Bulk assigns a mood to multiple tracks
   */
  async bulkAssignMood(trackIds, moodName) {
    for (const id of trackIds) {
      await this.assignMoodsToTrack(id, [moodName]);
    }
    this._emitChange();
  }

  /**
   * Filters a list of tracks by one or more selected moods
   */
  filterTracksByMoods(tracks, selectedMoods) {
    if (!selectedMoods || selectedMoods.length === 0) return tracks;
    const lowerSelected = selectedMoods.map(m => m.toLowerCase());

    return tracks.filter(t => {
      const moods = this.getTrackMoods(t).map(m => m.toLowerCase());
      // Track matches if it contains ANY of the selected filter moods
      return lowerSelected.some(sel => moods.includes(sel));
    });
  }

  _getEmojiForMood(name) {
    const defaultMatch = DEFAULT_MOODS.find(m => m.name.toLowerCase() === name.toLowerCase());
    return defaultMatch ? defaultMatch.emoji : '✨';
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _emitChange() {
    for (const cb of this.listeners) {
      try { cb(); } catch (err) { console.error('[MoodService] Listener error:', err); }
    }
  }
}

export const moodService = new MoodService();
