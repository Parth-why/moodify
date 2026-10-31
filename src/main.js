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
import { renderMoodSelector } from './components/MoodSelector.js';
import { renderAISuggestionPanel } from './components/AISuggestionPanel.js';
import { renderAudioSliders } from './components/AudioSliders.js';
import { renderTrackGrid } from './components/TrackGrid.js';
import { renderPlayerBar } from './components/PlayerBar.js';
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

  // 3. Handle Spotify OAuth PKCE Callback if redirected back
  try {
    const handled = await spotifyAuth.handleRedirectCallback();
    if (handled) {
      showToast('Successfully connected to Spotify via PKCE!', 'success');
      const headerBtnText = document.getElementById('spotify-connect-text');
      if (headerBtnText) headerBtnText.textContent = 'Connected';
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

  // 3. Mount UI Components
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) renderHeader(headerContainer);

  const moodSelectorContainer = document.getElementById('mood-selector-container');
  if (moodSelectorContainer) renderMoodSelector(moodSelectorContainer);

  const aiSuggestionContainer = document.getElementById('ai-suggestion-container');
  if (aiSuggestionContainer) renderAISuggestionPanel(aiSuggestionContainer);

  const audioSlidersContainer = document.getElementById('audio-sliders-container');
  if (audioSlidersContainer) renderAudioSliders(audioSlidersContainer);

  const trackGridContainer = document.getElementById('track-grid-container');
  if (trackGridContainer) renderTrackGrid(trackGridContainer);

  const playerBarContainer = document.getElementById('player-bar-container');
  if (playerBarContainer) renderPlayerBar(playerBarContainer);

  // 4. Setup Modals
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
