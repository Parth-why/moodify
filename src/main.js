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
import { renderHeader } from './components/Header.js';
import { renderMoodSelector } from './components/MoodSelector.js';
import { renderAISuggestionPanel } from './components/AISuggestionPanel.js';
import { renderAudioSliders } from './components/AudioSliders.js';
import { renderTrackGrid } from './components/TrackGrid.js';
import { renderPlayerBar } from './components/PlayerBar.js';
import { setupMoodSenseModal } from './components/MoodSenseModal.js';
import { setupSpotifyModal } from './components/SpotifyModal.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.info('[Moodify V1] Bootstrapping application with Modular AI Architecture...');

  // 1. Audit Biometric & Privacy Compliance (Enforces Rule 9)
  const audit = AIPrivacyGuard.auditBiometricStorageCompliance();
  if (audit.compliant) {
    console.info('[Moodify Privacy Guard] Active: 0 biometric or sensitive items found in browser storage.');
  }

  // 2. Mount UI Components
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

  // 3. Setup Modals
  setupMoodSenseModal();
  setupSpotifyModal();

  // 4. Initial Mood Setup
  await appState.setMood(appState.currentMood);

  console.info('[Moodify V1] Initialization complete. Core application ready.');
});
