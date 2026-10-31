/**
 * @file SpotifyModal.js
 * Spotify Integration & Isolation Settings Modal.
 *
 * Enforces Rule 4 & 8:
 * - Documents and enforces isolation between Spotify API and AI services.
 * - Allows configuring Spotify developer tokens without compromising privacy.
 */

import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { appState } from '../state/appState.js';

export function setupSpotifyModal() {
  let modalEl = document.getElementById('spotify-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'spotify-modal-root';
    document.body.appendChild(modalEl);
  }

  const openModal = () => {
    renderModal();
  };

  const closeModal = () => {
    modalEl.innerHTML = '';
  };

  const renderModal = () => {
    const isConnected = !!spotifyClient.accessToken;

    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="spotify-backdrop">
        <div class="modal-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="spotify-modal-title">
          
          <div class="modal-header">
            <div class="header-title-box">
              <div class="header-icon-box spotify-brand-color">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <h3 id="spotify-modal-title" class="modal-title">Spotify Integration & Isolation</h3>
                <span class="status-indicator-pill ${isConnected ? 'connected' : 'guest'}">
                  ${isConnected ? '● Connected via Web API' : '● Standalone Curated Mode'}
                </span>
              </div>
            </div>
            <button id="btn-close-spotify-modal" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <!-- Architecture & Data Isolation Notice -->
          <div class="isolation-notice-box">
            <div class="notice-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>AIR-GAPPED ARCHITECTURE & SPOTIFY POLICY COMPLIANCE</span>
            </div>
            <p>
              <strong>Data Isolation Guarantee:</strong>
              Moodify strictly prevents Spotify content, track names, artist identities, lyrics, and album art from ever being sent to external AI/ML services. AI services operate solely on non-Spotify user prompts and independent mood categories.
            </p>
            <p style="margin-top: 8px; font-size: 0.73rem; color: #94a3b8;">
              <strong>Spotify February 2026 Migration & API Limitations:</strong><br/>
              • Spotify deprecated <code style="color: #38bdf8;">/v1/audio-features</code> and <code style="color: #38bdf8;">/v1/recommendations</code>; Moodify does not analyze or derive algorithmic models from Spotify audio features.<br/>
              • Full audio playback on web requires an active Spotify Premium subscription.<br/>
              • Moodify never extracts or passes Spotify audio streams into Web Audio visualizer analysers.<br/>
              • Inaccessible or private user playlists are never claimed to be imported.
            </p>
          </div>

          <!-- Token Configuration Form -->
          <form id="spotify-config-form" class="modal-form">
            <div class="form-group">
              <label for="spotify-token-input">Spotify Access Token (Optional OAuth / Developer Token):</label>
              <input 
                type="password" 
                id="spotify-token-input" 
                placeholder="Paste Bearer token from Spotify Developer Dashboard..."
                value="${spotifyClient.accessToken || ''}"
              />
              <span class="form-help-text">Leave blank to use Moodify's high-fidelity built-in catalog & Web Audio synthesizer.</span>
            </div>

            <div class="form-group">
              <label for="spotify-client-id-input">Spotify Client ID (Optional):</label>
              <input 
                type="text" 
                id="spotify-client-id-input" 
                placeholder="e.g. 4f9810a0..."
                value="${spotifyClient.clientId || ''}"
              />
            </div>

            <div class="modal-footer">
              ${isConnected ? `
                <button type="button" id="btn-disconnect-spotify" class="btn-danger">
                  Disconnect Spotify
                </button>
              ` : ''}
              <button type="button" id="btn-cancel-spotify" class="btn-secondary">Close</button>
              <button type="submit" class="btn-primary">Save Settings</button>
            </div>
          </form>

        </div>
      </div>
    `;

    // Close handlers
    modalEl.querySelector('#btn-close-spotify-modal').addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-spotify').addEventListener('click', closeModal);
    modalEl.querySelector('#spotify-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'spotify-backdrop') closeModal();
    });

    // Form submit
    const form = modalEl.querySelector('#spotify-config-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tokenInput = modalEl.querySelector('#spotify-token-input');
      const clientIdInput = modalEl.querySelector('#spotify-client-id-input');

      spotifyClient.setAccessToken(tokenInput.value);
      spotifyClient.setClientId(clientIdInput.value);

      // Update header button text
      const headerBtnText = document.getElementById('spotify-connect-text');
      if (headerBtnText) {
        headerBtnText.textContent = spotifyClient.accessToken ? 'Connected' : 'Spotify';
      }

      appState.setMood(appState.currentMood);
      closeModal();
    });

    // Disconnect
    const disconnectBtn = modalEl.querySelector('#btn-disconnect-spotify');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        spotifyClient.setAccessToken(null);
        spotifyClient.setClientId(null);
        const headerBtnText = document.getElementById('spotify-connect-text');
        if (headerBtnText) {
          headerBtnText.textContent = 'Spotify';
        }
        appState.setMood(appState.currentMood);
        closeModal();
      });
    }
  };

  window.addEventListener('moodify:openSpotifyModal', openModal);
}
