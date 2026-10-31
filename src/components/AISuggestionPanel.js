/**
 * @file AISuggestionPanel.js
 * AI Mood Suggestion Assistant Panel.
 *
 * Interfaces strictly with IMoodSuggestionService via AIServiceRegistry.
 * Clearly marks all responses as [SIMULATED AI RESPONSE].
 * Enforces zero Spotify data leakage.
 */

import { aiRegistry } from '../services/ai/registry.js';
import { appState } from '../state/appState.js';

const INSPIRATION_PROMPTS = [
  'Deep focus coding late night with rain outside',
  'High-intensity gym workout & deadlift PRs',
  'Cyberpunk highway drive under neon lights',
  'Cozy morning coffee with acoustic melodies',
  'Euphoric rooftop summer sunset party',
  'Zen meditation in an ancient pine forest'
];

export function renderAISuggestionPanel(container) {
  let isGenerating = false;
  let lastResult = appState.activeSuggestion;

  const render = () => {
    container.innerHTML = `
      <section class="ai-suggestion-section glass-card" aria-label="AI Mood Assistant">
        <div class="ai-panel-header">
          <div class="ai-header-left">
            <div class="ai-icon-sparkle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h3 class="ai-panel-title">AI Mood Assistant</h3>
              <p class="ai-panel-subtitle">Describe your vibe or context to synthesize sonic recommendations</p>
            </div>
          </div>
          <div class="ai-architecture-tag" title="V1 Modular AI Integration: Uses IMoodSuggestionService mock adapter">
            <span class="tag-label">PROVIDER:</span>
            <span class="tag-value">MOCK NLP V1</span>
            <span class="simulated-pill">SIMULATED</span>
          </div>
        </div>

        <!-- Prompt Input Form -->
        <form id="ai-prompt-form" class="ai-input-form">
          <div class="input-wrapper">
            <input 
              type="text" 
              id="ai-prompt-input" 
              placeholder="e.g. 'Late night coding session under the rain' or 'Heavy workout motivation'..."
              autocomplete="off"
            />
            <button type="submit" id="btn-generate-ai" class="btn-generate-ai" ${isGenerating ? 'disabled' : ''}>
              ${isGenerating ? `
                <span class="spinner-ring"></span>
                <span>Synthesizing...</span>
              ` : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Synthesize Mood</span>
              `}
            </button>
          </div>
        </form>

        <!-- Quick Inspiration Chips -->
        <div class="inspiration-chips-row">
          <span class="chips-label">Try asking:</span>
          <div class="chips-list">
            ${INSPIRATION_PROMPTS.map(p => `
              <button type="button" class="inspiration-chip" data-prompt="${p}">
                "${p}"
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Error Alert Banner -->
        <div id="ai-error-banner" class="ai-error-alert" style="display: ${errorMessage ? 'block' : 'none'};">
          <div class="error-alert-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${errorMessage || 'AI inference service encountered an issue.'}</span>
          </div>
        </div>

        <!-- Simulated AI Result Card -->
        ${lastResult ? `
          <div class="ai-result-card animate-fade-in">
            <div class="ai-result-badge-bar">
              <span class="simulated-warning-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                ${lastResult.simulatedModelTag || '[SIMULATED AI RESPONSE - MOCK V1]'}
              </span>
              <span class="confidence-meter">
                Confidence: <strong>${Math.round(lastResult.confidence * 100)}%</strong>
              </span>
            </div>

            <div class="ai-result-body">
              <div class="result-left">
                <h4 class="result-title">${lastResult.displayTitle}</h4>
                <p class="result-rationale">${lastResult.rationale}</p>
                <div class="result-genres">
                  ${(lastResult.recommendedGenres || []).map(g => `<span class="genre-tag">#${g}</span>`).join(' ')}
                </div>
              </div>

              <div class="result-right">
                <div class="feature-radar-bars">
                  <div class="radar-bar-item">
                    <span class="radar-label">Valence</span>
                    <div class="radar-track"><div class="radar-fill" style="width: ${Math.round((lastResult.targetAudioFeatures?.valence || 0.5) * 100)}%"></div></div>
                  </div>
                  <div class="radar-bar-item">
                    <span class="radar-label">Energy</span>
                    <div class="radar-track"><div class="radar-fill" style="width: ${Math.round((lastResult.targetAudioFeatures?.energy || 0.5) * 100)}%"></div></div>
                  </div>
                  <div class="radar-bar-item">
                    <span class="radar-label">Dance</span>
                    <div class="radar-track"><div class="radar-fill" style="width: ${Math.round((lastResult.targetAudioFeatures?.danceability || 0.5) * 100)}%"></div></div>
                  </div>
                </div>

                <button id="btn-apply-ai-mood" class="btn-apply-ai-mood">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Apply Mood to Player</span>
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </section>
    `;

    // Prompt Form Submit Handler
    const form = container.querySelector('#ai-prompt-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = container.querySelector('#ai-prompt-input');
      const text = input.value.trim();
      if (!text || isGenerating) return;

      await handleGenerate(text);
    });

    // Inspiration chip clicks
    container.querySelectorAll('.inspiration-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const prompt = chip.dataset.prompt;
        const input = container.querySelector('#ai-prompt-input');
        if (input) input.value = prompt;
        await handleGenerate(prompt);
      });
    });

    // Apply Mood Button click
    const applyBtn = container.querySelector('#btn-apply-ai-mood');
    if (applyBtn && lastResult) {
      applyBtn.addEventListener('click', () => {
        appState.setMood(lastResult.mood, lastResult.targetAudioFeatures);
        // Automatically start the first matched track
        if (appState.tracks.length > 0) {
          appState.playTrack(appState.tracks[0]);
        }
      });
    }
  };

  let errorMessage = null;

  const handleGenerate = async (prompt) => {
    isGenerating = true;
    errorMessage = null;
    render();

    try {
      const suggestionService = aiRegistry.getSuggestionService();
      if (!suggestionService || typeof suggestionService.suggestMood !== 'function') {
        throw new Error('Active AI Mood Suggestion service is unavailable.');
      }
      const result = await suggestionService.suggestMood({
        prompt,
        context: {
          timeOfDay: new Date().getHours() >= 21 || new Date().getHours() < 5 ? 'late_night' : 'daytime'
        }
      });
      lastResult = result;
      appState.setActiveSuggestion(result);
    } catch (err) {
      console.error('[AISuggestionPanel] Error generating mood suggestion:', err);
      errorMessage = err.message || 'Failed to synthesize mood. Please try again.';
    } finally {
      isGenerating = false;
      render();
      if (errorMessage) {
        const errorCard = container.querySelector('#ai-error-banner');
        if (errorCard) errorCard.style.display = 'block';
      }
    }
  };

  render();
}
