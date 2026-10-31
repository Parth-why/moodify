/**
 * @file main.js
 * Moodify Application Entry Point & Orchestrator.
 *
 * Bootstraps modular UI components, initializes reactive state, and
 * enforces AI architecture isolation and privacy checks.
 */

import './style.css';
import { appState } from './state/appState.js';
import { AIPrivacyGuard } from './services/ai/privacyGuard.js';
import { authService } from './services/auth/authService.js';
import { renderHeader } from './components/Header.js';
import { renderPlayerBar } from './components/PlayerBar.js';
import { renderHomeView } from './views/HomeView.js';
import { renderUniverseView } from './views/UniverseView.js';
import { renderJourneysView } from './views/JourneysView.js';
import { renderDiscoverView } from './views/DiscoverView.js';
import { setupMoodSenseModal } from './components/MoodSenseModal.js';
import { setupSpotifyModal } from './components/SpotifyModal.js';
import { setupAuthModal } from './components/AuthModal.js';
import { setupProfileModal } from './components/ProfileModal.js';
import { setupOnboardingModal } from './components/OnboardingModal.js';
import { setupPlaylistImporterModal } from './components/PlaylistImporterModal.js';
import { spotifyAuth } from './services/spotify/spotifyAuth.js';
import { showToast } from './components/Toast.js';
import { localDataMigrator } from './services/userdata/localDataMigrator.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.info('[Moodify V1.5] Bootstrapping application with Supabase & Modular AI Architecture...');

  // 1. Audit Biometric & Privacy Compliance (Enforces Rule 9)
  const audit = AIPrivacyGuard.auditBiometricStorageCompliance();
  if (audit.compliant) {
    console.info('[Moodify Privacy Guard] Active: 0 biometric or sensitive items found in browser storage.');
  }

  // 2. Initialize Authentication Service & Persistent Session
  await authService.init();

  // Check URL parameters for Auth callback error messages (e.g. expired confirmation link)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash);
    const authErrorDesc = urlParams.get('error_description') || hashParams.get('error_description');
    if (authErrorDesc) {
      showToast(decodeURIComponent(authErrorDesc.replace(/\+/g, ' ')), 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch {
    // Non-blocking URL check
  }

  // 3. Handle Spotify OAuth PKCE Callback if redirected back, or restore session
  try {
    const handled = await spotifyAuth.handleRedirectCallback();
    if (handled) {
      showToast('Successfully connected to Spotify via PKCE!', 'success');
    } else {
      await spotifyAuth.init();
    }
  } catch (err) {
    showToast(err.message || 'Spotify authorization failed.', 'error');
  }

  // 4. Safe V1 to V1.5 Local Data Migration
  if (localDataMigrator.hasPendingMigration()) {
    const res = await localDataMigrator.runMigration();
    if (res.success && (res.stats.tracks > 0 || res.stats.preferences > 0)) {
      showToast(`Migrated ${res.stats.tracks} local mood assignments into V1.5 persistent storage!`, 'info');
    }
  }

  // 3. Mount Header and Sticky Player Bar
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) renderHeader(headerContainer);

  const playerBarContainer = document.getElementById('player-bar-container');
  if (playerBarContainer) renderPlayerBar(playerBarContainer);

  // 4. Mount Active Screen View
  const mainContent = document.getElementById('main-content');
  const mountView = () => {
    if (!mainContent) return;
    mainContent.innerHTML = '';
    const view = appState.currentView || 'home';

    if (view === 'home') {
      renderHomeView(mainContent);
    } else if (view === 'library') {
      renderUniverseView(mainContent);
    } else if (view === 'journeys') {
      renderJourneysView(mainContent);
    } else if (view === 'discover') {
      renderDiscoverView(mainContent);
    }
  };

  mountView();
  appState.on('viewChange', () => {
    mountView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 5. Setup Modals
  setupMoodSenseModal();
  setupSpotifyModal();
  setupAuthModal();
  setupProfileModal();
  setupOnboardingModal();
  setupPlaylistImporterModal();

  // 5. Initial Mood Setup
  await appState.setMood(appState.currentMood);

  console.info('[Moodify V1.5] Initialization complete. Authenticated core application ready.');
});
