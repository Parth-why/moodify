/**
 * @file userMoodStore.js
 * MOODIFY User-Generated Mood Data Store (Moments, Journeys, User Overrides).
 *
 * POLICY & ARCHITECTURAL SEPARATION (Phase 1, Req 3 & 4):
 * - Keeps user-generated mood data strictly partitioned from Spotify data.
 * - Stores user-assigned moods, corrections, preferences, and custom Moments/Journeys.
 * - Uses independent local storage namespaces.
 */

const STORAGE_KEYS = {
  USER_MOOD_OVERRIDES: 'moodify_user_mood_overrides',
  USER_MOMENTS: 'moodify_user_moments',
  USER_PREFERENCES: 'moodify_user_preferences',
  USER_FAVORITES: 'moodify_favorites'
};

export class UserMoodStore {
  constructor() {
    this.overrides = this._load(STORAGE_KEYS.USER_MOOD_OVERRIDES, {});
    this.moments = this._load(STORAGE_KEYS.USER_MOMENTS, [
      {
        id: 'moment-1',
        title: 'Deep Coding Flow',
        mood: 'focused',
        tags: ['coding', 'late_night', 'neural'],
        createdAt: Date.now() - 86400000
      },
      {
        id: 'moment-2',
        title: 'Sunset Rooftop Chill',
        mood: 'chill',
        tags: ['relax', 'lo-fi', 'twilight'],
        createdAt: Date.now() - 43200000
      }
    ]);
    this.preferences = this._load(STORAGE_KEYS.USER_PREFERENCES, {
      preferredMoods: ['chill', 'focused'],
      energyBias: 0.5,
      acousticBias: 0.5
    });
  }

  _load(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _save(key, data) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[UserMoodStore] Failed to save key ${key}:`, err);
    }
  }

  /**
   * Sets or overrides a user-assigned mood for a track.
   * Mood recommendations prioritize this user correction over default tags.
   */
  assignMoodToTrack(trackId, mood, userNotes = '') {
    this.overrides[trackId] = {
      userMood: mood,
      userNotes,
      updatedAt: Date.now()
    };
    this._save(STORAGE_KEYS.USER_MOOD_OVERRIDES, this.overrides);
  }

  /**
   * Retrieves effective mood for a track, respecting user overrides.
   */
  getEffectiveMood(track) {
    if (!track) return 'chill';
    if (this.overrides[track.id]?.userMood) {
      return this.overrides[track.id].userMood;
    }
    return track.mood;
  }

  /**
   * Creates a user Moment or Journey
   */
  createMoment(title, mood, tags = []) {
    const moment = {
      id: `moment-${Date.now()}`,
      title,
      mood,
      tags,
      createdAt: Date.now()
    };
    this.moments.unshift(moment);
    this._save(STORAGE_KEYS.USER_MOMENTS, this.moments);
    return moment;
  }

  getMoments() {
    return [...this.moments];
  }

  updatePreferences(prefUpdates) {
    this.preferences = { ...this.preferences, ...prefUpdates };
    this._save(STORAGE_KEYS.USER_PREFERENCES, this.preferences);
  }

  getPreferences() {
    return { ...this.preferences };
  }
}

export const userMoodStore = new UserMoodStore();
