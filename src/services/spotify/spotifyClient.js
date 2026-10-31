/**
 * @file spotifyClient.js
 * Spotify Web API Client with Strict Developer Policy Compliance.
 *
 * POLICY & ARCHITECTURAL COMPLIANCE (February 2026 Migration):
 * 1. ZERO algorithmic derivation: No Euclidean distance matching or audio feature analysis
 *    is performed on Spotify Content to generate derived recommendations.
 * 2. ZERO AI training/inference: Spotify metadata, album art, audio, and lyrics are
 *    strictly blocked from entering any AI/ML models.
 * 3. Permitted endpoints only: Uses standard Search (`/v1/search`) and user library endpoints.
 *    Does not call restricted/deprecated `/v1/audio-features` or `/v1/recommendations`.
 * 4. Data separation: User mood assignments and Moments remain in MOODIFY's user store.
 * 5. Official playback: Directs users to Spotify Web Playback SDK / open in Spotify,
 *    respecting Spotify Premium restrictions.
 */

import { MOODIFY_CATALOG } from '../catalog/moodifyCatalog.js';
import { userMoodStore } from '../userdata/userMoodStore.js';

export class SpotifyClient {
  constructor() {
    this.accessToken = typeof localStorage !== 'undefined' ? (localStorage.getItem('moodify_spotify_token') || null) : null;
    this.clientId = typeof localStorage !== 'undefined' ? (localStorage.getItem('moodify_spotify_client_id') || null) : null;
    this.isGuestMode = !this.accessToken;
  }

  setAccessToken(token) {
    this.accessToken = token ? token.trim() : null;
    this.isGuestMode = !this.accessToken;
    if (typeof localStorage !== 'undefined') {
      if (this.accessToken) {
        localStorage.setItem('moodify_spotify_token', this.accessToken);
      } else {
        localStorage.removeItem('moodify_spotify_token');
      }
    }
  }

  setClientId(id) {
    this.clientId = id ? id.trim() : null;
    if (typeof localStorage !== 'undefined') {
      if (this.clientId) {
        localStorage.setItem('moodify_spotify_client_id', this.clientId);
      } else {
        localStorage.removeItem('moodify_spotify_client_id');
      }
    }
  }

  /**
   * Retrieves music for a mood category.
   *
   * COMPLIANCE RULE:
   * Recommendations rely strictly on:
   * 1. User-assigned mood tags & overrides (from UserMoodStore)
   * 2. MOODIFY's independent catalog classification
   * 3. When Spotify is connected, official keyword/genre search (`/v1/search?q=...`)
   *
   * NEVER uses Euclidean distance or algorithmic audio feature modeling on Spotify data.
   *
   * @param {string} mood
   * @param {Object} [options]
   * @returns {Promise<Array<any>>}
   */
  async getTracksForMood(mood, options = {}) {
    // 1. Fetch MOODIFY's independent catalog matches, respecting user overrides
    const nativeMatches = MOODIFY_CATALOG.filter(track => {
      const effectiveMood = userMoodStore.getEffectiveMood(track);
      return effectiveMood === mood;
    });

    // 2. If Spotify token is connected and user requested Spotify search:
    if (this.accessToken && options.includeSpotifySearch) {
      try {
        const spotifyTracks = await this._searchSpotifyByMoodTag(mood);
        return this._deduplicateTracks([...nativeMatches, ...spotifyTracks]);
      } catch (err) {
        console.warn('[SpotifyClient] Spotify search failed, using native library only:', err.message);
      }
    }

    const result = nativeMatches.length > 0 ? nativeMatches : MOODIFY_CATALOG;
    return this._deduplicateTracks(result);
  }

  /**
   * Searches MOODIFY's catalog and Spotify Web API (if authenticated).
   *
   * @param {string} query
   * @returns {Promise<Array<any>>}
   */
  async searchTracks(query) {
    if (!query) return MOODIFY_CATALOG;
    const q = query.toLowerCase().trim();

    // Search Moodify native catalog
    const nativeResults = MOODIFY_CATALOG.filter(t => {
      const effectiveMood = userMoodStore.getEffectiveMood(t);
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        effectiveMood.toLowerCase().includes(q) ||
        (t.userMoodTags && t.userMoodTags.some(tag => tag.toLowerCase().includes(q)))
      );
    });

    // If Spotify is connected, query Spotify official Search API
    if (this.accessToken && q.length > 1) {
      try {
        const spotifySearchResults = await this._searchSpotifyTracks(q);
        return this._deduplicateTracks([...nativeResults, ...spotifySearchResults]);
      } catch (err) {
        console.warn('[SpotifyClient] Spotify API search error:', err.message);
      }
    }

    return this._deduplicateTracks(nativeResults);
  }

  /**
   * Deduplicates track items based on ID and Title+Artist identity.
   * @param {Array<any>} trackList
   * @returns {Array<any>}
   */
  _deduplicateTracks(trackList) {
    if (!Array.isArray(trackList)) return [];
    const seen = new Set();
    return trackList.filter(t => {
      if (!t) return false;
      const key = `${(t.title || '').toLowerCase().trim()}::${(t.artist || '').toLowerCase().trim()}`;
      if (seen.has(key) || (t.id && seen.has(t.id))) {
        return false;
      }
      if (key !== '::') seen.add(key);
      if (t.id) seen.add(t.id);
      return true;
    });
  }

  /**
   * Searches Spotify via compliant `/v1/search?type=track` endpoint.
   * Does NOT call deprecated `/v1/recommendations` or `/v1/audio-features`.
   *
   * @private
   */
  async _searchSpotifyByMoodTag(mood) {
    const genreKeywords = {
      joyful: 'happy upbeat pop',
      chill: 'lo-fi chillout downtempo',
      energetic: 'workout high energy edm',
      focused: 'ambient study focus drone',
      cyberpunk: 'synthwave cyberpunk electronic',
      melancholy: 'sad acoustic piano',
      euphoric: 'euphoric festival house dance',
      romantic: 'r&b soul romance',
      nature: 'nature ambient meditation'
    };

    const query = genreKeywords[mood] || mood;
    return this._searchSpotifyTracks(query, mood);
  }

  /**
   * Executes official Spotify track search.
   *
   * @private
   */
  async _searchSpotifyTracks(searchQuery, assignedMood = 'chill') {
    const params = new URLSearchParams({
      q: searchQuery,
      type: 'track',
      limit: '10'
    });

    const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!res.ok) {
      throw new Error(`Spotify Search API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const items = data.tracks?.items || [];

    return items.map(t => ({
      id: `spotify-${t.id}`,
      spotifyId: t.id,
      title: t.name,
      artist: t.artists.map(a => a.name).join(', '),
      album: t.album.name,
      mood: assignedMood,
      userMoodTags: [assignedMood],
      cover: t.album.images?.[0]?.url || '/albums/lofi.jpg',
      duration: Math.round(t.duration_ms / 1000),
      previewUrl: t.preview_url || null,
      spotifyUri: t.uri,
      externalUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
      source: 'spotify_api',
      description: `Available via Spotify API search for "${searchQuery}". Requires Spotify Premium for full playback.`
    }));
  }
}

export const spotifyClient = new SpotifyClient();
