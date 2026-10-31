/**
 * @file Header.js
 * Header Navigation, Search Bar, AI Architecture Status Badges & Quick Action Triggers.
 */

import { appState } from '../state/appState.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { aiRegistry } from '../services/ai/registry.js';
import { authService } from '../services/auth/authService.js';

export function renderHeader(container) {
  const render = () => {
    const isAuth = authService.isAuthenticated();
    const profile = authService.getProfile();

    container.innerHTML = `
      <header class="mood-header glass-card">
        <div class="header-brand">
          <div class="logo-mark">
            <svg class="audio-waves-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>MOODIFY</h1>
            <span class="logo-tagline">Your music. Your emotions. Your universe.</span>
          </div>
        </div>

        <div class="header-search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="search" 
            id="global-search-input" 
            placeholder="Search tracks, artists, moods, or genres..."
            aria-label="Search music"
          />
        </div>

        <div class="header-actions">
          <!-- AI Architecture & Privacy Badges -->
          <div class="badge-group">
            <div class="status-badge ai-badge" title="AI/ML Architecture V1.5: Modular Mock Service Active">
              <span class="badge-dot pulse-amber"></span>
              <span class="badge-text">AI: V1.5</span>
            </div>
            <div class="status-badge privacy-badge" title="Privacy Guard Active: Zero biometric or Spotify data persistence">
              <span class="badge-dot pulse-emerald"></span>
              <span class="badge-text">AIR-GAP</span>
            </div>
          </div>

          <!-- MoodSense Camera Action -->
          <button id="btn-open-moodsense" class="action-btn btn-moodsense" title="Detect mood via camera facial expression">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span>MoodSense</span>
          </button>

          <!-- Spotify Settings Action -->
          <button id="btn-open-spotify" class="action-btn btn-spotify" title="Spotify Integration & API Settings">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span id="spotify-connect-text">${spotifyClient.accessToken ? 'Connected' : 'Spotify'}</span>
          </button>

          <!-- User Authentication / Profile Action -->
          ${isAuth ? `
            <button id="btn-open-profile" class="action-btn btn-profile" title="View Profile & Settings">
              <img src="${profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.username || 'user'}`}" alt="Avatar" class="header-avatar-img" />
              <span class="header-username">${profile?.display_name || profile?.username || 'User'}</span>
            </button>
          ` : `
            <button id="btn-open-auth" class="action-btn btn-auth btn-glow" title="Sign In or Register">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Sign In</span>
            </button>
          `}
        </div>
      </header>
    `;

    // Search input handler
    const searchInput = container.querySelector('#global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', async (e) => {
        const q = e.target.value.trim();
        if (q.length > 0) {
          const results = await spotifyClient.searchTracks(q);
          appState.setTracks(results);
        } else {
          appState.setMood(appState.currentMood);
        }
      });
    }

    // Modal event triggers
    container.querySelector('#btn-open-moodsense')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openMoodSense'));
    });

    container.querySelector('#btn-open-spotify')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
    });

    container.querySelector('#btn-open-auth')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openAuthModal', { detail: { tab: 'signin' } }));
    });

    container.querySelector('#btn-open-profile')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openProfileModal'));
    });
  };

  render();
  authService.onAuthStateChange(() => render());
}
