/**
 * @file PlaylistImporterModal.js
 * Spotify Playlist Discovery & Batch Import Modal for MOODIFY V1.5.
 *
 * Implements:
 * - Fetches user playlists from Spotify API
 * - Interactive multi-select or single playlist import
 * - Real-time progress bar with item counts
 * - Error handling for inaccessible playlists
 * - Deduplication verification & library integration
 */

import { libraryService } from '../services/library/libraryService.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { showToast } from './Toast.js';

export function setupPlaylistImporterModal() {
  let modalEl = document.getElementById('importer-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'importer-modal-root';
    document.body.appendChild(modalEl);
  }

  let playlists = [];
  let isLoading = false;
  let importProgress = null; // { status, progress, message }
  let errorMsg = '';

  const openModal = async () => {
    importProgress = null;
    errorMsg = '';
    renderModal();

    if (!spotifyClient.accessToken) {
      errorMsg = 'Spotify is not connected. Please connect your Spotify account first.';
      renderModal();
      return;
    }

    isLoading = true;
    renderModal();

    try {
      playlists = await libraryService.fetchSpotifyPlaylists();
      isLoading = false;
      renderModal();
    } catch (err) {
      isLoading = false;
      errorMsg = err.message || 'Failed to fetch playlists from Spotify.';
      renderModal();
    }
  };

  const closeModal = () => {
    modalEl.innerHTML = '';
  };

  const renderModal = () => {
    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="importer-backdrop">
        <div class="modal-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" style="max-width: 600px;">
          
          <div class="modal-header">
            <div class="header-title-box">
              <div class="header-icon-box spotify-brand-color">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Import Spotify Playlists</h3>
                <span class="auth-subtitle">Add playlists into your personal MOODIFY universe</span>
              </div>
            </div>
            <button id="btn-close-importer" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <!-- Progress Alert if importing -->
          ${importProgress ? `
            <div class="importer-progress-box glass-card animate-slide-up" style="padding: 16px; margin: 16px 0; border: 1px solid var(--border-subtle); border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 8px;">
                <span style="color: #fff; font-weight: 600;">${importProgress.message}</span>
                <span style="color: var(--accent-cyan); font-weight: 700;">${importProgress.progress}%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
                <div style="width: ${importProgress.progress}%; height: 100%; background: linear-gradient(90deg, #1ed760, #00f0ff); transition: width 0.3s ease;"></div>
              </div>
            </div>
          ` : ''}

          <!-- Error Alert -->
          ${errorMsg ? `
            <div class="auth-error-banner animate-slide-up" style="margin-top: 16px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div style="flex: 1;">
                <div>${errorMsg}</div>
                ${!spotifyClient.accessToken ? `
                  <button type="button" id="btn-goto-spotify-connect" class="btn-text-link" style="margin-top: 6px; display: inline-block;">
                    Open Spotify Connection Settings →
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Playlists List -->
          ${isLoading ? `
            <div style="text-align: center; padding: 40px;">
              <span class="spinner-small" style="width: 24px; height: 24px;"></span>
              <p style="color: var(--text-muted); font-size: 0.84rem; margin-top: 10px;">Fetching playlists from Spotify...</p>
            </div>
          ` : playlists.length > 0 ? `
            <div class="playlist-import-list" style="max-height: 320px; overflow-y: auto; margin: 16px 0; padding-right: 6px;">
              ${playlists.map(p => `
                <div class="playlist-import-item glass-card" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; border: 1px solid var(--border-subtle);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${p.coverUrl}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; background: #000;" />
                    <div>
                      <h4 style="font-size: 0.86rem; color: #fff; font-weight: 700; margin-bottom: 2px;">${p.name}</h4>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${p.totalTracks} tracks • by ${p.owner}</span>
                    </div>
                  </div>
                  <button type="button" class="btn-primary btn-small btn-import-single" data-playlist-id="${p.id}" ${importProgress ? 'disabled' : ''}>
                    Import
                  </button>
                </div>
              `).join('')}
            </div>
          ` : !errorMsg && !isLoading ? `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
              No accessible public/collaborative playlists found in your account.
            </div>
          ` : ''}

          <div class="modal-footer" style="margin-top: 16px;">
            <button type="button" id="btn-close-importer-footer" class="btn-secondary">Close</button>
          </div>

        </div>
      </div>
    `;

    // Handlers
    modalEl.querySelector('#btn-close-importer')?.addEventListener('click', closeModal);
    modalEl.querySelector('#btn-close-importer-footer')?.addEventListener('click', closeModal);
    modalEl.querySelector('#importer-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'importer-backdrop') closeModal();
    });

    modalEl.querySelector('#btn-goto-spotify-connect')?.addEventListener('click', () => {
      closeModal();
      window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
    });

    // Import single playlist clicks
    modalEl.querySelectorAll('.btn-import-single').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.dataset.playlistId;
        btn.disabled = true;
        btn.textContent = 'Importing...';

        try {
          const result = await libraryService.importPlaylist(pId, (progress) => {
            importProgress = progress;
            renderModal();
          });
          showToast(`Imported ${result.count} tracks from playlist into your library!`, 'success');
          setTimeout(closeModal, 1200);
        } catch (err) {
          showToast(err.message || 'Import failed.', 'error');
          importProgress = null;
          renderModal();
        }
      });
    });
  };

  window.addEventListener('moodify:openPlaylistImporter', openModal);
}
