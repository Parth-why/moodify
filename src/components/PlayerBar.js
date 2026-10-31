/**
 * @file PlayerBar.js
 * Sticky Bottom Audio Player Bar with Real-Time Audio Visualizer.
 */

import { appState } from '../state/appState.js';
import { audioPlayer } from '../services/audio/audioPlayer.js';
import { AudioVisualizer } from '../services/audio/audioVisualizer.js';

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function renderPlayerBar(container) {
  let visualizer = null;

  const render = () => {
    const track = appState.currentTrack;
    const isPlaying = appState.isPlaying;

    container.innerHTML = `
      <footer class="player-bar glass-card-strong" role="region" aria-label="Audio Playback Bar">
        <!-- Left: Now Playing Info -->
        <div class="player-now-playing">
          ${track ? `
            <div class="player-thumb-wrapper">
              <img src="${track.cover}" alt="${track.title} artwork" class="player-thumb-img"/>
              <div class="player-mood-pill">#${track.mood}</div>
            </div>
            <div class="player-track-meta">
              <h4 class="player-title" title="${track.title}">${track.title}</h4>
              <p class="player-artist" title="${track.artist}">${track.artist}</p>
            </div>
          ` : `
            <div class="player-placeholder-meta">
              <span>Select a mood track to play</span>
            </div>
          `}
        </div>

        <!-- Center: Controls, Visualizer & Progress Bar -->
        <div class="player-center-block">
          <!-- Control Buttons -->
          <div class="player-controls">
            <button id="btn-shuffle" class="ctrl-btn" title="Shuffle (Visual only)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
            </button>

            <button id="btn-prev" class="ctrl-btn" title="Previous Track">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"></line>
              </svg>
            </button>

            <button id="btn-play-pause" class="ctrl-btn-primary" title="${isPlaying ? 'Pause' : 'Play'}">
              ${isPlaying ? `
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ` : `
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              `}
            </button>

            <button id="btn-next" class="ctrl-btn" title="Next Track">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"></line>
              </svg>
            </button>

            <button id="btn-loop" class="ctrl-btn" title="Loop Session">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </button>
          </div>

          <!-- Middle Spectrum Visualizer Canvas -->
          <div class="player-visualizer-container">
            <canvas id="player-visualizer-canvas" width="220" height="28"></canvas>
          </div>

          <!-- Timeline Scrub Bar -->
          <div class="player-timeline-row">
            <span id="player-curr-time" class="time-label">0:00</span>
            <div class="progress-bar-wrapper" id="progress-bar-container">
              <div class="progress-track">
                <div id="player-progress-fill" class="progress-fill" style="width: 0%"></div>
              </div>
            </div>
            <span id="player-total-time" class="time-label">${formatDuration(audioPlayer.duration)}</span>
          </div>
        </div>

        <!-- Right: Volume & Audio Engine Status -->
        <div class="player-right-block">
          <div class="engine-badge" title="Web Audio Synthesizer & Spotify Pipeline Active">
            <span class="engine-dot"></span>
            <span>STEREO 48k</span>
          </div>

          <div class="volume-slider-group">
            <button id="btn-volume-mute" class="ctrl-btn-small" aria-label="Mute audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            <input 
              type="range" 
              id="volume-slider" 
              min="0" 
              max="100" 
              value="${Math.round(audioPlayer.volume * 100)}"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </footer>
    `;

    // Initialize visualizer canvas
    const canvas = container.querySelector('#player-visualizer-canvas');
    if (canvas) {
      if (visualizer) visualizer.stop();
      visualizer = new AudioVisualizer(canvas);
      visualizer.start();
    }

    // Controls listeners
    container.querySelector('#btn-play-pause').addEventListener('click', () => {
      appState.togglePlay();
    });

    container.querySelector('#btn-prev').addEventListener('click', () => {
      appState.playPrevious();
    });

    container.querySelector('#btn-next').addEventListener('click', () => {
      appState.playNext();
    });

    // Seek scrub bar listener
    const progressContainer = container.querySelector('#progress-bar-container');
    if (progressContainer) {
      progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTarget = clickRatio * audioPlayer.duration;
        audioPlayer.seek(seekTarget);
      });
    }

    // Volume listener
    const volSlider = container.querySelector('#volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        audioPlayer.setVolume(val);
      });
    }

    const muteBtn = container.querySelector('#btn-volume-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (audioPlayer.volume > 0) {
          audioPlayer.setVolume(0);
          volSlider.value = 0;
        } else {
          audioPlayer.setVolume(0.8);
          volSlider.value = 80;
        }
      });
    }
  };

  render();

  // Listen for audio progress updates
  audioPlayer.subscribe((event, data) => {
    if (event === 'timeupdate') {
      const fill = container.querySelector('#player-progress-fill');
      const currTimeEl = container.querySelector('#player-curr-time');
      const totalTimeEl = container.querySelector('#player-total-time');

      if (fill && data.duration > 0) {
        const pct = Math.min(100, (data.currentTime / data.duration) * 100);
        fill.style.width = `${pct}%`;
      }
      if (currTimeEl) currTimeEl.textContent = formatDuration(data.currentTime);
      if (totalTimeEl) totalTimeEl.textContent = formatDuration(data.duration);
    }
  });

  appState.on('playbackChange', () => render());
  appState.on('trackSelected', () => render());
}
