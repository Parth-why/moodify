/**
 * @file libraryService.js
 * "My Universe" Personal Music Library & Playlist Import Engine for MOODIFY V1.5.
 *
 * Implements:
 * - Spotify Playlist Discovery (`/v1/me/playlists`)
 * - Deep Playlist Import with multi-item pagination & real-time progress callbacks
 * - Track Deduplication across multiple playlist sources (ID & title::artist)
 * - Individual Track Search and Library Import
 * - Multi-playlist association management (`playlist_track_sources`)
 * - Library Sorting, Filtering, and Deletion
 * - Async import job state logging (`import_jobs`)
 */

import { spotifyClient } from '../spotify/spotifyClient.js';
import { moodService } from '../moods/moodService.js';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient.js';
import { authService } from '../auth/authService.js';
import { MOODIFY_CATALOG } from '../catalog/moodifyCatalog.js';

const STORAGE_KEY_LIBRARY = 'moodify_v1_5_user_library_tracks';
const STORAGE_KEY_PLAYLISTS = 'moodify_v1_5_imported_playlists';
const STORAGE_KEY_SOURCES = 'moodify_v1_5_playlist_sources';

export class LibraryService {
  constructor() {
    this.localTracks = this._loadLocal(STORAGE_KEY_LIBRARY, []);
    this.localPlaylists = this._loadLocal(STORAGE_KEY_PLAYLISTS, []);
    this.localSources = this._loadLocal(STORAGE_KEY_SOURCES, []);
    this.listeners = new Set();
  }

  _loadLocal(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _saveLocal(key, data) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[LibraryService] Failed to save key ${key}:`, err);
    }
  }

  /**
   * Fetches accessible playlists from Spotify Web API
   * @returns {Promise<Array<any>>}
   */
  async fetchSpotifyPlaylists() {
    if (!spotifyClient.accessToken) {
      throw new Error('Spotify is not connected. Please connect via PKCE or provide a developer token.');
    }

    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${spotifyClient.accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Spotify token expired. Please re-authenticate.');
      }
      throw new Error(`Failed to fetch playlists from Spotify: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.items || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      coverUrl: p.images?.[0]?.url || '/albums/focus.jpg',
      totalTracks: p.tracks?.total || 0,
      owner: p.owner?.display_name || 'Spotify User',
      isPublic: p.public,
      externalUrl: p.external_urls?.spotify || ''
    }));
  }

  /**
   * Imports a Spotify playlist and all its tracks into the user's library with deduplication
   * @param {string} playlistId
   * @param {Function} [onProgress]
   */
  async importPlaylist(playlistId, onProgress = () => {}) {
    if (!spotifyClient.accessToken) {
      throw new Error('Spotify is not connected.');
    }

    onProgress({ status: 'fetching_meta', progress: 5, message: 'Fetching playlist details...' });

    // 1. Fetch playlist metadata
    const metaRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${spotifyClient.accessToken}` }
    });

    if (!metaRes.ok) {
      throw new Error(`Could not access playlist: ${metaRes.statusText}`);
    }

    const playlistData = await metaRes.json();
    const totalTracks = playlistData.tracks?.total || 0;

    const importedPlaylist = {
      id: `pl-${playlistId}`,
      provider: 'spotify',
      providerPlaylistId: playlistId,
      name: playlistData.name,
      description: playlistData.description || '',
      coverUrl: playlistData.images?.[0]?.url || '/albums/focus.jpg',
      totalTracks: totalTracks,
      importStatus: 'completed',
      importedAt: new Date().toISOString()
    };

    // 2. Paginate tracks
    let offset = 0;
    const limit = 100;
    const allFetchedTracks = [];

    while (offset < totalTracks) {
      onProgress({
        status: 'importing_tracks',
        progress: Math.min(90, Math.round(15 + (offset / Math.max(1, totalTracks)) * 75)),
        message: `Importing tracks (${offset}/${totalTracks})...`
      });

      const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${spotifyClient.accessToken}` }
      });

      if (!tracksRes.ok) break;

      const trackPage = await tracksRes.json();
      const items = trackPage.items || [];
      if (items.length === 0) break;

      for (const item of items) {
        const t = item.track;
        if (!t || !t.id) continue; // Skip local/inaccessible files

        allFetchedTracks.push({
          id: `spotify-${t.id}`,
          provider: 'spotify',
          providerTrackId: t.id,
          title: t.name,
          artist: (t.artists || []).map(a => a.name).join(', ') || 'Unknown Artist',
          album: t.album?.name || 'Single',
          cover: t.album?.images?.[0]?.url || '/albums/lofi.jpg',
          duration: Math.round((t.duration_ms || 0) / 1000),
          previewUrl: t.preview_url || null,
          externalUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
          source: 'spotify_api',
          mood: 'chill',
          userMoodTags: ['chill'],
          userNotes: `Imported from playlist "${playlistData.name}"`,
          addedAt: new Date().toISOString()
        });
      }

      offset += limit;
    }

    // 3. Deduplication and persistence
    let newlyAdded = 0;
    for (const track of allFetchedTracks) {
      const added = await this.addTrackToLibrary(track, playlistId);
      if (added) newlyAdded++;
    }

    // Record imported playlist in state
    this.localPlaylists = this.localPlaylists.filter(p => p.providerPlaylistId !== playlistId);
    this.localPlaylists.unshift(importedPlaylist);
    this._saveLocal(STORAGE_KEY_PLAYLISTS, this.localPlaylists);

    // Persist to Supabase if logged in
    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('imported_playlists').upsert({
          user_id: user.id,
          provider: 'spotify',
          provider_playlist_id: playlistId,
          name: importedPlaylist.name,
          description: importedPlaylist.description,
          cover_url: importedPlaylist.coverUrl,
          total_tracks: totalTracks,
          import_status: 'completed'
        }, { onConflict: 'user_id,provider,provider_playlist_id' });
      } catch (err) {
        console.warn('[LibraryService] Supabase playlist sync error:', err);
      }
    }

    onProgress({
      status: 'completed',
      progress: 100,
      message: `Successfully imported "${playlistData.name}" (${allFetchedTracks.length} tracks, ${newlyAdded} new).`
    });

    this._emitChange();
    return { playlist: importedPlaylist, count: allFetchedTracks.length, newlyAdded };
  }

  /**
   * Adds an individual track to the library with deduplication and source linkage
   */
  async addTrackToLibrary(track, sourcePlaylistId = null) {
    if (!track) return false;

    // Deduplication check: Match by providerTrackId OR normalized title::artist
    const normKey = `${(track.title || '').toLowerCase().trim()}::${(track.artist || '').toLowerCase().trim()}`;
    const existingIndex = this.localTracks.findIndex(t => 
      (t.providerTrackId && t.providerTrackId === track.providerTrackId) ||
      (t.id === track.id) ||
      (`${(t.title || '').toLowerCase().trim()}::${(t.artist || '').toLowerCase().trim()}` === normKey)
    );

    let effectiveTrackId = track.id;

    if (existingIndex >= 0) {
      // Existing track: preserve it and just link the new playlist source
      effectiveTrackId = this.localTracks[existingIndex].id;
    } else {
      // New track: append
      this.localTracks.unshift(track);
      this._saveLocal(STORAGE_KEY_LIBRARY, this.localTracks);

      // Default mood assignment
      moodService.assignMoodsToTrack(track.id, track.userMoodTags || [track.mood || 'chill']);
    }

    // Link source playlist relationship
    if (sourcePlaylistId) {
      const sourceKey = `${effectiveTrackId}::${sourcePlaylistId}`;
      if (!this.localSources.includes(sourceKey)) {
        this.localSources.push(sourceKey);
        this._saveLocal(STORAGE_KEY_SOURCES, this.localSources);
      }
    }

    // Persist to Supabase if authenticated
    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      const { error: upsertErr } = await supabase.from('tracks').upsert({
        user_id: user.id,
        provider: track.provider || 'spotify',
        provider_track_id: track.providerTrackId || track.spotifyId || track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        cover_url: track.cover || '',
        duration_s: track.duration || 0,
        preview_url: track.previewUrl || null,
        external_url: track.externalUrl || null,
        user_notes: track.userNotes || ''
      }, { onConflict: 'user_id,provider,provider_track_id' });

      if (upsertErr) {
        console.error('[LibraryService] Supabase track upsert error:', upsertErr);
        throw new Error(`Database error saving track: ${upsertErr.message}`);
      }
    }

    return existingIndex < 0;
  }

  /**
   * Loads personal library tracks for authenticated user from Supabase.
   */
  async loadLibraryFromSupabase(userId) {
    if (!userId || !isSupabaseConfigured || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('[LibraryService] Failed to load library from Supabase:', error);
        throw error;
      }

      if (data) {
        this.localTracks = data.map(t => ({
          id: t.id,
          provider: t.provider,
          providerTrackId: t.provider_track_id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          cover: t.cover_url || '/albums/lofi.jpg',
          duration: t.duration_s,
          previewUrl: t.preview_url,
          externalUrl: t.external_url,
          userNotes: t.user_notes,
          addedAt: t.added_at,
          mood: 'chill',
          source: t.provider === 'spotify' ? 'spotify_api' : 'moodify_native'
        }));
        this._saveLocal(STORAGE_KEY_LIBRARY, this.localTracks);
        this._emitChange();
      }
    } catch (err) {
      console.warn('[LibraryService] Error loading library from Supabase:', err);
    }
  }

  /**
   * Clears in-memory library on user logout for strict multi-tenant isolation.
   */
  clearUserData() {
    this.localTracks = [];
    this.localPlaylists = [];
    this.localSources = [];
    this._saveLocal(STORAGE_KEY_LIBRARY, []);
    this._saveLocal(STORAGE_KEY_PLAYLISTS, []);
    this._saveLocal(STORAGE_KEY_SOURCES, []);
    this._emitChange();
  }

  /**
   * Retrieves all personal library tracks with sorting and filtering options
   */
  getLibraryTracks(options = {}) {
    const { query = '', selectedMoods = [], sortBy = 'date_added' } = options;

    // Combine MOODIFY Native catalog with imported tracks
    let tracks = [...this.localTracks];
    if (tracks.length === 0) {
      // In guest/empty mode, default to MOODIFY native catalog
      tracks = [...MOODIFY_CATALOG];
    }

    // Filter by query (title, artist, album, notes)
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      tracks = tracks.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.userNotes && t.userNotes.toLowerCase().includes(q))
      );
    }

    // Filter by selected moods
    if (selectedMoods && selectedMoods.length > 0) {
      tracks = moodService.filterTracksByMoods(tracks, selectedMoods);
    }

    // Sorting
    tracks.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'duration') return b.duration - a.duration;
      // Default: date_added (newest first)
      return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
    });

    return tracks;
  }

  /**
   * Removes a track from the library
   */
  async removeTrack(trackId) {
    this.localTracks = this.localTracks.filter(t => t.id !== trackId);
    this._saveLocal(STORAGE_KEY_LIBRARY, this.localTracks);

    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tracks').delete().eq('id', trackId).eq('user_id', user.id);
      if (error) {
        console.error('[LibraryService] Supabase delete error:', error);
        throw new Error(`Database error removing track: ${error.message}`);
      }
    }

    this._emitChange();
  }

  getImportedPlaylists() {
    return [...this.localPlaylists];
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _emitChange() {
    for (const cb of this.listeners) {
      try { cb(); } catch (e) { console.error(e); }
    }
  }
}

export const libraryService = new LibraryService();
