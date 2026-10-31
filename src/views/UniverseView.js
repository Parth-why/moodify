/**
 * @file UniverseView.js
 * MOODIFY V2 — "MY UNIVERSE" Personal Music Library.
 *
 * Implements:
 * - Rich library showcase with album artwork, artists, and playlists
 * - Real-time library search
 * - Simple sorting (Date Added, Title, Artist, Duration)
 * - Multi-mood tagging & filtering
 * - Spotify playlist source association
 * - Clear "+ Import Spotify Playlist" action
 * - Welcoming empty state with guided onboarding
 */

import { appState } from '../state/appState.js';
import { libraryService } from '../services/library/libraryService.js';
import { moodService, DEFAULT_MOODS } from '../services/moods/moodService.js';
import { showToast } from '../components/Toast.js';

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function renderUniverseView(container) {
  let searchQuery = '';
  let selectedMoodFilter = 'all';
  let sortBy = 'date_added';

  const render = async () => {
    let tracks = libraryService.getLibraryTracks({ sortBy });
    const playlists = libraryService.getImportedPlaylists();
    const allMoods = await moodService.getAllMoods();

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tracks = tracks.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (moodService.getTrackMoods(t).some(m => m.toLowerCase().includes(q)))
      );
    }

    // Filter by selected mood
    if (selectedMoodFilter !== 'all') {
      tracks = tracks.filter(t => 
        moodService.getTrackMoods(t).some(m => m.toLowerCase() === selectedMoodFilter.toLowerCase())
      );
    }

    const currentTrackId = appState.currentTrack?.id;
    const isPlaying = appState.isPlaying;

    container.innerHTML = `
      <div class="view-universe animate-fade-in">
        <!-- Library Header -->
        <header class="universe-header">
          <div class="universe-header-left">
            <div class="universe-badge">
              <span>MY UNIVERSE</span>
            </div>
            <h1 class="universe-title">Your Sonic Constellation</h1>
            <p class="universe-subtitle">
              ${libraryService.localTracks.length} tracks cataloged across ${playlists.length} source playlist${playlists.length === 1 ? '' : 's'}
            </p>
          </div>

          <div class="universe-header-actions">
            <button id="btn-import-playlist-main" class="btn-spotify-glow btn-large">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>+ Import Spotify Playlist</span>
            </button>
          </div>
        </header>

        <!-- Search & Filter Controls -->
        <div class="universe-controls-bar">
          <div class="universe-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="search" 
              id="library-search-input" 
              placeholder="Filter by song, artist, album, or mood tag..."
              value="${searchQuery}"
            />
          </div>

          <div class="universe-filter-group">
            <!-- Mood Filter Dropdown -->
            <select id="select-mood-filter" class="filter-select">
              <option value="all" ${selectedMoodFilter === 'all' ? 'selected' : ''}>All Moods (${allMoods.length})</option>
              ${allMoods.map(m => `
                <option value="${m.name.toLowerCase()}" ${selectedMoodFilter === m.name.toLowerCase() ? 'selected' : ''}>
                  #${m.name}
                </option>
              `).join('')}
            </select>

            <!-- Sort By Selector -->
            <select id="select-sort-order" class="filter-select">
              <option value="date_added" ${sortBy === 'date_added' ? 'selected' : ''}>Sort: Date Added</option>
              <option value="title" ${sortBy === 'title' ? 'selected' : ''}>Sort: Title</option>
              <option value="artist" ${sortBy === 'artist' ? 'selected' : ''}>Sort: Artist</option>
              <option value="duration" ${sortBy === 'duration' ? 'selected' : ''}>Sort: Duration</option>
            </select>
          </div>
        </div>

        <!-- Track List / Table -->
        ${tracks.length === 0 ? `
          <div class="universe-empty-state">
            <div class="empty-icon-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <h3 class="empty-title">
              ${libraryService.localTracks.length === 0 
                ? 'Your Personal Universe is Empty' 
                : 'No tracks match your current filters'}
            </h3>
            <p class="empty-description">
              ${libraryService.localTracks.length === 0
                ? 'Connect your Spotify account to import accessible playlists, or explore and tag tracks from the Discover tab.'
                : 'Try adjusting your search query or reset the mood filter to view all your songs.'}
            </p>
            ${libraryService.localTracks.length === 0 ? `
              <div class="empty-actions">
                <button id="btn-empty-import" class="btn-spotify-glow btn-large">
                  Connect & Import Playlists →
                </button>
                <button id="btn-empty-discover" class="btn-secondary-surface btn-large">
                  Explore Discover Catalog
                </button>
              </div>
            ` : `
              <button id="btn-reset-filters" class="btn-secondary-surface btn-small">
                Reset Filters
              </button>
            `}
          </div>
        ` : `
          <div class="universe-track-table">
            <div class="table-header-row">
              <span class="col-th col-index">#</span>
              <span class="col-th col-title">TITLE</span>
              <span class="col-th col-source">SOURCE PLAYLIST</span>
              <span class="col-th col-moods">MOOD TAGS</span>
              <span class="col-th col-time">DURATION</span>
              <span class="col-th col-actions"></span>
            </div>

            <div class="table-body">
              ${tracks.map((t, index) => {
                const isCurrent = t.id === currentTrackId;
                const isTrackPlaying = isCurrent && isPlaying;
                const assignedMoods = moodService.getTrackMoods(t);
                const isFav = appState.isFavorite(t.id);

                return `
                  <div class="table-row ${isCurrent ? 'active-row' : ''}" data-track-id="${t.id}">
                    <div class="col-cell col-index">
                      <span class="track-num">${index + 1}</span>
                      <button class="track-row-play-btn" aria-label="Play ${t.title}">
                        ${isTrackPlaying ? `
                          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ` : `
                          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                        `}
                      </button>
                    </div>

                    <div class="col-cell col-title">
                      <div class="track-cover-sm">
                        <img src="${t.cover || '/albums/lofi.jpg'}" alt="${t.title}" />
                      </div>
                      <div class="track-meta-wrap">
                        <span class="track-name-bold">${t.title}</span>
                        <span class="track-artist-sub">${t.artist} ${t.album ? `• ${t.album}` : ''}</span>
                      </div>
                    </div>

                    <div class="col-cell col-source">
                      <span class="source-tag">
                        ${t.sourcePlaylist || '✦ My Universe'}
                      </span>
                    </div>

                    <div class="col-cell col-moods">
                      <div class="mood-pill-cluster">
                        ${assignedMoods.map(m => `
                          <span class="mood-tag-interactive" title="Mood: #${m}">#${m}</span>
                        `).join('')}
                        <button class="btn-tag-add" data-track-id="${t.id}" title="Assign more moods">+</button>
                      </div>
                    </div>

                    <div class="col-cell col-time">
                      <span>${formatDuration(t.duration)}</span>
                    </div>

                    <div class="col-cell col-actions">
                      <button class="btn-cell-action btn-fav ${isFav ? 'favorited' : ''}" data-track-id="${t.id}" title="Favorite">
                        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                      <button class="btn-cell-action btn-delete-track" data-track-id="${t.id}" title="Remove from Library">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}
      </div>
    `;

    // Event listeners
    container.querySelector('#library-search-input')?.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      render();
    });

    container.querySelector('#select-mood-filter')?.addEventListener('change', (e) => {
      selectedMoodFilter = e.target.value;
      render();
    });

    container.querySelector('#select-sort-order')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      searchQuery = '';
      selectedMoodFilter = 'all';
      render();
    });

    // Import playlist button
    const openImporter = () => {
      window.dispatchEvent(new CustomEvent('moodify:openPlaylistImporter'));
    };
    container.querySelector('#btn-import-playlist-main')?.addEventListener('click', openImporter);
    container.querySelector('#btn-empty-import')?.addEventListener('click', openImporter);
    container.querySelector('#btn-empty-discover')?.addEventListener('click', () => {
      appState.setCurrentView('discover');
    });

    // Row playback
    container.querySelectorAll('.table-row').forEach(row => {
      const trackId = row.dataset.trackId;
      row.addEventListener('click', (e) => {
        // Prevent trigger if clicking tag-add, delete, or favorite
        if (e.target.closest('.btn-tag-add') || e.target.closest('.btn-cell-action')) return;
        const track = tracks.find(t => t.id === trackId);
        if (track) {
          appState.playTrack(track);
        }
      });
    });

    // Favorite button
    container.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        appState.toggleFavorite(trackId);
        render();
      });
    });

    // Delete track from library
    container.querySelectorAll('.btn-delete-track').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        if (confirm('Remove this track from your personal library?')) {
          await libraryService.removeTrack(trackId);
          showToast('Track removed from your universe.', 'info');
          render();
        }
      });
    });

    // Add mood tags to track
    container.querySelectorAll('.btn-tag-add').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;

        const currentTags = moodService.getTrackMoods(track).join(', ');
        const input = prompt(
          `Assign moods to "${track.title}" (comma separated):\nAvailable: Chill, Dreamy, Melancholic, Energetic, Romantic, Happy, Confident, etc.`,
          currentTags
        );

        if (input !== null) {
          const newTags = input.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
          if (newTags.length > 0) {
            await moodService.assignMoodsToTrack(track, newTags);
            showToast(`Assigned ${newTags.length} mood tag(s) to "${track.title}"`, 'success');
            render();
          }
        }
      });
    });
  };

  render();
  libraryService.subscribe(render);
  appState.on('playbackChange', render);
}
