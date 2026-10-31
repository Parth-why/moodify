/**
 * @file OnboardingModal.js
 * First-Time User Onboarding Wizard for MOODIFY V1.5.
 *
 * Implements 5-step interactive onboarding:
 * 1. Welcome to MOODIFY
 * 2. Identity: Choose username and display name
 * 3. Sonic Profile: Select preferred music moods from the 12 core moods
 * 4. Connect Spotify or skip for now
 * 5. Enter the personal music universe dashboard
 */

import { authService } from '../services/auth/authService.js';
import { userMoodStore } from '../services/userdata/userMoodStore.js';
import { showToast } from './Toast.js';

const ONBOARDING_MOODS = [
  { id: 'party', name: 'Party', emoji: '🥳', color: '#F59E0B' },
  { id: 'happy', name: 'Happy', emoji: '☀️', color: '#FBBF24' },
  { id: 'cheerful', name: 'Cheerful', emoji: '😊', color: '#34D399' },
  { id: 'lonely', name: 'Lonely', emoji: '🌧️', color: '#64748B' },
  { id: 'romantic', name: 'Romantic', emoji: '🌹', color: '#F43F5E' },
  { id: 'chill', name: 'Chill', emoji: '☕', color: '#38BDF8' },
  { id: 'energetic', name: 'Energetic', emoji: '🔥', color: '#EF4444' },
  { id: 'nostalgic', name: 'Nostalgic', emoji: '📼', color: '#D97706' },
  { id: 'melancholic', name: 'Melancholic', emoji: '💧', color: '#818CF8' },
  { id: 'surprised', name: 'Surprised', emoji: '⚡', color: '#EC4899' },
  { id: 'dreamy', name: 'Dreamy', emoji: '🌌', color: '#A855F7' },
  { id: 'confident', name: 'Confident', emoji: '🦁', color: '#10B981' }
];

export function setupOnboardingModal() {
  let modalEl = document.getElementById('onboarding-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'onboarding-modal-root';
    document.body.appendChild(modalEl);
  }

  let currentStep = 1;
  let chosenUsername = '';
  let chosenDisplayName = '';
  let selectedMoods = new Set(['chill', 'dreamy']);

  const openModal = () => {
    const profile = authService.getProfile();
    chosenUsername = profile?.username || '';
    chosenDisplayName = profile?.display_name || '';
    currentStep = 1;
    renderModal();
  };

  const closeModal = () => {
    modalEl.innerHTML = '';
  };

  const renderModal = () => {
    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="onboarding-backdrop">
        <div class="modal-dialog onboarding-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true">
          
          <!-- Step Progress Indicator -->
          <div class="onboarding-stepper">
            ${[1, 2, 3, 4, 5].map(step => `
              <div class="step-pip ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}">
                <span class="step-num">${step < currentStep ? '✓' : step}</span>
                <span class="step-label">
                  ${step === 1 ? 'Welcome' : step === 2 ? 'Identity' : step === 3 ? 'Moods' : step === 4 ? 'Connect' : 'Launch'}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Step 1: Welcome -->
          ${currentStep === 1 ? `
            <div class="onboarding-content animate-fade-in text-center">
              <div class="onboarding-hero-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h2 class="onboarding-title">Welcome to MOODIFY</h2>
              <p class="onboarding-tagline">"Your music. Your emotions. Your universe."</p>
              <p class="onboarding-description">
                Experience sound tuned to your exact emotional frequency. MOODIFY organizes your music library around deeply personal moods, Moments, and journeys.
              </p>
              <div class="onboarding-actions">
                <button type="button" id="btn-step1-next" class="btn-primary btn-glow">Begin Exploration →</button>
              </div>
            </div>
          ` : ''}

          <!-- Step 2: Username & Display Name -->
          ${currentStep === 2 ? `
            <div class="onboarding-content animate-fade-in">
              <h3 class="onboarding-title">Step 2: Define Your Sonic Identity</h3>
              <p class="onboarding-subtitle">Choose how you appear across your personal music universe.</p>
              
              <div class="modal-form" style="margin-top: 20px;">
                <div class="form-group">
                  <label for="onboarding-username">Username</label>
                  <input type="text" id="onboarding-username" value="${chosenUsername}" placeholder="e.g. synthwave_hero" required />
                </div>
                <div class="form-group">
                  <label for="onboarding-display-name">Display Name</label>
                  <input type="text" id="onboarding-display-name" value="${chosenDisplayName}" placeholder="e.g. Jordan Rivera" required />
                </div>
              </div>

              <div class="onboarding-footer-nav">
                <button type="button" id="btn-back" class="btn-secondary">← Back</button>
                <button type="button" id="btn-step2-next" class="btn-primary">Continue →</button>
              </div>
            </div>
          ` : ''}

          <!-- Step 3: Preferred Music Moods -->
          ${currentStep === 3 ? `
            <div class="onboarding-content animate-fade-in">
              <h3 class="onboarding-title">Step 3: Select Your Core Sonic Moods</h3>
              <p class="onboarding-subtitle">Select the moods that resonate most with your daily listening vibe.</p>
              
              <div class="onboarding-mood-grid">
                ${ONBOARDING_MOODS.map(m => {
                  const isSelected = selectedMoods.has(m.id);
                  return `
                    <button type="button" class="onboarding-mood-chip ${isSelected ? 'selected' : ''}" data-mood-id="${m.id}" style="--mood-color: ${m.color}">
                      <span class="mood-emoji">${m.emoji}</span>
                      <span class="mood-name">${m.name}</span>
                      ${isSelected ? '<span class="selected-checkmark">✓</span>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>

              <div class="onboarding-footer-nav">
                <button type="button" id="btn-back" class="btn-secondary">← Back</button>
                <button type="button" id="btn-step3-next" class="btn-primary">Continue (${selectedMoods.size} selected) →</button>
              </div>
            </div>
          ` : ''}

          <!-- Step 4: Spotify Connection (Optional) -->
          ${currentStep === 4 ? `
            <div class="onboarding-content animate-fade-in text-center">
              <div class="service-icon-box spotify-brand-color large-icon" style="margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <h3 class="onboarding-title">Step 4: Connect Your Spotify Library</h3>
              <p class="onboarding-description">
                Link your Spotify account to import your favorite playlists and organize tracks by mood. (This is completely optional and can be connected anytime).
              </p>

              <div class="onboarding-actions-stacked">
                <button type="button" id="btn-onboarding-spotify" class="btn-spotify btn-glow" style="width: 100%;">
                  Connect Spotify via PKCE
                </button>
                <button type="button" id="btn-step4-skip" class="btn-text-link" style="margin-top: 12px;">
                  Skip for Now — Use MOODIFY Independent Catalog
                </button>
              </div>

              <div class="onboarding-footer-nav" style="margin-top: 24px;">
                <button type="button" id="btn-back" class="btn-secondary">← Back</button>
              </div>
            </div>
          ` : ''}

          <!-- Step 5: Enter Personal Music Universe -->
          ${currentStep === 5 ? `
            <div class="onboarding-content animate-fade-in text-center">
              <div class="launch-universe-sphere">
                <div class="pulse-ring ring-1"></div>
                <div class="pulse-ring ring-2"></div>
                <div class="sphere-core">🪐</div>
              </div>
              <h3 class="onboarding-title">Your Universe is Ready!</h3>
              <p class="onboarding-description">
                Your profile, preferences, and mood matrix have been successfully initialized. Welcome to your personal sonic ecosystem.
              </p>
              
              <div class="onboarding-actions" style="margin-top: 28px;">
                <button type="button" id="btn-enter-universe" class="btn-primary btn-glow large-btn">
                  Enter My Universe Dashboard 🚀
                </button>
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    `;

    // Navigation Listeners
    const btnBack = modalEl.querySelector('#btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (currentStep > 1) {
          currentStep--;
          renderModal();
        }
      });
    }

    if (currentStep === 1) {
      modalEl.querySelector('#btn-step1-next').addEventListener('click', () => {
        currentStep = 2;
        renderModal();
      });
    }

    if (currentStep === 2) {
      modalEl.querySelector('#btn-step2-next').addEventListener('click', async () => {
        const u = modalEl.querySelector('#onboarding-username')?.value.trim();
        const d = modalEl.querySelector('#onboarding-display-name')?.value.trim();
        if (u) chosenUsername = u;
        if (d) chosenDisplayName = d;

        if (authService.isAuthenticated()) {
          try {
            await authService.updateProfile({ username: chosenUsername, display_name: chosenDisplayName });
          } catch (e) {
            console.warn('[Onboarding] Profile update error:', e);
          }
        }
        currentStep = 3;
        renderModal();
      });
    }

    if (currentStep === 3) {
      modalEl.querySelectorAll('.onboarding-mood-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const mId = btn.dataset.moodId;
          if (selectedMoods.has(mId)) {
            if (selectedMoods.size > 1) selectedMoods.delete(mId);
          } else {
            selectedMoods.add(mId);
          }
          renderModal();
        });
      });

      modalEl.querySelector('#btn-step3-next').addEventListener('click', () => {
        userMoodStore.updatePreferences({ preferredMoods: Array.from(selectedMoods) });
        currentStep = 4;
        renderModal();
      });
    }

    if (currentStep === 4) {
      modalEl.querySelector('#btn-onboarding-spotify').addEventListener('click', () => {
        currentStep = 5;
        closeModal();
        window.dispatchEvent(new CustomEvent('moodify:openSpotifyModal'));
      });

      modalEl.querySelector('#btn-step4-skip').addEventListener('click', () => {
        currentStep = 5;
        renderModal();
      });
    }

    if (currentStep === 5) {
      modalEl.querySelector('#btn-enter-universe').addEventListener('click', () => {
        showToast('Welcome to your music universe!', 'success');
        closeModal();
      });
    }
  };

  window.addEventListener('moodify:openOnboarding', openModal);
}
