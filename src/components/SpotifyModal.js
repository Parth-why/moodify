/**
 * @file SpotifyModal.js
 * Spotify Integration & Isolation Settings Modal.
 *
 * Enforces Rule 4 & 8:
 * - Documents and enforces isolation between Spotify API and AI services.
 * - Allows configuring Spotify developer tokens without compromising privacy.
 */

import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { spotifyAuth } from '../services/spotify/spotifyAuth.js';
import { appState } from '../state/appState.js';
import { showToast } from './Toast.js';

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
    const redirectUri = spotifyAuth.getRedirectUri();
    const currentClientId = spotifyAuth.clientId || '';

    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="spotify-backdrop">
        <div class="modal-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="spotify-modal-title" style="max-width: 580px;">
          
          <div class="modal-header">
            <div class="header-title-box">
              <div class="header-icon-box spotify-brand-color">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <h3 id="spotify-modal-title" class="modal-title">Spotify OAuth & Integration</h3>
                <span class="status-indicator-pill ${isConnected ? 'connected' : 'guest'}">
                  ${isConnected ? '● Connected via Web API' : '● Standalone Curated Mode'}
                </span>
              </div>
            </div>
            <button id="btn-close-spotify-modal" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <!-- Connected Profile Card if Authenticated -->
          ${isConnected ? `
            <div class="spotify-connected-profile glass-card" style="margin-bottom: 16px; padding: 14px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 14px; background: rgba(30, 215, 96, 0.08); border: 1px solid rgba(30, 215, 96, 0.25);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img 
                  src="${spotifyClient.userProfile?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + (spotifyClient.userProfile?.id || 'spotify')}" 
                  alt="Avatar" 
                  style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: #000;"
                />
                <div>
                  <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 2px;">
                    ${spotifyClient.userProfile?.displayName || 'Connected Account'}
                  </h4>
                  <span style="font-size: 0.74rem; color: #94a3b8;">
                    Spotify ID: <strong style="color: #1ed760;">${spotifyClient.userProfile?.id || 'Active'}</strong> • Plan: <strong style="text-transform: capitalize;">${spotifyClient.userProfile?.product || 'Active'}</strong>
                  </span>
                </div>
              </div>
              <button type="button" id="btn-disconnect-spotify-top" class="btn-secondary btn-small" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                Disconnect
              </button>
            </div>
          ` : ''}

          <!-- OAuth PKCE Configuration Card -->
          <div class="oauth-setup-box glass-card" style="margin-bottom: 16px; padding: 14px; border-radius: 10px;">
            <div class="notice-badge" style="color: #1ed760; margin-bottom: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style="font-weight: 700; font-size: 0.8rem;">SECURE PKCE AUTHORIZATION (ZERO SECRETS IN BROWSER)</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45;">
              To connect your real Spotify account, configure your application in the <strong>Spotify Developer Dashboard</strong>:
            </p>
            <div style="background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 6px; margin: 8px 0; font-family: monospace; font-size: 0.76rem; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <span><strong>Redirect URI:</strong> <code id="display-redirect-uri" style="color: var(--accent-cyan);">${redirectUri}</code></span>
              <button type="button" id="btn-copy-redirect" class="btn-text-link" style="font-size: 0.72rem;">Copy</button>
            </div>
            <p style="font-size: 0.72rem; color: #94a3b8;">
              1. Open <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener" style="color: #1ed760; text-decoration: underline;">Spotify Developer Dashboard</a>.<br/>
              2. Select your app → <strong>Settings</strong> → add the Redirect URI above into <strong>Redirect URIs</strong>.<br/>
              3. Paste your <strong>Client ID</strong> below and click <em>Authorize via Spotify</em>.
            </p>
          </div>

          <!-- PKCE Auth Form -->
          <form id="spotify-pkce-form" class="modal-form">
            <div class="form-group">
              <label for="spotify-client-id-input">Spotify Client ID:</label>
              <input 
                type="text" 
                id="spotify-client-id-input" 
                placeholder="e.g. 4f9810a0..."
                value="${currentClientId}"
                required
              />
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
              <button type="submit" id="btn-start-pkce" class="btn-spotify btn-glow" style="flex: 1;">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 6px;">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Authorize with Spotify (PKCE)
              </button>
            </div>
          </form>

          <!-- Collapsible Manual Developer Token (Fallback) -->
          <details style="margin-bottom: 16px; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; font-size: 0.78rem;">
            <summary style="cursor: pointer; color: var(--text-muted); font-weight: 600;">
              Manual Developer Token (Optional Alternative)
            </summary>
            <div style="margin-top: 10px;">
              <input 
                type="password" 
                id="manual-spotify-token" 
                placeholder="Paste Bearer token from Spotify Console..." 
                value="${spotifyClient.accessToken || ''}"
                style="width: 100%; margin-bottom: 8px;"
              />
              <button type="button" id="btn-save-manual-token" class="btn-secondary btn-small">
                Apply Manual Token
              </button>
            </div>
          </details>

          <!-- Architecture & Data Isolation Notice -->
          <div class="isolation-notice-box" style="margin-top: 0;">
            <div class="notice-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>AIR-GAPPED ARCHITECTURE & SPOTIFY COMPLIANCE</span>
            </div>
            <p style="font-size: 0.73rem; color: #94a3b8; line-height: 1.4;">
              • Moodify never pipes Spotify audio streams into Web Audio visualizer analysers.<br/>
              • Spotify metadata/tracks are never sent to external AI/ML services for training or inference.<br/>
              • Mood recommendations rely on your own tags and independent classifications, not Spotify derived algorithms.
            </p>
          </div>

          <div class="modal-footer" style="margin-top: 16px;">
            ${isConnected ? `
              <button type="button" id="btn-disconnect-spotify" class="btn-danger">
                Disconnect Spotify
              </button>
            ` : ''}
            <button type="button" id="btn-cancel-spotify" class="btn-secondary">Close</button>
          </div>

        </div>
      </div>
    `;

    // Close handlers
    modalEl.querySelector('#btn-close-spotify-modal').addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-spotify').addEventListener('click', closeModal);
    modalEl.querySelector('#spotify-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'spotify-backdrop') closeModal();
    });

    // Copy redirect URI
    modalEl.querySelector('#btn-copy-redirect')?.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(redirectUri);
        showToast('Redirect URI copied to clipboard!', 'info');
      }
    });

    // PKCE form submit
    const pkceForm = modalEl.querySelector('#spotify-pkce-form');
    pkceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clientId = modalEl.querySelector('#spotify-client-id-input')?.value.trim();
      if (!clientId) {
        showToast('Please enter your Spotify Client ID.', 'error');
        return;
      }
      try {
        await spotifyAuth.initiateLogin(clientId);
      } catch (err) {
        showToast(err.message || 'Failed to initiate Spotify login.', 'error');
      }
    });

    // Save manual token fallback
    const saveManualBtn = modalEl.querySelector('#btn-save-manual-token');
    if (saveManualBtn) {
      saveManualBtn.addEventListener('click', () => {
        const tokenVal = modalEl.querySelector('#manual-spotify-token')?.value.trim();
        const clientVal = modalEl.querySelector('#spotify-client-id-input')?.value.trim();
        spotifyClient.setAccessToken(tokenVal);
        if (clientVal) spotifyAuth.setClientId(clientVal);
        
        const headerBtnText = document.getElementById('spotify-connect-text');
        if (headerBtnText) {
          headerBtnText.textContent = spotifyClient.accessToken ? 'Connected' : 'Spotify';
        }
        showToast('Spotify token updated.', 'success');
        appState.setMood(appState.currentMood);
        closeModal();
      });
    }

    // Disconnect handler
    const handleDisconnect = async () => {
      await spotifyAuth.disconnect();
      showToast('Disconnected from Spotify.', 'info');
      appState.setMood(appState.currentMood);
      closeModal();
    };

    modalEl.querySelector('#btn-disconnect-spotify')?.addEventListener('click', handleDisconnect);
    modalEl.querySelector('#btn-disconnect-spotify-top')?.addEventListener('click', handleDisconnect);
  };

  window.addEventListener('moodify:openSpotifyModal', openModal);
  window.addEventListener('moodify:spotifyConnectionChanged', () => {
    if (modalEl.innerHTML.trim()) renderModal();
  });
}

