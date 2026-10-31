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
   * Fetches accessible playlists from Spotify Web API with pagination
   * @returns {Promise<Array<any>>}
   */
  async fetchSpotifyPlaylists() {
    if (!spotifyClient.accessToken) {
      throw new Error('Spotify is not connected. Please connect via PKCE or provide a developer token.');
    }

    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
    const allPlaylists = [];

    while (url) {
      const response = await spotifyClient.fetchWithAuth(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Spotify token expired. Please re-authenticate.');
        }
        throw new Error(`Failed to fetch playlists from Spotify (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.items || [];

      for (const p of items) {
        if (!p || !p.id) continue;
        allPlaylists.push({
          id: p.id,
          name: p.name,
          description: p.description || '',
          coverUrl: p.images?.[0]?.url || '/albums/focus.jpg',
          totalTracks: p.tracks?.total || 0,
          owner: p.owner?.display_name || 'Spotify User',
          isPublic: p.public,
          externalUrl: p.external_urls?.spotify || ''
        });
      }

      url = data.next || null;
      // Cap at 150 playlists to prevent runaway requests
      if (allPlaylists.length >= 150) break;
    }

    return allPlaylists;
  }

  /**
   * Imports an individual Spotify track given a URL or URI.
   * Accepts:
   * - https://open.spotify.com/track/{id}
   * - spotify:track:{id}
   * - bare 22-char Spotify ID
   * Rejects non-track links, unavailable tracks, and invalid URLs.
   *
   * @param {string} input
   * @returns {Promise<{ success: boolean, isDuplicate: boolean, track: Object }>}
   */
  async importTrackByUrlOrUri(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Please enter a Spotify track URL or URI.');
    }

    const trimmed = input.trim();

    // Check if it's a playlist or album link
    if (trimmed.includes('open.spotify.com/playlist') || trimmed.startsWith('spotify:playlist')) {
      throw new Error('This is a Spotify playlist link. Please use the Playlist Importer to import full playlists.');
    }
    if (trimmed.includes('open.spotify.com/album') || trimmed.startsWith('spotify:album')) {
      throw new Error('This is a Spotify album link. MOODIFY supports importing individual tracks or playlists.');
    }
    if (trimmed.includes('open.spotify.com/artist') || trimmed.startsWith('spotify:artist')) {
      throw new Error('This is a Spotify artist link, not a playable track.');
    }

    // Extract track ID
    let trackId = null;
    const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    const uriMatch = trimmed.match(/^spotify:track:([a-zA-Z0-9]{22})$/);

    if (urlMatch) {
      trackId = urlMatch[1];
    } else if (uriMatch) {
      trackId = uriMatch[1];
    } else if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
      trackId = trimmed;
    } else {
      throw new Error('Invalid Spotify track format. Supported: "https://open.spotify.com/track/..." or "spotify:track:..."');
    }

    // Fetch from Spotify Web API
    const trackData = await spotifyClient.getTrack(trackId);
    trackData.sourcePlaylist = '✦ Single Track Import';

    // Add to library with deduplication
    const wasAdded = await this.addTrackToLibrary(trackData, null, '✦ Single Track Import');
    this._emitChange();

    return {
      success: true,
      isDuplicate: !wasAdded,
      track: trackData
    };
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
    const metaRes = await spotifyClient.fetchWithAuth(`https://api.spotify.com/v1/playlists/${playlistId}`);

    if (!metaRes.ok) {
      throw new Error(`Could not access playlist (${metaRes.status}): ${metaRes.statusText}`);
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

    // 2. Initialize Supabase import_job record if authenticated
    let jobId = null;
    const user = authService.getUser();
    if (user && isSupabaseConfigured && supabase) {
      try {
        const { data: job } = await supabase.from('import_jobs').insert({
          user_id: user.id,
          source: 'spotify_playlist',
          status: 'processing',
          total_items: totalTracks,
          processed_items: 0
        }).select('id').single();
        if (job) jobId = job.id;
      } catch (err) {
        console.warn('[LibraryService] Could not initialize import job in Supabase:', err);
      }
    }

    // 3. Upsert into Supabase imported_playlists to obtain UUID
    let dbPlaylistId = null;
    if (user && isSupabaseConfigured && supabase) {
      try {
        const { data: dbPl } = await supabase.from('imported_playlists').upsert({
          user_id: user.id,
          provider: 'spotify',
          provider_playlist_id: playlistId,
          name: importedPlaylist.name,
          description: importedPlaylist.description,
          cover_url: importedPlaylist.coverUrl,
          total_tracks: totalTracks,
          import_status: 'completed'
        }, { onConflict: 'user_id,provider,provider_playlist_id' }).select('id').single();
        if (dbPl) dbPlaylistId = dbPl.id;
      } catch (err) {
        console.warn('[LibraryService] Supabase playlist sync error:', err);
      }
    }

    // 4. Paginate tracks
    let offset = 0;
    const limit = 100;
    const allFetchedTracks = [];

    while (offset < totalTracks) {
      onProgress({
        status: 'importing_tracks',
        progress: Math.min(90, Math.round(15 + (offset / Math.max(1, totalTracks)) * 75)),
        message: `Importing tracks (${offset}/${totalTracks})...`
      });

      const tracksRes = await spotifyClient.fetchWithAuth(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`);

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
          sourcePlaylist: playlistData.name,
          mood: 'chill',
          userMoodTags: ['chill'],
          userNotes: `Imported from playlist "${playlistData.name}"`,
          addedAt: new Date().toISOString()
        });
      }

      offset += limit;
    }

    // 5. Deduplication and persistence
    let newlyAdded = 0;
    for (const track of allFetchedTracks) {
      const added = await this.addTrackToLibrary(track, playlistId, playlistData.name, dbPlaylistId);
      if (added) newlyAdded++;
    }

    // Record imported playlist in state
    this.localPlaylists = this.localPlaylists.filter(p => p.providerPlaylistId !== playlistId);
    this.localPlaylists.unshift(importedPlaylist);
    this._saveLocal(STORAGE_KEY_PLAYLISTS, this.localPlaylists);

    // Finalize import job in Supabase
    if (jobId && user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('import_jobs').update({
          status: 'completed',
          processed_items: allFetchedTracks.length,
          completed_at: new Date().toISOString()
        }).eq('id', jobId);
      } catch (err) {
        console.warn('[LibraryService] Failed to complete import job in Supabase:', err);
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
  async addTrackToLibrary(track, sourcePlaylistId = null, sourcePlaylistName = null, dbPlaylistId = null) {
    if (!track) return false;

    // Deduplication check: Match by providerTrackId (most stable) OR normalized title::artist
    const normKey = `${(track.title || '').toLowerCase().trim()}::${(track.artist || '').toLowerCase().trim()}`;
    const existingIndex = this.localTracks.findIndex(t => 
      (t.providerTrackId && track.providerTrackId && t.providerTrackId === track.providerTrackId) ||
      (t.id === track.id) ||
      (`${(t.title || '').toLowerCase().trim()}::${(t.artist || '').toLowerCase().trim()}` === normKey)
    );

    let effectiveTrackId = track.id;

    if (existingIndex >= 0) {
      // Existing track: preserve it and just link the new playlist source
      const existing = this.localTracks[existingIndex];
      effectiveTrackId = existing.id;
      if (sourcePlaylistName && !existing.sourcePlaylist) {
        existing.sourcePlaylist = sourcePlaylistName;
      }
    } else {
      // New track: append
      if (sourcePlaylistName) {
        track.sourcePlaylist = sourcePlaylistName;
      }
      this.localTracks.unshift(track);
      this._saveLocal(STORAGE_KEY_LIBRARY, this.localTracks);

      // Default mood assignment
      moodService.assignMoodsToTrack(track.id, track.userMoodTags || [track.mood || 'chill']);
    }

    // Link source playlist relationship locally
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
      const { data: dbTrack, error: upsertErr } = await supabase.from('tracks').upsert({
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
      }, { onConflict: 'user_id,provider,provider_track_id' }).select('id').single();

      if (upsertErr) {
        console.error('[LibraryService] Supabase track upsert error:', upsertErr);
        throw new Error(`Database error saving track: ${upsertErr.message}`);
      }

      // Link to playlist_track_sources table if dbPlaylistId is available
      if (dbTrack && dbPlaylistId) {
        try {
          await supabase.from('playlist_track_sources').upsert({
            user_id: user.id,
            track_id: dbTrack.id,
            playlist_id: dbPlaylistId
          }, { onConflict: 'user_id,track_id,playlist_id' });
        } catch (srcErr) {
          console.warn('[LibraryService] Could not link playlist_track_sources in Supabase:', srcErr);
        }
      }
    }

    return existingIndex < 0;
  }

  /**
   * Loads personal library tracks for authenticated user from Supabase,
   * restoring tracks, source playlist links, and mood assignments.
   */
  async loadLibraryFromSupabase(userId) {
    if (!userId || !isSupabaseConfigured || !supabase) return;

    try {
      // 1. Fetch tracks
      const { data: tracksData, error: tracksErr } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (tracksErr) throw tracksErr;

      // 2. Fetch imported playlists
      const { data: playlistsData } = await supabase
        .from('imported_playlists')
        .select('*')
        .eq('user_id', userId);

      const playlistMap = new Map();
      if (playlistsData) {
        this.localPlaylists = playlistsData.map(p => ({
          id: p.id,
          provider: p.provider,
          providerPlaylistId: p.provider_playlist_id,
          name: p.name,
          description: p.description,
          coverUrl: p.cover_url,
          totalTracks: p.total_tracks,
          importStatus: p.import_status
        }));
        this._saveLocal(STORAGE_KEY_PLAYLISTS, this.localPlaylists);
        for (const pl of playlistsData) {
          playlistMap.set(pl.id, pl.name);
        }
      }

      // 3. Fetch playlist_track_sources
      const { data: sourcesData } = await supabase
        .from('playlist_track_sources')
        .select('track_id, playlist_id')
        .eq('user_id', userId);

      const trackSourcesMap = new Map();
      if (sourcesData) {
        this.localSources = [];
        for (const src of sourcesData) {
          this.localSources.push(`${src.track_id}::${src.playlist_id}`);
          const currentList = trackSourcesMap.get(src.track_id) || [];
          const plName = playlistMap.get(src.playlist_id);
          if (plName && !currentList.includes(plName)) {
            currentList.push(plName);
          }
          trackSourcesMap.set(src.track_id, currentList);
        }
        this._saveLocal(STORAGE_KEY_SOURCES, this.localSources);
      }

      // 4. Fetch track_moods joined with moods
      const { data: trackMoodsData } = await supabase
        .from('track_moods')
        .select('track_id, moods(name)')
        .eq('user_id', userId);

      const moodsMap = new Map();
      if (trackMoodsData) {
        for (const tm of trackMoodsData) {
          const mName = tm.moods?.name;
          if (mName) {
            const list = moodsMap.get(tm.track_id) || [];
            if (!list.includes(mName.toLowerCase())) {
              list.push(mName.toLowerCase());
            }
            moodsMap.set(tm.track_id, list);
          }
        }
      }

      // 5. Map tracks with source and mood info
      if (tracksData) {
        this.localTracks = tracksData.map(t => {
          const sourcePlaylists = trackSourcesMap.get(t.id) || [];
          const assignedMoods = moodsMap.get(t.id) || ['chill'];
          const primarySource = sourcePlaylists.length > 0 
            ? (sourcePlaylists.length > 1 ? `${sourcePlaylists[0]} (+${sourcePlaylists.length - 1})` : sourcePlaylists[0])
            : (t.provider === 'spotify' ? '✦ Spotify Track' : '✦ My Universe');

          return {
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
            mood: assignedMoods[0] || 'chill',
            userMoodTags: assignedMoods,
            sourcePlaylist: primarySource,
            sourcePlaylists: sourcePlaylists,
            source: t.provider === 'spotify' ? 'spotify_api' : 'moodify_native'
          };
        });
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

  getSourcePlaylistsForTrack(trackId) {
    if (!trackId) return [];
    const track = this.localTracks.find(t => t.id === trackId);
    if (track?.sourcePlaylists && Array.isArray(track.sourcePlaylists)) {
      return track.sourcePlaylists;
    }
    const matched = [];
    for (const item of this.localSources) {
      if (typeof item === 'string' && item.startsWith(`${trackId}::`)) {
        const pId = item.split('::')[1];
        const pl = this.localPlaylists.find(p => p.providerPlaylistId === pId || p.id === pId);
        if (pl && !matched.includes(pl.name)) matched.push(pl.name);
      }
    }
    return matched;
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
