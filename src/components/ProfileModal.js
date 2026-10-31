/**
 * @file ProfileModal.js
 * User Profile & Account Settings Modal for MOODIFY V1.5.
 *
 * Allows viewing/updating display name, username, bio, and checking linked accounts.
 */

import { authService } from '../services/auth/authService.js';
import { spotifyClient } from '../services/spotify/spotifyClient.js';
import { showToast } from './Toast.js';

export function setupProfileModal() {
  let modalEl = document.getElementById('profile-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'profile-modal-root';
    document.body.appendChild(modalEl);
  }

  let isSaving = false;

  const openModal = () => {
    if (!authService.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent('moodify:openAuthModal', { detail: { tab: 'signin' } }));
      return;
    }
    renderModal();
  };

  const closeModal = () => {
    modalEl.innerHTML = '';
  };

  const renderModal = () => {
    const profile = authService.getProfile() || {};
    const user = authService.getUser() || {};
    const isSpotifyConnected = !!spotifyClient.accessToken;

    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="profile-backdrop">
        <div class="modal-dialog profile-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          
          <div class="modal-header">
            <div class="header-title-box">
              <div class="profile-avatar-box">
                <img src="${profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username || 'user'}`}" alt="Avatar" class="profile-avatar-img" />
              </div>
              <div>
                <h3 id="profile-modal-title" class="modal-title">${profile.display_name || 'My Profile'}</h3>
                <span class="profile-handle">@${profile.username || 'user'} • ${user.email || ''}</span>
              </div>
            </div>
            <button id="btn-close-profile-modal" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <form id="profile-form" class="modal-form">
            <div class="form-row-dual">
              <div class="form-group">
                <label for="profile-username">Username</label>
                <input type="text" id="profile-username" value="${profile.username || ''}" required />
              </div>
              <div class="form-group">
                <label for="profile-display-name">Display Name</label>
                <input type="text" id="profile-display-name" value="${profile.display_name || ''}" required />
              </div>
            </div>

            <div class="form-group">
              <label for="profile-bio">Bio / Sonic Vibe</label>
              <textarea id="profile-bio" rows="2" placeholder="e.g. Ambient night coder, vinyl collector...">${profile.bio || ''}</textarea>
            </div>

            <!-- Connected Services Section -->
            <div class="profile-connected-services glass-card">
              <h4 class="services-title">Connected Music Ecosystem</h4>
              
              <div class="service-row">
                <div class="service-meta">
                  <div class="service-icon-box spotify-brand-color">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <div>
                    <span class="service-name">Spotify</span>
                    <span class="service-status">${isSpotifyConnected ? 'Connected & Ready' : 'Not Connected'}</span>
                  </div>
                </div>

                <button type="button" id="btn-profile-manage-spotify" class="btn-secondary btn-small">
                  ${isSpotifyConnected ? 'Manage' : 'Connect'}
                </button>
              </div>
            </div>

            <div class="modal-footer profile-footer">
              <button type="button" id="btn-sign-out" class="btn-danger">
                Sign Out
              </button>
              <div class="footer-right-actions">
                <button type="button" id="btn-cancel-profile" class="btn-secondary">Close</button>
                <button type="submit" class="btn-primary" ${isSaving ? 'disabled' : ''}>
                  ${isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    `;

    // Close handlers
    modalEl.querySelector('#btn-close-profile-modal').addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-profile').addEventListener('click', closeModal);
    modalEl.querySelector('#profile-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'profile-backdrop') closeModal();
    });

    // Spotify settings trigger
    modalEl.querySelector('#btn-profile-manage-spotify').addEventListener('click', () => {
      closeModal();
      window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
    });

    // Sign out trigger
    modalEl.querySelector('#btn-sign-out').addEventListener('click', async () => {
      await authService.signOut();
      showToast('Signed out of MOODIFY.', 'info');
      closeModal();
    });

    // Form submit
    const form = modalEl.querySelector('#profile-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = modalEl.querySelector('#profile-username')?.value.trim();
      const displayName = modalEl.querySelector('#profile-display-name')?.value.trim();
      const bio = modalEl.querySelector('#profile-bio')?.value.trim();

      isSaving = true;
      renderModal();

      try {
        await authService.updateProfile({ username, display_name: displayName, bio });
        showToast('Profile updated successfully!', 'success');
        closeModal();
      } catch (err) {
        showToast(err.message || 'Failed to update profile.', 'error');
        isSaving = false;
        renderModal();
      }
    });
  };

  window.addEventListener('moodify:openProfileModal', openModal);
}
