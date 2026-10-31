/**
 * @file AuthModal.js
 * Dark Cinematic Authentication Modal for MOODIFY V1.5.
 *
 * Implements Sign In, Sign Up, and Password Reset workflows with
 * rich visual aesthetics, responsive tabs, inline validation, and loading states.
 */

import { authService } from '../services/auth/authService.js';
import { showToast } from './Toast.js';

export function setupAuthModal() {
  let modalEl = document.getElementById('auth-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'auth-modal-root';
    document.body.appendChild(modalEl);
  }

  let activeTab = 'signin'; // 'signin' | 'signup' | 'forgot'
  let isLoading = false;
  let errorMessage = '';

  const openModal = (tab = 'signin') => {
    activeTab = tab;
    errorMessage = '';
    isLoading = false;
    renderModal();
  };

  const closeModal = () => {
    modalEl.innerHTML = '';
  };

  const renderModal = () => {
    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="auth-backdrop">
        <div class="modal-dialog auth-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          
          <!-- Atmospheric Top Accent Glow -->
          <div class="auth-glow-accent"></div>

          <!-- Header -->
          <div class="modal-header auth-header">
            <div class="header-title-box">
              <div class="logo-mark small-mark">
                <svg class="audio-waves-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 id="auth-modal-title" class="modal-title">
                  ${activeTab === 'signin' ? 'Welcome Back to MOODIFY' : activeTab === 'signup' ? 'Create Your Sonic Identity' : 'Reset Password'}
                </h3>
                <span class="auth-subtitle">
                  ${activeTab === 'signin' ? 'Sign in to access your personal music universe & moods' : activeTab === 'signup' ? 'Join the universe of mood-driven soundscapes' : 'Enter your email to receive recovery instructions'}
                </span>
              </div>
            </div>
            <button id="btn-close-auth-modal" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <!-- Tab Switcher -->
          ${activeTab !== 'forgot' ? `
            <div class="auth-tabs-row" role="tablist">
              <button class="auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}" data-tab="signin" role="tab" aria-selected="${activeTab === 'signin'}">
                Sign In
              </button>
              <button class="auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}" data-tab="signup" role="tab" aria-selected="${activeTab === 'signup'}">
                Create Account
              </button>
            </div>
          ` : `
            <div class="auth-tabs-row">
              <button class="auth-tab-btn active" data-tab="forgot">Password Recovery</button>
            </div>
          `}

          <!-- Error Alert Banner -->
          ${errorMessage ? `
            <div class="auth-error-banner animate-slide-up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>${errorMessage}</span>
            </div>
          ` : ''}

          <!-- Form Body -->
          <form id="auth-form" class="modal-form auth-form">
            ${activeTab === 'signup' ? `
              <div class="form-row-dual">
                <div class="form-group">
                  <label for="auth-username">Username</label>
                  <input type="text" id="auth-username" placeholder="e.g. neonsurfer" required autocomplete="username" />
                </div>
                <div class="form-group">
                  <label for="auth-display-name">Display Name</label>
                  <input type="text" id="auth-display-name" placeholder="e.g. Alex Vance" required />
                </div>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="auth-email">Email Address</label>
              <input type="email" id="auth-email" placeholder="you@domain.com" required autocomplete="email" />
            </div>

            ${activeTab !== 'forgot' ? `
              <div class="form-group">
                <div class="label-with-link">
                  <label for="auth-password">Password</label>
                  ${activeTab === 'signin' ? `
                    <button type="button" class="btn-text-link" id="link-forgot-pw">Forgot?</button>
                  ` : ''}
                </div>
                <input type="password" id="auth-password" placeholder="••••••••" required minlength="6" autocomplete="${activeTab === 'signin' ? 'current-password' : 'new-password'}" />
                ${activeTab === 'signup' ? `<span class="form-help-text">Minimum 6 characters</span>` : ''}
              </div>
            ` : ''}

            <div class="modal-footer auth-footer">
              ${activeTab === 'forgot' ? `
                <button type="button" id="btn-back-to-signin" class="btn-secondary">Back to Sign In</button>
              ` : `
                <button type="button" id="btn-cancel-auth" class="btn-secondary">Cancel</button>
              `}

              <button type="submit" class="btn-primary btn-glow" ${isLoading ? 'disabled' : ''}>
                ${isLoading ? `
                  <span class="spinner-small"></span>
                  <span>Processing...</span>
                ` : activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Create Account & Begin' : 'Send Reset Link'}
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    // Close handlers
    modalEl.querySelector('#btn-close-auth-modal').addEventListener('click', closeModal);
    const cancelBtn = modalEl.querySelector('#btn-cancel-auth');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    modalEl.querySelector('#auth-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'auth-backdrop') closeModal();
    });

    // Tab switching
    modalEl.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab && tab !== activeTab) {
          openModal(tab);
        }
      });
    });

    const forgotLink = modalEl.querySelector('#link-forgot-pw');
    if (forgotLink) {
      forgotLink.addEventListener('click', () => openModal('forgot'));
    }

    const backToSignIn = modalEl.querySelector('#btn-back-to-signin');
    if (backToSignIn) {
      backToSignIn.addEventListener('click', () => openModal('signin'));
    }

    // Form submission
    const form = modalEl.querySelector('#auth-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modalEl.querySelector('#auth-email')?.value.trim();
      const password = modalEl.querySelector('#auth-password')?.value;
      const username = modalEl.querySelector('#auth-username')?.value.trim();
      const displayName = modalEl.querySelector('#auth-display-name')?.value.trim();

      errorMessage = '';
      isLoading = true;
      renderModal();

      try {
        if (activeTab === 'signin') {
          await authService.signIn({ email, password });
          showToast(`Welcome back, ${authService.getProfile()?.display_name || 'music lover'}!`, 'success');
          closeModal();
        } else if (activeTab === 'signup') {
          const result = await authService.signUp({ email, password, username, displayName });
          if (result?.needsConfirmation) {
            showToast('Account registered! Please check your inbox and confirm your email before signing in.', 'info');
            openModal('signin');
          } else {
            showToast('Account created successfully! Let\'s personalize your experience.', 'success');
            closeModal();
            // Dispatch onboarding wizard trigger
            window.dispatchEvent(new CustomEvent('moodify:openOnboarding'));
          }
        } else if (activeTab === 'forgot') {
          await authService.resetPassword(email);
          showToast('Password reset link sent! Check your inbox.', 'info');
          openModal('signin');
        }
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
          errorMessage = 'Your email address has not been verified yet. Please check your inbox and click the confirmation link before signing in.';
        } else {
          errorMessage = err.message || 'Authentication failed. Please verify credentials.';
        }
        isLoading = false;
        renderModal();
      }
    });
  };

  window.addEventListener('moodify:openAuthModal', (e) => {
    const tab = e.detail?.tab || 'signin';
    openModal(tab);
  });
}
