/**
 * @file MoodSelector.js
 * Mood Selection Bar with 12 Core Moods, Custom Mood Creation, and Dynamic Indicators.
 */

import { appState } from '../state/appState.js';
import { moodService } from '../services/moods/moodService.js';
import { showToast } from './Toast.js';

export function renderMoodSelector(container) {
  const render = async () => {
    const moods = await moodService.getAllMoods();

    container.innerHTML = `
      <section class="mood-selector-section" aria-label="Mood Category Selector">
        <div class="section-title-row">
          <div>
            <h2 class="section-title">Sonic Moodscapes</h2>
            <span class="section-hint">Pick an emotional frequency, combine moods, or create your own</span>
          </div>
          <button id="btn-create-custom-mood" class="btn-secondary btn-small" title="Create a custom mood">
            + New Mood
          </button>
        </div>

        <div class="mood-chips-container" role="tablist">
          ${moods.map(m => {
            const moodKey = m.name.toLowerCase();
            const isActive = (appState.currentMood || '').toLowerCase() === moodKey;
            return `
              <div class="mood-chip-wrapper">
                <button 
                  class="mood-chip ${isActive ? 'active' : ''}" 
                  data-mood="${moodKey}"
                  style="--mood-accent: ${m.color}"
                  role="tab"
                  aria-selected="${isActive}"
                  title="${m.name} mood"
                >
                  <span class="mood-chip-emoji">${m.emoji || '✨'}</span>
                  <span class="mood-chip-label">${m.name}</span>
                  ${isActive ? '<span class="active-glow-dot"></span>' : ''}
                </button>
                ${!m.isDefault ? `
                  <button class="btn-delete-mood" data-delete-id="${m.id}" title="Delete custom mood">✕</button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;

    // Attach click handlers to mood chips
    container.querySelectorAll('.mood-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const moodKey = btn.dataset.mood;
        appState.setMood(moodKey);
      });
    });

    // Attach delete handlers for custom moods
    container.querySelectorAll('.btn-delete-mood').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const moodId = btn.dataset.deleteId;
        if (confirm('Delete this custom mood?')) {
          await moodService.deleteCustomMood(moodId);
          showToast('Custom mood removed.', 'info');
          render();
        }
      });
    });

    // Create custom mood button handler
    const createBtn = container.querySelector('#btn-create-custom-mood');
    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        const name = prompt('Enter a name for your custom mood (e.g. "Cyber Melancholy", "Golden Hour", "Nebula Flow"):');
        if (!name || !name.trim()) return;

        const colors = ['#A855F7', '#EC4899', '#38BDF8', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        try {
          const created = await moodService.createCustomMood({
            name: name.trim(),
            color: randomColor
          });
          showToast(`Mood "${created.name}" created!`, 'success');
          appState.setMood(created.name.toLowerCase());
          render();
        } catch (err) {
          showToast(err.message || 'Could not create mood.', 'error');
        }
      });
    }
  };

  render();
  appState.on('moodChange', () => render());
  moodService.subscribe(() => render());
}
