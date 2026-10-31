/**
 * @file JourneysView.js
 * MOODIFY V2 — "MOOD JOURNEYS" Signature Guided Emotional Transition Experience.
 *
 * Implements a 5-step guided workflow:
 * Step 1: Choose your starting mood.
 * Step 2: Choose your destination mood.
 * Step 3: Select journey duration or song count.
 * Step 4: Generate and preview the journey with a visual transition spectrum.
 * Step 5: Rearrange songs and export/save when ready.
 */

import { appState } from '../state/appState.js';
import { moodService } from '../services/moods/moodService.js';
import { libraryService } from '../services/library/libraryService.js';
import { MOODIFY_CATALOG } from '../services/catalog/moodifyCatalog.js';
import { showToast } from '../components/Toast.js';

export function renderJourneysView(container) {
  let currentStep = 1;
  let originMood = 'melancholic';
  let destMood = 'energetic';
  let durationMin = 30;
  let songCount = 6;
  let pacing = 'gentle'; // 'gentle' | 'dynamic'
  let generatedTracks = [];

  const render = async () => {
    const allMoods = await moodService.getAllMoods();
    const originMoodObj = allMoods.find(m => m.name.toLowerCase() === originMood.toLowerCase()) || allMoods[0];
    const destMoodObj = allMoods.find(m => m.name.toLowerCase() === destMood.toLowerCase()) || allMoods[1];
    const savedJourneys = appState.savedJourneys || [];

    container.innerHTML = `
      <div class="view-journeys animate-fade-in">
        <!-- Section Header -->
        <header class="journeys-hero-header">
          <div class="journey-badge-pill">
            <span class="pulse-dot"></span>
            <span>SIGNATURE SONIC EXPERIENCE</span>
          </div>
          <h1 class="journeys-title">Mood Journeys</h1>
          <p class="journeys-subtitle">
            Curate seamless musical transitions that gently guide your emotional state from where you are to where you want to be.
          </p>
        </header>

        <!-- 5-Step Guided Progress Bar -->
        <nav class="journey-stepper-bar" aria-label="Journey Creation Steps">
          <button class="step-nav-btn ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}" data-step="1">
            <span class="step-num">${currentStep > 1 ? '✓' : '1'}</span>
            <span class="step-label">Origin Mood</span>
          </button>
          <div class="step-connector ${currentStep > 1 ? 'filled' : ''}"></div>

          <button class="step-nav-btn ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}" data-step="2">
            <span class="step-num">${currentStep > 2 ? '✓' : '2'}</span>
            <span class="step-label">Destination</span>
          </button>
          <div class="step-connector ${currentStep > 2 ? 'filled' : ''}"></div>

          <button class="step-nav-btn ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}" data-step="3">
            <span class="step-num">${currentStep > 3 ? '✓' : '3'}</span>
            <span class="step-label">Pacing & Duration</span>
          </button>
          <div class="step-connector ${currentStep > 3 ? 'filled' : ''}"></div>

          <button class="step-nav-btn ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}" data-step="4">
            <span class="step-num">${currentStep > 4 ? '✓' : '4'}</span>
            <span class="step-label">Transition Preview</span>
          </button>
          <div class="step-connector ${currentStep > 4 ? 'filled' : ''}"></div>

          <button class="step-nav-btn ${currentStep === 5 ? 'active' : ''}" data-step="5">
            <span class="step-num">5</span>
            <span class="step-label">Tune & Save</span>
          </button>
        </nav>

        <!-- Step Container Card -->
        <div class="journey-step-card glass-card">
          ${renderStepContent(allMoods, originMoodObj, destMoodObj)}
        </div>

        <!-- Saved Journeys History Section -->
        ${savedJourneys.length > 0 ? `
          <section class="saved-journeys-section">
            <div class="section-header-clean">
              <div>
                <h2 class="section-title-clean">Your Saved Journeys</h2>
                <p class="section-subtitle-clean">Replay your customized emotional pathways</p>
              </div>
            </div>
            <div class="saved-journeys-grid">
              ${savedJourneys.map(j => `
                <div class="saved-journey-full-card" data-journey-id="${j.id}">
                  <div class="journey-card-gradient" style="background: linear-gradient(135deg, ${j.originColor || '#818CF8'}, ${j.destColor || '#F59E0B'})"></div>
                  <div class="journey-card-content">
                    <div class="journey-card-top">
                      <span class="journey-meta-badge">${j.durationMin}m • ${j.tracks?.length || 0} tracks</span>
                      <button class="btn-delete-saved-journey" data-delete-id="${j.id}" title="Delete journey">✕</button>
                    </div>
                    <h3 class="saved-journey-title">${j.title}</h3>
                    <p class="saved-journey-desc">Transition from #${j.fromMood} into #${j.toMood}</p>
                    <button class="btn-primary-glow btn-small btn-play-saved-journey" data-play-id="${j.id}">
                      ▶ Play Journey
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    `;

    attachEventHandlers(allMoods);
  };

  function renderStepContent(allMoods, originMoodObj, destMoodObj) {
    if (currentStep === 1) {
      return `
        <div class="step-body animate-slide-up">
          <div class="step-heading-group">
            <span class="step-subhead">STEP 1 OF 5</span>
            <h2 class="step-title">Where are you starting right now?</h2>
            <p class="step-desc">Select the emotional state or energy level that matches how you feel at this moment.</p>
          </div>

          <div class="mood-selection-grid">
            ${allMoods.map(m => {
              const isSelected = m.name.toLowerCase() === originMood.toLowerCase();
              return `
                <div class="mood-choice-card ${isSelected ? 'selected' : ''}" data-mood-choice="${m.name.toLowerCase()}" style="--choice-color: ${m.color}">
                  <div class="choice-indicator"></div>
                  <span class="choice-emoji">${m.emoji || '✨'}</span>
                  <h4 class="choice-title">${m.name}</h4>
                  <span class="choice-cat">${m.category}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="step-actions-footer">
            <div></div>
            <button id="btn-next-step" class="btn-primary-glow btn-large">
              <span>Next: Choose Destination →</span>
            </button>
          </div>
        </div>
      `;
    }

    if (currentStep === 2) {
      return `
        <div class="step-body animate-slide-up">
          <div class="step-heading-group">
            <span class="step-subhead">STEP 2 OF 5</span>
            <h2 class="step-title">Where do you want to be?</h2>
            <p class="step-desc">
              Origin: <strong style="color: ${originMoodObj.color};">#${originMoodObj.name}</strong>. Choose the target mood you wish to arrive at.
            </p>
          </div>

          <div class="mood-selection-grid">
            ${allMoods.map(m => {
              const isSelected = m.name.toLowerCase() === destMood.toLowerCase();
              const isOrigin = m.name.toLowerCase() === originMood.toLowerCase();
              return `
                <div class="mood-choice-card ${isSelected ? 'selected' : ''}" data-dest-choice="${m.name.toLowerCase()}" style="--choice-color: ${m.color}">
                  <div class="choice-indicator"></div>
                  <span class="choice-emoji">${m.emoji || '✨'}</span>
                  <h4 class="choice-title">${m.name}</h4>
                  <span class="choice-cat">${isOrigin ? '(Starting Mood)' : m.category}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="step-actions-footer">
            <button id="btn-prev-step" class="btn-secondary-surface">
              ← Back to Origin
            </button>
            <button id="btn-next-step" class="btn-primary-glow btn-large">
              <span>Next: Pacing & Duration →</span>
            </button>
          </div>
        </div>
      `;
    }

    if (currentStep === 3) {
      return `
        <div class="step-body animate-slide-up">
          <div class="step-heading-group">
            <span class="step-subhead">STEP 3 OF 5</span>
            <h2 class="step-title">Set your pacing and duration</h2>
            <p class="step-desc">
              Modulating from <strong style="color: ${originMoodObj.color}">#${originMoodObj.name}</strong> to <strong style="color: ${destMoodObj.color}">#${destMoodObj.name}</strong>.
            </p>
          </div>

          <div class="pacing-options-group">
            <h4 class="options-group-title">Session Length</h4>
            <div class="duration-cards-row">
              <div class="duration-card ${durationMin === 15 ? 'selected' : ''}" data-duration="15" data-songs="4">
                <span class="dur-time">15 min</span>
                <span class="dur-songs">4 tracks</span>
                <p class="dur-desc">Quick mental reset or short commute lift</p>
              </div>
              <div class="duration-card ${durationMin === 30 ? 'selected' : ''}" data-duration="30" data-songs="8">
                <span class="dur-time">30 min</span>
                <span class="dur-songs">8 tracks</span>
                <p class="dur-desc">Ideal emotional modulation session</p>
              </div>
              <div class="duration-card ${durationMin === 60 ? 'selected' : ''}" data-duration="60" data-songs="15">
                <span class="dur-time">60 min</span>
                <span class="dur-songs">15 tracks</span>
                <p class="dur-desc">Deep focus, meditation, or extended travel</p>
              </div>
            </div>

            <h4 class="options-group-title" style="margin-top: 24px;">Transition Curve</h4>
            <div class="curve-cards-row">
              <div class="curve-card ${pacing === 'gentle' ? 'selected' : ''}" data-pacing="gentle">
                <div class="curve-icon">∿</div>
                <div>
                  <h5 class="curve-title">Gentle Harmonic Arc</h5>
                  <p class="curve-desc">Gradual shift in tempo, valence, and harmonic density</p>
                </div>
              </div>
              <div class="curve-card ${pacing === 'dynamic' ? 'selected' : ''}" data-pacing="dynamic">
                <div class="curve-icon">⚡</div>
                <div>
                  <h5 class="curve-title">Dynamic Leap</h5>
                  <p class="curve-desc">Energizing pivot point midway through the experience</p>
                </div>
              </div>
            </div>
          </div>

          <div class="step-actions-footer">
            <button id="btn-prev-step" class="btn-secondary-surface">
              ← Back
            </button>
            <button id="btn-generate-journey" class="btn-primary-glow btn-large">
              <span>Generate Journey Spectrum →</span>
            </button>
          </div>
        </div>
      `;
    }

    if (currentStep === 4) {
      return `
        <div class="step-body animate-slide-up">
          <div class="step-heading-group">
            <span class="step-subhead">STEP 4 OF 5</span>
            <h2 class="step-title">Your Emotional Transition Preview</h2>
            <p class="step-desc">
              From <strong style="color: ${originMoodObj.color}">#${originMoodObj.name}</strong> 
              to <strong style="color: ${destMoodObj.color}">#${destMoodObj.name}</strong> (${songCount} tracks, ${durationMin} mins)
            </p>
          </div>

          <!-- Visual Transition Spectrum -->
          <div class="journey-spectrum-display">
            <div class="spectrum-bar" style="background: linear-gradient(90deg, ${originMoodObj.color}, ${destMoodObj.color});">
              <div class="spectrum-marker origin-marker" style="--m-color: ${originMoodObj.color}">
                <span>Origin: #${originMoodObj.name}</span>
              </div>
              <div class="spectrum-marker dest-marker" style="--m-color: ${destMoodObj.color}">
                <span>Destination: #${destMoodObj.name}</span>
              </div>
            </div>
            <div class="spectrum-waypoints">
              ${generatedTracks.map((t, idx) => `
                <div class="waypoint-node" style="left: ${(idx / (generatedTracks.length - 1 || 1)) * 100}%">
                  <span class="node-dot"></span>
                  <span class="node-title">${t.title}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Track Sequence List -->
          <div class="journey-preview-tracks">
            ${generatedTracks.map((t, idx) => `
              <div class="journey-track-item">
                <span class="track-step-badge">Stage ${idx + 1}</span>
                <img src="${t.cover || '/albums/lofi.jpg'}" alt="${t.title}" class="journey-track-img"/>
                <div class="journey-track-meta">
                  <h4 class="journey-track-title">${t.title}</h4>
                  <p class="journey-track-artist">${t.artist}</p>
                </div>
                <div class="journey-track-energy">
                  <span class="energy-pill">#${t.mood || originMood}</span>
                </div>
                <button class="btn-icon-subtle btn-preview-track" data-track-id="${t.id}" title="Preview song">
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                </button>
              </div>
            `).join('')}
          </div>

          <div class="step-actions-footer">
            <button id="btn-prev-step" class="btn-secondary-surface">
              ← Adjust Pacing
            </button>
            <button id="btn-next-step" class="btn-primary-glow btn-large">
              <span>Next: Tune & Save →</span>
            </button>
          </div>
        </div>
      `;
    }

    if (currentStep === 5) {
      return `
        <div class="step-body animate-slide-up">
          <div class="step-heading-group">
            <span class="step-subhead">STEP 5 OF 5</span>
            <h2 class="step-title">Rearrange and Save Your Journey</h2>
            <p class="step-desc">
              Your customized arc from #${originMoodObj.name} to #${destMoodObj.name} is ready to experience.
            </p>
          </div>

          <!-- Rearrange Tracks -->
          <div class="journey-reorder-list">
            ${generatedTracks.map((t, idx) => `
              <div class="reorder-track-card" data-index="${idx}">
                <div class="reorder-handle">≡</div>
                <span class="reorder-num">${idx + 1}</span>
                <img src="${t.cover || '/albums/lofi.jpg'}" alt="${t.title}" class="reorder-thumb"/>
                <div class="reorder-meta">
                  <h4 class="reorder-title">${t.title}</h4>
                  <p class="reorder-artist">${t.artist}</p>
                </div>
                <div class="reorder-actions">
                  ${idx > 0 ? `
                    <button class="btn-reorder-move" data-move-idx="${idx}" data-dir="-1" title="Move Up">↑</button>
                  ` : ''}
                  ${idx < generatedTracks.length - 1 ? `
                    <button class="btn-reorder-move" data-move-idx="${idx}" data-dir="1" title="Move Down">↓</button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="journey-final-controls">
            <button id="btn-play-full-journey" class="btn-primary-glow btn-large">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
              <span>Play Full Journey Now</span>
            </button>
            <button id="btn-save-journey" class="btn-secondary-surface btn-large">
              <span>🪐 Save to My Universe</span>
            </button>
            <button id="btn-restart-journey" class="btn-text-link">
              Design Another Journey
            </button>
          </div>
        </div>
      `;
    }
  }

  function generateJourneyProgression() {
    // Collect candidate pool from library or catalog
    const libraryTracks = libraryService.getLibraryTracks();
    const pool = libraryTracks.length > 0 ? libraryTracks : MOODIFY_CATALOG;

    // Filter tracks for origin and destination
    const originTracks = pool.filter(t => (t.mood || '').toLowerCase() === originMood.toLowerCase());
    const destTracks = pool.filter(t => (t.mood || '').toLowerCase() === destMood.toLowerCase());
    const remainingTracks = pool.filter(t => 
      (t.mood || '').toLowerCase() !== originMood.toLowerCase() && 
      (t.mood || '').toLowerCase() !== destMood.toLowerCase()
    );

    const half = Math.floor(songCount / 2);
    const firstHalf = originTracks.slice(0, half);
    const secondHalf = destTracks.slice(0, songCount - half);

    // If pool is small, supplement with remaining tracks
    generatedTracks = [...firstHalf, ...secondHalf];
    if (generatedTracks.length < songCount) {
      const needed = songCount - generatedTracks.length;
      generatedTracks = [...generatedTracks, ...remainingTracks.slice(0, needed)];
    }
    // Fallback if still under count
    if (generatedTracks.length === 0) {
      generatedTracks = pool.slice(0, songCount);
    }
  }

  function attachEventHandlers(allMoods) {
    // Stepper navigation clicks
    container.querySelectorAll('.step-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.step, 10);
        if (targetStep <= currentStep || generatedTracks.length > 0) {
          currentStep = targetStep;
          render();
        }
      });
    });

    // Step 1: Origin mood selection
    container.querySelectorAll('[data-mood-choice]').forEach(card => {
      card.addEventListener('click', () => {
        originMood = card.dataset.moodChoice;
        render();
      });
    });

    // Step 2: Destination mood selection
    container.querySelectorAll('[data-dest-choice]').forEach(card => {
      card.addEventListener('click', () => {
        destMood = card.dataset.destChoice;
        render();
      });
    });

    // Step 3: Duration & pacing selection
    container.querySelectorAll('.duration-card').forEach(card => {
      card.addEventListener('click', () => {
        durationMin = parseInt(card.dataset.duration, 10);
        songCount = parseInt(card.dataset.songs, 10);
        render();
      });
    });

    container.querySelectorAll('.curve-card').forEach(card => {
      card.addEventListener('click', () => {
        pacing = card.dataset.pacing;
        render();
      });
    });

    // Next / Prev step buttons
    container.querySelector('#btn-next-step')?.addEventListener('click', () => {
      if (currentStep < 5) {
        currentStep++;
        if (currentStep === 4 && generatedTracks.length === 0) {
          generateJourneyProgression();
        }
        render();
      }
    });

    container.querySelector('#btn-prev-step')?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        render();
      }
    });

    // Generate button on Step 3
    container.querySelector('#btn-generate-journey')?.addEventListener('click', () => {
      generateJourneyProgression();
      currentStep = 4;
      render();
    });

    // Step 4: Preview individual track
    container.querySelectorAll('.btn-preview-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const trackId = btn.dataset.trackId;
        const track = generatedTracks.find(t => t.id === trackId);
        if (track) {
          appState.playTrack(track);
          showToast(`Previewing "${track.title}"`, 'info');
        }
      });
    });

    // Step 5: Rearrange tracks
    container.querySelectorAll('.btn-reorder-move').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.moveIdx, 10);
        const dir = parseInt(btn.dataset.dir, 10);
        const targetIdx = idx + dir;
        if (targetIdx >= 0 && targetIdx < generatedTracks.length) {
          const temp = generatedTracks[idx];
          generatedTracks[idx] = generatedTracks[targetIdx];
          generatedTracks[targetIdx] = temp;
          render();
        }
      });
    });

    // Play Full Journey
    container.querySelector('#btn-play-full-journey')?.addEventListener('click', () => {
      if (generatedTracks.length > 0) {
        appState.setTracks(generatedTracks);
        appState.playTrack(generatedTracks[0]);
        showToast(`Starting journey: #${originMood} → #${destMood}`, 'success');
      }
    });

    // Save Journey
    container.querySelector('#btn-save-journey')?.addEventListener('click', () => {
      const originMoodObj = allMoods.find(m => m.name.toLowerCase() === originMood.toLowerCase());
      const destMoodObj = allMoods.find(m => m.name.toLowerCase() === destMood.toLowerCase());

      const journey = {
        id: `journey-${Date.now()}`,
        title: `${originMoodObj?.name || originMood} to ${destMoodObj?.name || destMood} Arc`,
        fromMood: originMoodObj?.name || originMood,
        toMood: destMoodObj?.name || destMood,
        originColor: originMoodObj?.color || '#818CF8',
        destColor: destMoodObj?.color || '#F59E0B',
        durationMin,
        tracks: [...generatedTracks],
        createdAt: new Date().toISOString()
      };

      appState.saveJourney(journey);
      showToast('Journey saved to your universe!', 'success');
      render();
    });

    container.querySelector('#btn-restart-journey')?.addEventListener('click', () => {
      currentStep = 1;
      generatedTracks = [];
      render();
    });

    // Saved journeys play / delete
    container.querySelectorAll('.btn-play-saved-journey').forEach(btn => {
      btn.addEventListener('click', () => {
        const jId = btn.dataset.playId;
        const j = appState.savedJourneys.find(item => item.id === jId);
        if (j && j.tracks?.length > 0) {
          appState.setTracks(j.tracks);
          appState.playTrack(j.tracks[0]);
          showToast(`Resuming "${j.title}"`, 'success');
        }
      });
    });

    container.querySelectorAll('.btn-delete-saved-journey').forEach(btn => {
      btn.addEventListener('click', () => {
        const jId = btn.dataset.deleteId;
        appState.deleteJourney(jId);
        showToast('Saved journey removed.', 'info');
        render();
      });
    });
  }

  render();
}
