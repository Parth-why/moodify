/**
 * @file MoodSenseModal.js
 * MoodSense Facial Expression Modal with Strict Privacy & Honesty Compliance.
 *
 * POLICY & PRIVACY ENFORCEMENT (Phase 2):
 * 1. Clearly distinguished: Prominently states camera AI is disabled in V1.
 * 2. Honest metrics: Does NOT fabricate live prediction percentages.
 * 3. Camera processing disabled: No frame analysis runs until real V2 models are loaded.
 * 4. Explicit permission: Camera preview is opt-in only.
 * 5. Track cleanup: Stops all media tracks immediately on close.
 * 6. Zero retention: Never uploads or persists biometric frames or landmarks.
 * 7. Camera-free discovery: Full alternative mood picker provided by default.
 * 8. Emotion disclaimer: Explicitly clarifies facial expressions are not definitive emotions.
 */

import { aiRegistry } from '../services/ai/registry.js';
import { AIPrivacyGuard } from '../services/ai/privacyGuard.js';
import { appState } from '../state/appState.js';
import { MoodCategories } from '../services/ai/types.js';

export function setupMoodSenseModal() {
  let modalEl = document.getElementById('moodsense-modal-root');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'moodsense-modal-root';
    document.body.appendChild(modalEl);
  }

  let mediaStream = null;
  let activeTab = 'camera-free'; // Default to camera-free discovery
  let cameraEnabled = false;
  let selectedMood = MoodCategories.CHILL;

  const openModal = () => {
    activeTab = 'camera-free';
    cameraEnabled = false;
    selectedMood = appState.currentMood || MoodCategories.CHILL;
    renderModal();
  };

  const closeModal = () => {
    stopCamera();
    modalEl.innerHTML = '';
  };

  const stopCamera = () => {
    const senseService = aiRegistry.getSenseService();
    if (senseService) {
      senseService.stopAnalysis();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.info('[MoodSenseModal] Camera media track stopped:', track.label);
      });
      mediaStream = null;
    }

    cameraEnabled = false;

    const canvas = modalEl.querySelector('#moodsense-canvas');
    if (canvas) {
      AIPrivacyGuard.purgeCanvasBuffer(canvas);
    }

    const video = modalEl.querySelector('#moodsense-video');
    if (video) {
      video.srcObject = null;
    }
  };

  const enableCameraPreview = async () => {
    const video = modalEl.querySelector('#moodsense-video');
    const canvas = modalEl.querySelector('#moodsense-canvas');
    const btn = modalEl.querySelector('#btn-toggle-camera');

    if (cameraEnabled) {
      stopCamera();
      if (btn) btn.textContent = 'Enable Camera Preview (Optional Opt-In)';
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        if (video) {
          video.srcObject = mediaStream;
          video.play().catch(() => {});
        }
        cameraEnabled = true;
        if (btn) btn.textContent = 'Disable Camera Preview';

        // Start UI reticle guide
        const senseService = aiRegistry.getSenseService();
        if (senseService) {
          senseService.startAnalysis(video, canvas, () => {});
        }
      } catch (err) {
        console.warn('[MoodSenseModal] Camera permission declined or unavailable:', err.message);
        alert('Camera access was not granted or is unavailable on this device. You can use the Camera-Free Discovery tab anytime.');
      }
    } else {
      alert('Camera access is not supported by your browser.');
    }
  };

  const renderModal = () => {
    modalEl.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="moodsense-backdrop">
        <div class="modal-dialog glass-card-strong animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="moodsense-title">
          
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-title-box">
              <div class="header-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3 id="moodsense-title" class="modal-title">MoodSense Emotional Interface</h3>
                <span class="simulated-badge-pill">[V1 PREVIEW — CAMERA AI DISABLED]</span>
              </div>
            </div>
            <button id="btn-close-moodsense" class="modal-close-btn" aria-label="Close modal">✕</button>
          </div>

          <!-- Emotional Context & Scientific Honesty Disclaimer -->
          <div class="privacy-guarantee-box">
            <div class="shield-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="privacy-text">
              <strong>Context & Emotion Notice:</strong>
              Facial expressions are contextual cues and do <em>not</em> represent a definitive inner emotional state. Camera AI processing is disabled in V1; no camera images or landmarks are stored.
            </div>
          </div>

          <!-- Navigation Tabs: Camera-Free vs Camera Benchmark -->
          <div class="moodsense-tabs" role="tablist">
            <button id="tab-btn-free" class="tab-btn ${activeTab === 'camera-free' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'camera-free'}">
              Camera-Free Mood Discovery (Recommended)
            </button>
            <button id="tab-btn-camera" class="tab-btn ${activeTab === 'camera-view' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'camera-view'}">
              Camera UI Placement Guide (Opt-In)
            </button>
          </div>

          <!-- Tab Content 1: Camera-Free Discovery -->
          <div id="content-camera-free" class="tab-content" style="display: ${activeTab === 'camera-free' ? 'block' : 'none'};">
            <p class="tab-description">
              Select or tune your current emotional mindset directly without requiring camera access or biometric processing:
            </p>
            <div class="free-mood-grid">
              ${[
                { id: MoodCategories.CHILL, title: 'Relaxed & Calm', emoji: '☕', desc: 'Subdued rhythms and tranquil acoustics' },
                { id: MoodCategories.FOCUSED, title: 'Deep Neural Focus', emoji: '🧠', desc: 'Minimal distraction and steady tempos' },
                { id: MoodCategories.JOYFUL, title: 'Radiant & Uplifted', emoji: '✨', desc: 'Positive melodies and bright tonalities' },
                { id: MoodCategories.ENERGETIC, title: 'Kinetic Drive', emoji: '🔥', desc: 'High tempo, intense acoustic propulsion' },
                { id: MoodCategories.MELANCHOLY, title: 'Reflective Melancholy', emoji: '🌧️', desc: 'Introspective acoustics and minor chords' },
                { id: MoodCategories.CYBERPUNK, title: 'Cyberpunk Drive', emoji: '⚡', desc: 'Driving dark synthwave arpeggios' }
              ].map(item => `
                <button type="button" class="free-mood-card ${selectedMood === item.id ? 'active' : ''}" data-mood="${item.id}">
                  <span class="free-mood-emoji">${item.emoji}</span>
                  <div class="free-mood-info">
                    <span class="free-mood-title">${item.title}</span>
                    <span class="free-mood-desc">${item.desc}</span>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Tab Content 2: Camera UI Benchmark -->
          <div id="content-camera-view" class="tab-content" style="display: ${activeTab === 'camera-view' ? 'block' : 'none'};">
            <div class="camera-optin-bar">
              <span class="optin-note">Real-time camera frame processing is disabled until V2.</span>
              <button type="button" id="btn-toggle-camera" class="btn-secondary">
                ${cameraEnabled ? 'Disable Camera Preview' : 'Enable Camera Preview (Optional Opt-In)'}
              </button>
            </div>

            <div class="camera-viewport-wrapper">
              <video id="moodsense-video" autoplay playsinline muted></video>
              <canvas id="moodsense-canvas" width="480" height="360"></canvas>
              <div class="hud-status-tag">
                <span class="pulse-dot"></span>
                <span>UI RETICLE BENCHMARK — ZERO INFERENCE</span>
              </div>
            </div>

            <div class="sim-test-controls">
              <span class="sim-test-label">Benchmark UI Expression Preset (Workflow Simulation):</span>
              <div class="sim-test-buttons">
                <button type="button" class="btn-sim-test ${selectedMood === MoodCategories.JOYFUL ? 'active' : ''}" data-mood="${MoodCategories.JOYFUL}">Smiling (Joy Preset)</button>
                <button type="button" class="btn-sim-test ${selectedMood === MoodCategories.FOCUSED ? 'active' : ''}" data-mood="${MoodCategories.FOCUSED}">Concentrating (Focus Preset)</button>
                <button type="button" class="btn-sim-test ${selectedMood === MoodCategories.CHILL ? 'active' : ''}" data-mood="${MoodCategories.CHILL}">Relaxed (Chill Preset)</button>
                <button type="button" class="btn-sim-test ${selectedMood === MoodCategories.MELANCHOLY ? 'active' : ''}" data-mood="${MoodCategories.MELANCHOLY}">Pensive (Melancholy Preset)</button>
              </div>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="modal-footer">
            <button id="btn-cancel-moodsense" class="btn-secondary">Cancel</button>
            <button id="btn-apply-moodsense" class="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Apply Emotion to Music</span>
            </button>
          </div>

        </div>
      </div>
    `;

    // Tab buttons
    modalEl.querySelector('#tab-btn-free').addEventListener('click', () => {
      activeTab = 'camera-free';
      stopCamera();
      renderModal();
    });

    modalEl.querySelector('#tab-btn-camera').addEventListener('click', () => {
      activeTab = 'camera-view';
      renderModal();
    });

    // Camera toggle
    const toggleCamBtn = modalEl.querySelector('#btn-toggle-camera');
    if (toggleCamBtn) {
      toggleCamBtn.addEventListener('click', () => enableCameraPreview());
    }

    // Camera-free mood cards
    modalEl.querySelectorAll('.free-mood-card').forEach(card => {
      card.addEventListener('click', () => {
        modalEl.querySelectorAll('.free-mood-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedMood = card.dataset.mood;
      });
    });

    // Sim test buttons
    modalEl.querySelectorAll('.btn-sim-test').forEach(btn => {
      btn.addEventListener('click', () => {
        modalEl.querySelectorAll('.btn-sim-test').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
      });
    });

    // Close handlers
    modalEl.querySelector('#btn-close-moodsense').addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-moodsense').addEventListener('click', closeModal);
    modalEl.querySelector('#moodsense-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'moodsense-backdrop') closeModal();
    });

    // Apply button
    modalEl.querySelector('#btn-apply-moodsense').addEventListener('click', () => {
      appState.setMood(selectedMood);
      if (appState.tracks.length > 0) {
        appState.playTrack(appState.tracks[0]);
      }
      closeModal();
    });
  };

  window.addEventListener('moodify:openMoodSense', openModal);
}
