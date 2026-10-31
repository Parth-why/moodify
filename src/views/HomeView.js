/**
 * @file HomeView.js
 * MOODIFY V2 — Elegant Personalized Landing Screen.
 *
 * Implements:
 * - Dynamic time-of-day greeting with user personalization
 * - Clear, high-impact primary action to start a Mood Journey
 * - Curated Mood Frequencies (quick listening)
 * - Recently imported / highlighted universe tracks with rich artwork
 * - Active Mood Journeys preview
 * - Spotify connection status card
 * - Restrained, cinematic aesthetic without dashboard clutter
 */

import { appState } from '../state/appState.js';
import { authService } from '../services/auth/authService.js';
import { libraryService } from '../services/library/libraryService.js';
import { moodService } from '../services/moods/moodService.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { MOODIFY_CATALOG } from '../services/catalog/moodifyCatalog.js';
import { audioPlayer } from '../services/audio/audioPlayer.js';
import { showToast } from '../components/Toast.js';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function renderHomeView(container) {
  const render = async () => {
    const profile = authService.getProfile();
    const isAuth = authService.isAuthenticated();
    const displayName = profile?.display_name || profile?.username || (isAuth ? 'Explorer' : 'Music Lover');
    const greeting = `${getTimeGreeting()}, ${displayName}`;

    // Library tracks or curated highlights
    const libTracks = libraryService.getLibraryTracks();
    const highlightTracks = libTracks.length > 0 ? libTracks.slice(0, 4) : MOODIFY_CATALOG.slice(0, 4);

    // Top Mood Frequencies
    const allMoods = await moodService.getAllMoods();
    const topMoods = allMoods.slice(0, 6);

    // Saved Journeys
    const savedJourneys = appState.savedJourneys || [];

    const isSpotifyConnected = !!spotifyClient.accessToken;

    container.innerHTML = `
      <div class="view-home animate-fade-in">
        <!-- Hero Section -->
        <section class="home-hero-card">
          <div class="hero-backdrop-glow"></div>
          <div class="hero-content">
            <div class="hero-badge-pill">
              <span class="pulse-dot"></span>
              <span>EMOTIONAL FREQUENCY TUNER</span>
            </div>
            <h1 class="hero-heading">${greeting}</h1>
            <p class="hero-subtext">
              Transform how you experience sound. Navigate seamless emotional transitions, 
              curate your personal universe, and harmonize your state of mind.
            </p>
            <div class="hero-actions">
              <button id="btn-hero-journey" class="btn-primary-glow btn-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
                </svg>
                <span>Start a Mood Journey</span>
              </button>
              <button id="btn-hero-synth" class="btn-secondary-surface btn-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4" stroke-linecap="round"/>
                </svg>
                <span>Synthesize Ambient Tone</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Quick Mood Frequencies -->
        <section class="home-section">
          <div class="section-header-clean">
            <div>
              <h2 class="section-title-clean">Tune to a Mood Frequency</h2>
              <p class="section-subtitle-clean">Immediate emotional immersion tuned to your desired wavelength</p>
            </div>
            <button id="btn-see-all-moods" class="btn-text-link">Explore all moods →</button>
          </div>
          <div class="mood-frequency-grid">
            ${topMoods.map(m => {
              const moodKey = m.name.toLowerCase();
              const isCurrent = appState.currentMood?.toLowerCase() === moodKey;
              return `
                <div class="mood-frequency-card ${isCurrent ? 'active' : ''}" data-mood="${moodKey}" style="--mood-tint: ${m.color}">
                  <div class="mood-tint-glow"></div>
                  <div class="mood-card-header">
                    <span class="mood-card-emoji">${m.emoji || '✨'}</span>
                    <button class="mood-card-play-btn" aria-label="Tune into ${m.name}">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8 5 19 12 8 19 8 5"></polygon>
                      </svg>
                    </button>
                  </div>
                  <h3 class="mood-card-name">${m.name}</h3>
                  <span class="mood-card-category">${m.category}</span>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Two-Column Row: Highlights & Recent Journeys -->
        <div class="home-grid-columns">
          <!-- Left: Recent Library Tracks / Highlights -->
          <section class="home-column-section">
            <div class="section-header-clean">
              <div>
                <h2 class="section-title-clean">
                  ${libTracks.length > 0 ? 'Recently in Your Universe' : 'Curated Highlights'}
                </h2>
                <p class="section-subtitle-clean">Personal highlights crafted for your current state</p>
              </div>
              <button id="btn-go-library" class="btn-text-link">Open Universe →</button>
            </div>

            <div class="home-tracks-list">
              ${highlightTracks.map(t => {
                const isPlaying = appState.isPlaying && appState.currentTrack?.id === t.id;
                const assignedMoods = moodService.getTrackMoods(t);
                return `
                  <div class="track-row-compact ${isPlaying ? 'playing' : ''}" data-track-id="${t.id}">
                    <div class="track-compact-cover">
                      <img src="${t.cover || '/albums/lofi.jpg'}" alt="${t.title}" />
                      <button class="track-hover-play" aria-label="Play ${t.title}">
                        ${isPlaying ? `
                          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ` : `
                          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                        `}
                      </button>
                    </div>
                    <div class="track-compact-info">
                      <h4 class="track-compact-title">${t.title}</h4>
                      <p class="track-compact-artist">${t.artist}</p>
                    </div>
                    <div class="track-compact-moods">
                      ${assignedMoods.slice(0, 2).map(m => `
                        <span class="mood-tag-mini">#${m}</span>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          <!-- Right: Recent Mood Journeys & Spotify Integration -->
          <div class="home-column-stack">
            <!-- Mood Journeys Card -->
            <section class="home-column-section">
              <div class="section-header-clean">
                <div>
                  <h2 class="section-title-clean">Mood Journeys</h2>
                  <p class="section-subtitle-clean">Guided transitions between emotional states</p>
                </div>
                <button id="btn-create-journey-link" class="btn-text-link">+ New</button>
              </div>

              ${savedJourneys.length > 0 ? `
                <div class="saved-journeys-compact-list">
                  ${savedJourneys.slice(0, 2).map(j => `
                    <div class="journey-compact-card" data-journey-id="${j.id}">
                      <div class="journey-arc-visual" style="background: linear-gradient(135deg, ${j.originColor || '#818CF8'}, ${j.destColor || '#F59E0B'})"></div>
                      <div class="journey-compact-body">
                        <span class="journey-compact-tag">${j.durationMin || 30} min session</span>
                        <h4 class="journey-compact-name">${j.title}</h4>
                        <span class="journey-compact-route">${j.fromMood} → ${j.toMood}</span>
                      </div>
                      <button class="btn-icon-subtle btn-play-journey" title="Play Journey">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                      </button>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="journey-promo-card">
                  <div class="journey-promo-spectrum"></div>
                  <h4 class="journey-promo-title">Experience Emotional Modulation</h4>
                  <p class="journey-promo-desc">
                    Transition smoothly from feeling overwhelmed to calm clarity, or from low energy to euphoric motivation.
                  </p>
                  <button id="btn-start-first-journey" class="btn-primary-glow btn-small">
                    Design Your First Journey →
                  </button>
                </div>
              `}
            </section>

            <!-- Spotify Connection Status Widget -->
            <section class="spotify-status-card">
              <div class="spotify-card-left">
                <div class="spotify-icon-bubble ${isSpotifyConnected ? 'connected' : ''}">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="spotify-card-title">
                    ${isSpotifyConnected ? 'Spotify Account Connected' : 'Spotify Music Integration'}
                  </h4>
                  <p class="spotify-card-desc">
                    ${isSpotifyConnected 
                      ? 'PKCE authorization active. Playlists and library tracks synchronized.' 
                      : 'Connect via PKCE to import playlists and organize your personal universe.'}
                  </p>
                </div>
              </div>
              <button id="btn-manage-spotify-card" class="${isSpotifyConnected ? 'btn-secondary-surface' : 'btn-spotify-glow'} btn-small">
                ${isSpotifyConnected ? 'Manage' : 'Connect Account'}
              </button>
            </section>
          </div>
        </div>
      </div>
    `;

    // Event Handlers
    container.querySelector('#btn-hero-journey')?.addEventListener('click', () => {
      appState.setCurrentView('journeys');
    });

    container.querySelector('#btn-start-first-journey')?.addEventListener('click', () => {
      appState.setCurrentView('journeys');
    });

    container.querySelector('#btn-create-journey-link')?.addEventListener('click', () => {
      appState.setCurrentView('journeys');
    });

    container.querySelector('#btn-see-all-moods')?.addEventListener('click', () => {
      appState.setCurrentView('discover');
    });

    container.querySelector('#btn-go-library')?.addEventListener('click', () => {
      appState.setCurrentView('library');
    });

    // Ambient Synth generator
    container.querySelector('#btn-hero-synth')?.addEventListener('click', () => {
      const synthTrack = MOODIFY_CATALOG.find(t => t.mood === 'chill') || MOODIFY_CATALOG[0];
      if (synthTrack) {
        appState.playTrack(synthTrack);
        showToast('Synthesizing ambient harmonic chord resonance...', 'info');
      }
    });

    // Mood frequency card clicks
    container.querySelectorAll('.mood-frequency-card').forEach(card => {
      card.addEventListener('click', async () => {
        const mood = card.dataset.mood;
        await appState.setMood(mood);
        if (appState.tracks.length > 0) {
          appState.playTrack(appState.tracks[0]);
        }
        showToast(`Tuned to #${mood} frequency`, 'success');
        render();
      });
    });

    // Track play clicks
    container.querySelectorAll('.track-row-compact').forEach(row => {
      row.addEventListener('click', () => {
        const trackId = row.dataset.trackId;
        const track = highlightTracks.find(t => t.id === trackId);
        if (track) {
          appState.playTrack(track);
        }
      });
    });

    // Spotify modal launcher
    container.querySelector('#btn-manage-spotify-card')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
    });
  };

  render();
  appState.on('moodChange', render);
  appState.on('playbackChange', render);
  libraryService.subscribe(render);
}

