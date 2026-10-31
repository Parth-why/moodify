/**
 * @file appState.js
 * Central Reactive State Container for Moodify V1.
 */

import { MoodCategories, MOOD_AUDIO_PROFILES } from '../services/ai/types.js';
import { TRACK_CATALOG } from '../services/spotify/spotifyTracks.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { audioPlayer } from '../services/audio/audioPlayer.js';

class AppState {
  constructor() {
    this.currentMood = MoodCategories.CHILL;
    this.targetAudioFeatures = { ...MOOD_AUDIO_PROFILES[MoodCategories.CHILL] };
    this.tracks = TRACK_CATALOG.filter(t => t.mood === this.currentMood);
    this.currentTrack = this.tracks[0] || null;
    this.isPlaying = false;
    this.activeSuggestion = null;
    this.favorites = this._loadFavorites();
    this.currentView = this._loadInitialView();
    this.savedJourneys = this._loadSavedJourneys();
    this.listeners = new Map();

    // Browser back/forward navigation support
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        const h = window.location.hash.slice(1).toLowerCase();
        if (['home', 'library', 'journeys', 'discover'].includes(h) && h !== this.currentView) {
          this.currentView = h;
          this.emit('viewChange', h);
        }
      });
    }

    // Subscribe to audio player events
    audioPlayer.subscribe((event, data) => {
      if (event === 'play' || event === 'resume') {
        this.isPlaying = true;
        this.emit('playbackChange', { isPlaying: true, track: this.currentTrack });
      } else if (event === 'pause' || event === 'ended') {
        this.isPlaying = false;
        this.emit('playbackChange', { isPlaying: false, track: this.currentTrack });
      }
    });
  }

  _loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('moodify_favorites') || '[]');
    } catch {
      return [];
    }
  }

  _loadInitialView() {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.slice(1).toLowerCase();
      if (['home', 'library', 'journeys', 'discover'].includes(h)) return h;
    }
    return 'home';
  }

  setCurrentView(view) {
    if (['home', 'library', 'journeys', 'discover'].includes(view)) {
      this.currentView = view;
      if (typeof window !== 'undefined') {
        window.location.hash = view;
      }
      this.emit('viewChange', view);
    }
  }

  _loadSavedJourneys() {
    try {
      return JSON.parse(localStorage.getItem('moodify_saved_journeys') || '[]');
    } catch {
      return [];
    }
  }

  saveJourney(journey) {
    if (!journey || !journey.id) return;
    this.savedJourneys = [journey, ...this.savedJourneys.filter(j => j.id !== journey.id)];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('moodify_saved_journeys', JSON.stringify(this.savedJourneys));
    }
    this.emit('journeySaved', journey);
  }

  deleteJourney(journeyId) {
    this.savedJourneys = this.savedJourneys.filter(j => j.id !== journeyId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('moodify_saved_journeys', JSON.stringify(this.savedJourneys));
    }
    this.emit('journeyDeleted', journeyId);
  }

  toggleFavorite(trackId) {
    if (this.favorites.includes(trackId)) {
      this.favorites = this.favorites.filter(id => id !== trackId);
    } else {
      this.favorites = [...this.favorites, trackId];
    }
    localStorage.setItem('moodify_favorites', JSON.stringify(this.favorites));
    this.emit('favoritesChange', this.favorites);
  }

  isFavorite(trackId) {
    return this.favorites.includes(trackId);
  }

  async setMood(moodKey, customFeatures = null) {
    if (!Object.values(MoodCategories).includes(moodKey)) return;
    this.currentMood = moodKey;
    this.targetAudioFeatures = customFeatures || { ...MOOD_AUDIO_PROFILES[moodKey] };

    // Fetch matched tracks from SpotifyClient (curated library or Spotify API)
    const matchedTracks = await spotifyClient.getTracksForMood(moodKey, this.targetAudioFeatures);
    this.tracks = matchedTracks;

    this.emit('moodChange', {
      mood: this.currentMood,
      features: this.targetAudioFeatures,
      tracks: this.tracks
    });
  }

  async setTracks(tracks) {
    this.tracks = tracks;
    this.emit('tracksChange', this.tracks);
  }

  async playTrack(track) {
    this.currentTrack = track;
    await audioPlayer.playTrack(track);
    this.emit('trackSelected', track);
  }

  togglePlay() {
    if (!this.currentTrack && this.tracks.length > 0) {
      this.playTrack(this.tracks[0]);
    } else {
      audioPlayer.togglePlay();
    }
  }

  playNext() {
    if (this.tracks.length === 0) return;
    const idx = this.tracks.findIndex(t => t.id === this.currentTrack?.id);
    const nextIdx = (idx + 1) % this.tracks.length;
    this.playTrack(this.tracks[nextIdx]);
  }

  playPrevious() {
    if (this.tracks.length === 0) return;
    const idx = this.tracks.findIndex(t => t.id === this.currentTrack?.id);
    const prevIdx = (idx - 1 + this.tracks.length) % this.tracks.length;
    this.playTrack(this.tracks[prevIdx]);
  }

  setActiveSuggestion(suggestion) {
    this.activeSuggestion = suggestion;
    this.emit('suggestionChange', suggestion);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[AppState] Error in listener for ${event}:`, err);
        }
      }
    }
  }
}

export const appState = new AppState();
