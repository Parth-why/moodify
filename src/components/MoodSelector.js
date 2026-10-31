/**
 * @file MoodSelector.js
 * Mood Selection Bar with glowing mood chips and active indicators.
 */

import { appState } from '../state/appState.js';
import { MoodCategories } from '../services/ai/types.js';

const MOOD_DATA = [
  { id: MoodCategories.CHILL, label: 'Chill & Lo-Fi', emoji: '☕', color: '#38BDF8' },
  { id: MoodCategories.JOYFUL, label: 'Radiant Joy', emoji: '✨', color: '#FBBF24' },
  { id: MoodCategories.CYBERPUNK, label: 'Cyberpunk', emoji: '⚡', color: '#EC4899' },
  { id: MoodCategories.FOCUSED, label: 'Deep Focus', emoji: '🧠', color: '#A855F7' },
  { id: MoodCategories.ENERGETIC, label: 'High Energy', emoji: '🔥', color: '#EF4444' },
  { id: MoodCategories.EUPHORIC, label: 'Euphoric', emoji: '🚀', color: '#8B5CF6' },
  { id: MoodCategories.MELANCHOLY, label: 'Melancholy', emoji: '🌧️', color: '#64748B' },
  { id: MoodCategories.ROMANTIC, label: 'Romantic', emoji: '🌹', color: '#F43F5E' },
  { id: MoodCategories.NATURE, label: 'Nature Zen', emoji: '🌿', color: '#10B981' }
];

export function renderMoodSelector(container) {
  const render = () => {
    container.innerHTML = `
      <section class="mood-selector-section" aria-label="Mood Category Selector">
        <div class="section-title-row">
          <h2 class="section-title">Sonic Moodscapes</h2>
          <span class="section-hint">Select a mood or describe your vibe with AI</span>
        </div>
        <div class="mood-chips-container" role="tablist">
          ${MOOD_DATA.map(m => {
            const isActive = appState.currentMood === m.id;
            return `
              <button 
                class="mood-chip ${isActive ? 'active' : ''}" 
                data-mood="${m.id}"
                style="--mood-accent: ${m.color}"
                role="tab"
                aria-selected="${isActive}"
              >
                <span class="mood-chip-emoji">${m.emoji}</span>
                <span class="mood-chip-label">${m.label}</span>
                ${isActive ? '<span class="active-glow-dot"></span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </section>
    `;

    // Attach click handlers
    container.querySelectorAll('.mood-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const moodId = btn.dataset.mood;
        appState.setMood(moodId);
      });
    });
  };

  render();
  appState.on('moodChange', () => render());
}
