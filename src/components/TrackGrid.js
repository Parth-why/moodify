/**
 * @file TrackGrid.js
 * Music Track Showcase Grid & "My Universe" Library Manager for MOODIFY V1.5.
 *
 * Implements:
 * - View mode toggle: Curated Moodscapes vs. My Universe Library
 * - Multi-mood tagging per track (e.g. Nostalgic + Dreamy + Melancholic)
 * - Sorting by Date Added, Title, Artist, and Duration
 * - Spotify Playlist Importer launcher
 * - Source playlist indicators and library track deletion
 */

import { appState } from '../state/appState.js';
import { moodService, DEFAULT_MOODS } from '../services/moods/moodService.js';
import { libraryService } from '../services/library/libraryService.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { showToast } from './Toast.js';

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

let activeViewMode = 'moodscape'; // 'moodscape' | 'library'
let currentSortBy = 'date_added';

export function renderTrackGrid(container) {
  const render = () => {
    let tracks = [];
    if (activeViewMode === 'library') {
      tracks = libraryService.getLibraryTracks({ sortBy: currentSortBy });
    } else {
      tracks = appState.tracks || [];
    }

    const currentTrackId = appState.currentTrack?.id;
    const isPlaying = appState.isPlaying;

    container.innerHTML = `
      <section class="tracks-section" aria-label="Music Library and Tracks">
        <!-- View Mode Switcher & Controls Header -->
        <div class="tracks-header-row">
          <div class="tracks-title-group">
            <div class="library-view-switcher">
              <button class="view-switch-btn ${activeViewMode === 'moodscape' ? 'active' : ''}" id="btn-view-moodscape">
                Sonic Moodscape
              </button>
              <button class="view-switch-btn ${activeViewMode === 'library' ? 'active' : ''}" id="btn-view-library">
                🪐 My Universe Library (${libraryService.localTracks.length})
              </button>
            </div>
            <span class="tracks-count">${tracks.length} sonic profiles</span>
          </div>

          <div class="tracks-view-filter">
            ${activeViewMode === 'library' ? `
              <button id="btn-open-playlist-importer" class="btn-spotify btn-small" style="margin-right: 8px;">
                + Import Spotify Playlist
              </button>
              <select id="select-sort-tracks" class="sort-select">
                <option value="date_added" ${currentSortBy === 'date_added' ? 'selected' : ''}>Sort: Date Added</option>
                <option value="title" ${currentSortBy === 'title' ? 'selected' : ''}>Sort: Title</option>
                <option value="artist" ${currentSortBy === 'artist' ? 'selected' : ''}>Sort: Artist</option>
                <option value="duration" ${currentSortBy === 'duration' ? 'selected' : ''}>Sort: Duration</option>
              </select>
            ` : `
              <span class="active-filter-tag">Filter: #${appState.currentMood}</span>
            `}
          </div>
        </div>

        ${tracks.length === 0 ? `
          <div class="empty-tracks-state glass-card text-center" style="padding: 40px 20px;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🪐</div>
            <h3 style="font-family: var(--font-display); color: #fff; margin-bottom: 8px;">
              ${activeViewMode === 'library' ? 'Your Personal Universe is Empty' : 'No Tracks Found for this Mood'}
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px;">
              ${activeViewMode === 'library' 
                ? 'Import accessible playlists from your Spotify account or explore and tag tracks from MOODIFY\'s native catalog.' 
                : 'Try selecting a different mood chip above or search for an artist, track, or vibe.'}
            </p>
            ${activeViewMode === 'library' ? `
              <button id="btn-empty-import-playlist" class="btn-primary btn-glow">
                Import from Spotify →
              </button>
            ` : ''}
          </div>
        ` : `
          <div class="tracks-grid">
            ${tracks.map((track) => {
              const isCurrent = track.id === currentTrackId;
              const isTrackPlaying = isCurrent && isPlaying;
              const isFav = appState.isFavorite(track.id);
              const assignedMoods = moodService.getTrackMoods(track);

              return `
                <article class="track-card glass-card ${isCurrent ? 'is-active-track' : ''}" data-id="${track.id}">
                  <div class="track-cover-wrapper">
                    <img src="${track.cover || '/albums/lofi.jpg'}" alt="${track.title} album art" class="track-cover-img" loading="lazy"/>
                    
                    <!-- Play / Pause Overlay -->
                    <button class="track-play-btn ${isTrackPlaying ? 'playing' : ''}" aria-label="${isTrackPlaying ? 'Pause' : 'Play'} ${track.title}">
                      ${isTrackPlaying ? `
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ` : `
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      `}
                    </button>

                    ${isTrackPlaying ? `
                      <div class="playing-equalizer-badge">
                        <span></span><span></span><span></span>
                      </div>
                    ` : ''}
                  </div>

                  <div class="track-details">
                    <div class="track-title-row">
                      <h4 class="track-title" title="${track.title}">${track.title}</h4>
                      <button class="btn-favorite ${isFav ? 'active' : ''}" data-fav-id="${track.id}" aria-label="Favorite track">
                        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>

                    <p class="track-artist">${track.artist}</p>
                    <p class="track-album-name">${track.album || ''}</p>

                    <!-- Multi-Mood Badges -->
                    <div class="track-moods-multi-row">
                      ${assignedMoods.map(m => `
                        <span class="track-mood-badge">#${m}</span>
                      `).join('')}
                    </div>

                    <div class="track-footer-row">
                      <span class="source-badge ${track.source === 'spotify_api' ? 'spotify-src' : 'native-src'}">
                        ${track.source === 'spotify_api' ? 'Spotify Catalog' : 'MOODIFY Native'}
                      </span>
                      <span class="track-duration">${formatDuration(track.duration)}</span>
                    </div>

                    <div class="track-actions-bottom">
                      <button class="btn-tag-mood" data-tag-id="${track.id}" title="Assign multiple moods">
                        🏷️ Tag Moods
                      </button>
                      ${activeViewMode === 'library' ? `
                        <button class="btn-remove-track" data-remove-id="${track.id}" title="Remove from My Universe">
                          ✕ Remove
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `}
      </section>
    `;

    // View mode switchers
    container.querySelector('#btn-view-moodscape')?.addEventListener('click', () => {
      activeViewMode = 'moodscape';
      render();
    });

    container.querySelector('#btn-view-library')?.addEventListener('click', () => {
      activeViewMode = 'library';
      render();
    });

    // Sort select handler
    const sortSelect = container.querySelector('#select-sort-tracks');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        render();
      });
    }

    // Play click handlers
    container.querySelectorAll('.track-card').forEach(card => {
      const trackId = card.dataset.id;
      const track = tracks.find(t => t.id === trackId);
      const playBtn = card.querySelector('.track-play-btn');

      if (playBtn && track) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (appState.currentTrack?.id === track.id) {
            appState.togglePlay();
          } else {
            appState.playTrack(track);
          }
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-favorite') || e.target.closest('.track-play-btn') || e.target.closest('.btn-tag-mood') || e.target.closest('.btn-remove-track')) return;
        if (track) {
          appState.playTrack(track);
        }
      });
    });

    // Favorite button clicks
    container.querySelectorAll('.btn-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const favId = btn.dataset.favId;
        appState.toggleFavorite(favId);
      });
    });

    // Tag Moods button clicks (Multi-Mood tagging support)
    container.querySelectorAll('.btn-tag-mood').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.tagId;
        const currentMoods = moodService.getTrackMoods({ id: trackId });

        const promptInput = prompt(
          `Assign multiple moods separated by commas (e.g. "nostalgic, dreamy, melancholy"):\nCurrently: [${currentMoods.join(', ')}]`
        );

        if (promptInput !== null && promptInput.trim()) {
          const newMoods = promptInput
            .split(',')
            .map(m => m.trim().toLowerCase())
            .filter(Boolean);

          if (newMoods.length > 0) {
            await moodService.assignMoodsToTrack(trackId, newMoods);
            showToast(`Updated moods for track to: #${newMoods.join(', #')}`, 'success');
            render();
          }
        }
      });
    });

    // Remove track from library
    container.querySelectorAll('.btn-remove-track').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.removeId;
        if (confirm('Remove this track from your personal library?')) {
          await libraryService.removeTrack(trackId);
          showToast('Track removed from your universe.', 'info');
          render();
        }
      });
    });

    // Playlist importer triggers
    const triggerImporter = () => {
      window.dispatchEvent(new CustomEvent('moodify:openPlaylistImporter'));
    };

    container.querySelector('#btn-open-playlist-importer')?.addEventListener('click', triggerImporter);
    container.querySelector('#btn-empty-import-playlist')?.addEventListener('click', triggerImporter);
  };

  render();
  appState.on('moodChange', () => render());
  appState.on('tracksChange', () => render());
  appState.on('playbackChange', () => render());
  appState.on('favoritesChange', () => render());
  moodService.subscribe(() => render());
  libraryService.subscribe(() => render());
}
