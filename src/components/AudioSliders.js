/**
 * @file AudioSliders.js
 * Fine-Tuning Audio Feature Sliders (Valence, Energy, Danceability, Tempo).
 *
 * Allows users to manually sculpt the sonic properties of their mood session.
 */

import { appState } from '../state/appState.js';

export function renderAudioSliders(container) {
  const render = () => {
    const f = appState.targetAudioFeatures || {
      valence: 0.6,
      energy: 0.5,
      danceability: 0.5,
      tempo: 100
    };

    container.innerHTML = `
      <section class="audio-sliders-section glass-card" aria-label="Audio Feature Modulators">
        <div class="sliders-header">
          <div class="sliders-title-group">
            <svg class="sliders-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <div>
              <h3 class="sliders-title">Acoustic Parameter Sculptor</h3>
              <p class="sliders-subtitle">Fine-tune the audio synthesis vector</p>
            </div>
          </div>
          <button id="btn-reset-sliders" class="btn-text-secondary" title="Reset parameters to mood default">
            Reset Defaults
          </button>
        </div>

        <div class="sliders-grid">
          <!-- Valence -->
          <div class="slider-card">
            <div class="slider-label-row">
              <span class="param-name">Valence</span>
              <span class="param-val" id="val-valence">${Math.round((f.valence ?? 0.5) * 100)}%</span>
            </div>
            <input 
              type="range" 
              id="slider-valence" 
              min="0" 
              max="100" 
              value="${Math.round((f.valence ?? 0.5) * 100)}"
              aria-label="Valence slider"
            />
            <div class="slider-endpoints">
              <span>Melancholy</span>
              <span>Cheer</span>
            </div>
          </div>

          <!-- Energy -->
          <div class="slider-card">
            <div class="slider-label-row">
              <span class="param-name">Energy</span>
              <span class="param-val" id="val-energy">${Math.round((f.energy ?? 0.5) * 100)}%</span>
            </div>
            <input 
              type="range" 
              id="slider-energy" 
              min="0" 
              max="100" 
              value="${Math.round((f.energy ?? 0.5) * 100)}"
              aria-label="Energy slider"
            />
            <div class="slider-endpoints">
              <span>Ambient</span>
              <span>Kinetic</span>
            </div>
          </div>

          <!-- Danceability -->
          <div class="slider-card">
            <div class="slider-label-row">
              <span class="param-name">Danceability</span>
              <span class="param-val" id="val-dance">${Math.round((f.danceability ?? 0.5) * 100)}%</span>
            </div>
            <input 
              type="range" 
              id="slider-dance" 
              min="0" 
              max="100" 
              value="${Math.round((f.danceability ?? 0.5) * 100)}"
              aria-label="Danceability slider"
            />
            <div class="slider-endpoints">
              <span>Subtle</span>
              <span>Groove</span>
            </div>
          </div>

          <!-- Tempo -->
          <div class="slider-card">
            <div class="slider-label-row">
              <span class="param-name">Tempo</span>
              <span class="param-val" id="val-tempo">${Math.round(f.tempo ?? 100)} BPM</span>
            </div>
            <input 
              type="range" 
              id="slider-tempo" 
              min="60" 
              max="180" 
              value="${Math.round(f.tempo ?? 100)}"
              aria-label="Tempo slider"
            />
            <div class="slider-endpoints">
              <span>60 BPM</span>
              <span>180 BPM</span>
            </div>
          </div>
        </div>
      </section>
    `;

    // Sliders listeners
    const attachSlider = (sliderId, valId, key, scale = 0.01, unit = '%') => {
      const slider = container.querySelector(sliderId);
      const valDisplay = container.querySelector(valId);
      if (slider && valDisplay) {
        slider.addEventListener('input', (e) => {
          const raw = Number(e.target.value);
          valDisplay.textContent = `${raw}${unit}`;
          appState.targetAudioFeatures[key] = scale === 1 ? raw : raw * scale;
          // Trigger re-match
          appState.setMood(appState.currentMood, appState.targetAudioFeatures);
        });
      }
    };

    attachSlider('#slider-valence', '#val-valence', 'valence', 0.01, '%');
    attachSlider('#slider-energy', '#val-energy', 'energy', 0.01, '%');
    attachSlider('#slider-dance', '#val-dance', 'danceability', 0.01, '%');
    attachSlider('#slider-tempo', '#val-tempo', 'tempo', 1, ' BPM');

    // Reset button
    const resetBtn = container.querySelector('#btn-reset-sliders');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        appState.setMood(appState.currentMood);
      });
    }
  };

  render();
  appState.on('moodChange', () => render());
}
