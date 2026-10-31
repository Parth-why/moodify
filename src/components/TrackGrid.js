/**
 * @file TrackGrid.js
 * Music Track Showcase Grid & Queue Display.
 *
 * Renders album cards with interactive play controls, audio attributes, and favorites.
 */

import { appState } from '../state/appState.js';
import { userMoodStore } from '../services/userdata/userMoodStore.js';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function renderTrackGrid(container) {
  const render = () => {
    const tracks = appState.tracks || [];
    const currentTrackId = appState.currentTrack?.id;
    const isPlaying = appState.isPlaying;

    container.innerHTML = `
      <section class="tracks-section" aria-label="Curated Mood Tracks">
        <div class="tracks-header-row">
          <div class="tracks-title-group">
            <h2 class="tracks-heading">Matching Sonic Tracks</h2>
            <span class="tracks-count">${tracks.length} sonic profiles matched</span>
          </div>
          <div class="tracks-view-filter">
            <span class="active-filter-tag">Sorted by: Mood Proximity</span>
          </div>
        </div>

        ${tracks.length === 0 ? `
          <div class="empty-tracks-state glass-card">
            <p>No tracks found matching your query. Try resetting your search or picking another mood.</p>
          </div>
        ` : `
          <div class="tracks-grid">
            ${tracks.map((track) => {
              const isCurrent = track.id === currentTrackId;
              const isTrackPlaying = isCurrent && isPlaying;
              const isFav = appState.isFavorite(track.id);

              return `
                <article class="track-card glass-card ${isCurrent ? 'is-active-track' : ''}" data-id="${track.id}">
                  <div class="track-cover-wrapper">
                    <img src="${track.cover}" alt="${track.title} album art" class="track-cover-img" loading="lazy"/>
                    
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
                    <p class="track-album-name">${track.album}</p>

                    <div class="track-footer-row">
                      <span class="track-mood-badge">#${track.mood}</span>
                      <span class="track-duration">${formatDuration(track.duration)}</span>
                    </div>

                    <div class="track-source-row">
                      <span class="source-badge ${track.source === 'spotify_api' ? 'spotify-src' : 'native-src'}">
                        ${track.source === 'spotify_api' ? 'Spotify Catalog' : 'MOODIFY Native'}
                      </span>
                      <button class="btn-tag-mood" data-tag-id="${track.id}" title="Assign custom mood tag">
                        Tag Mood
                      </button>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `}
      </section>
    `;

    // Click handler for card play
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
        if (e.target.closest('.btn-favorite') || e.target.closest('.track-play-btn')) return;
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

    // Tag Mood button clicks (Enforces Phase 1, Req 3: User-assigned moods)
    container.querySelectorAll('.btn-tag-mood').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.tagId;
        const newMood = prompt(
          'Assign your own mood to this track (e.g. joyful, chill, energetic, focused, cyberpunk, melancholy):'
        );
        if (newMood && newMood.trim()) {
          userMoodStore.assignMoodToTrack(trackId, newMood.trim().toLowerCase());
          appState.setMood(appState.currentMood);
        }
      });
    });
  };

  render();
  appState.on('moodChange', () => render());
  appState.on('tracksChange', () => render());
  appState.on('playbackChange', () => render());
  appState.on('favoritesChange', () => render());
}
