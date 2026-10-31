/**
 * @file Header.js
 * MOODIFY V2 — Streamlined Primary Navigation (4 Destinations) & Secondary Controls.
 *
 * Implements:
 * - 4 Primary destinations: HOME | MY UNIVERSE | MOOD JOURNEYS | DISCOVER
 * - Secondary controls: Global Search, MoodSense Camera, Spotify Status, Profile / Auth
 * - Responsive mobile navigation drawer / bar
 */

import { appState } from '../state/appState.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { authService } from '../services/auth/authService.js';

export function renderHeader(container) {
  const render = () => {
    const isAuth = authService.isAuthenticated();
    const profile = authService.getProfile();
    const currentView = appState.currentView || 'home';
    const isSpotifyConnected = !!spotifyClient.accessToken;

    container.innerHTML = `
      <header class="mood-header-v2">
        <!-- Left: Brand Identity -->
        <div class="header-brand-v2" id="brand-logo-btn" style="cursor: pointer;">
          <div class="logo-mark-v2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="logo-text-v2">
            <span class="logo-name">MOODIFY</span>
            <span class="logo-tagline-v2">Your music. Your emotions. Your universe.</span>
          </div>
        </div>

        <!-- Center: 4 Primary Destinations -->
        <nav class="primary-nav-tabs" aria-label="Main Navigation">
          <button class="nav-tab-btn ${currentView === 'home' ? 'active' : ''}" data-view="home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>HOME</span>
            ${currentView === 'home' ? '<span class="nav-indicator-pill"></span>' : ''}
          </button>

          <button class="nav-tab-btn ${currentView === 'library' ? 'active' : ''}" data-view="library">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
              <path d="M2 12h20"></path>
            </svg>
            <span>MY UNIVERSE</span>
            ${currentView === 'library' ? '<span class="nav-indicator-pill"></span>' : ''}
          </button>

          <button class="nav-tab-btn ${currentView === 'journeys' ? 'active' : ''}" data-view="journeys">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span>MOOD JOURNEYS</span>
            ${currentView === 'journeys' ? '<span class="nav-indicator-pill"></span>' : ''}
          </button>

          <button class="nav-tab-btn ${currentView === 'discover' ? 'active' : ''}" data-view="discover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"></polygon>
            </svg>
            <span>DISCOVER</span>
            ${currentView === 'discover' ? '<span class="nav-indicator-pill"></span>' : ''}
          </button>
        </nav>

        <!-- Right: Secondary Controls -->
        <div class="secondary-controls-group">
          <!-- MoodSense Camera Feature -->
          <button id="btn-moodsense-header" class="secondary-icon-btn" title="MoodSense: Camera Emotion Inference">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span class="btn-tooltip-label">Sense</span>
          </button>

          <!-- Spotify Connection Pill -->
          <button id="btn-spotify-header" class="spotify-status-pill ${isSpotifyConnected ? 'connected' : ''}" title="Spotify PKCE Integration">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span class="spotify-pill-text">${isSpotifyConnected ? 'Connected' : 'Spotify'}</span>
          </button>

          <!-- Profile / Authentication Action -->
          ${isAuth ? `
            <button id="btn-profile-header" class="profile-avatar-btn" title="User Profile & Settings">
              <img 
                src="${profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.username || 'user'}`}" 
                alt="Avatar" 
                class="avatar-thumb"
              />
              <span class="avatar-name-label">${profile?.display_name || profile?.username || 'Account'}</span>
            </button>
          ` : `
            <button id="btn-auth-header" class="btn-primary-glow btn-small" title="Sign In or Register">
              <span>Sign In</span>
            </button>
          `}
        </div>
      </header>
    `;

    // Brand click returns to Home
    container.querySelector('#brand-logo-btn')?.addEventListener('click', () => {
      appState.setCurrentView('home');
    });

    // Tab buttons
    container.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        appState.setCurrentView(targetView);
      });
    });

    // Secondary controls
    container.querySelector('#btn-moodsense-header')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openMoodSense'));
    });

    container.querySelector('#btn-spotify-header')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
    });

    container.querySelector('#btn-profile-header')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openProfileModal'));
    });

    container.querySelector('#btn-auth-header')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('moodify:openAuthModal', { detail: { tab: 'signin' } }));
    });
  };

  render();
  appState.on('viewChange', render);
  authService.onAuthStateChange(render);
}
