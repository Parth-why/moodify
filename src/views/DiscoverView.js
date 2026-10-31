/**
 * @file DiscoverView.js
 * MOODIFY V2 — "DISCOVER" Editorial Music & Mood Collections.
 *
 * Implements:
 * - Editorial-style discovery experience with featured collections
 * - Situational Moments (Late Night Coding, Morning Ritual, Sunset Drive)
 * - Curated Mood Soundscapes with rich album artwork
 * - 1-Click play collection and "Add to My Universe" actions
 * - Interactive Web Audio Ambient Synthesizer Laboratory
 */

import { appState } from '../state/appState.js';
import { MOODIFY_CATALOG } from '../services/catalog/moodifyCatalog.js';
import { libraryService } from '../services/library/libraryService.js';
import { moodService } from '../services/moods/moodService.js';
import { showToast } from '../components/Toast.js';

const EDITORIAL_COLLECTIONS = [
  {
    id: 'col-cyberpunk',
    title: 'Midnight Neon Odyssey',
    tagline: 'Cyberpunk arpeggios and high-voltage dystopian highways',
    mood: 'cyberpunk',
    cover: '/albums/cyberpunk.jpg',
    accent: '#00F0FF',
    trackCount: '2 tracks • 6m 49s',
    description: 'Analog synthesizers, driving 4-on-the-floor kicks, and dark electronic textures designed for nocturnal travel.'
  },
  {
    id: 'col-lofi',
    title: 'Raindrops & Tape Cassettes',
    tagline: 'Warm vinyl crackle, gentle Rhodes, and acoustic beats',
    mood: 'chill',
    cover: '/albums/lofi.jpg',
    accent: '#38BDF8',
    trackCount: '2 tracks • 5m 50s',
    description: 'Downtempo tape loops and tranquil acoustic strums for relaxing, reading, or cozy late afternoons.'
  },
  {
    id: 'col-joyful',
    title: 'Golden Hour Sunbeams',
    tagline: 'Radiant melodies, feel-good funk basslines, and brass',
    mood: 'joyful',
    cover: '/albums/joyful.jpg',
    accent: '#FBBF24',
    trackCount: '2 tracks • 6m 20s',
    description: 'Uplifting harmonies, bright guitar licks, and infectious handclaps celebrating joy and summer warmth.'
  },
  {
    id: 'col-focus',
    title: 'Neural Architecture & Flow',
    tagline: 'Binaural synth pads and cerebral minimalism',
    mood: 'focused',
    cover: '/albums/focus.jpg',
    accent: '#A855F7',
    trackCount: '2 tracks • 8m 20s',
    description: 'Hypnotic ambient sequencing crafted specifically for uninterrupted software engineering and deep work.'
  }
];

const SITUATIONAL_MOMENTS = [
  { name: 'Late Night Coding', mood: 'focused', icon: '💻', color: '#A855F7' },
  { name: 'Morning Coffee Ritual', mood: 'chill', icon: '☕', color: '#38BDF8' },
  { name: 'Peak Workout Cardio', mood: 'energetic', icon: '⚡', color: '#EF4444' },
  { name: 'Rainy Solitude', mood: 'melancholy', icon: '🌧️', color: '#818CF8' },
  { name: 'Sunset Highway Drive', mood: 'cyberpunk', icon: '🌆', color: '#00F0FF' },
  { name: 'Weekend Celebration', mood: 'joyful', icon: '🎉', color: '#FBBF24' }
];

export function renderDiscoverView(container) {
  let activeTab = 'all';

  const render = () => {
    container.innerHTML = `
      <div class="view-discover animate-fade-in">
        <!-- Editorial Hero Feature -->
        <header class="discover-featured-hero">
          <div class="hero-image-wrap">
            <img src="/albums/cyberpunk.jpg" alt="Featured Collection" class="hero-cover-art" />
            <div class="hero-image-overlay"></div>
          </div>
          <div class="hero-editorial-badge">
            <span>EDITORIAL SPOTLIGHT</span>
          </div>
          <div class="hero-text-block">
            <span class="hero-sub">${EDITORIAL_COLLECTIONS[0].tagline}</span>
            <h1 class="hero-headline">${EDITORIAL_COLLECTIONS[0].title}</h1>
            <p class="hero-bio">${EDITORIAL_COLLECTIONS[0].description}</p>
            <div class="hero-buttons">
              <button id="btn-play-featured" class="btn-primary-glow btn-large">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 18 12 6 20 6 4"></polygon>
                </svg>
                <span>Play Collection</span>
              </button>
              <button id="btn-add-featured-universe" class="btn-secondary-surface btn-large">
                <span>+ Save to My Universe</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Situational Moments -->
        <section class="discover-section">
          <div class="section-header-clean">
            <div>
              <h2 class="section-title-clean">Situational Moments</h2>
              <p class="section-subtitle-clean">Curated sound environments for specific life moments</p>
            </div>
          </div>
          <div class="moments-pill-row">
            ${SITUATIONAL_MOMENTS.map(m => `
              <button class="moment-pill-card" data-mood="${m.mood}" style="--moment-color: ${m.color}">
                <span class="moment-pill-icon">${m.icon}</span>
                <span class="moment-pill-name">${m.name}</span>
                <span class="moment-pill-play">▶</span>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- Editorial Curated Collections -->
        <section class="discover-section">
          <div class="section-header-clean">
            <div>
              <h2 class="section-title-clean">Curated Mood Collections</h2>
              <p class="section-subtitle-clean">Thematic sonic atmospheres hand-crafted for emotional depth</p>
            </div>
          </div>
          <div class="editorial-collections-grid">
            ${EDITORIAL_COLLECTIONS.map(col => `
              <article class="editorial-col-card" data-col-id="${col.id}">
                <div class="col-art-wrapper">
                  <img src="${col.cover}" alt="${col.title}" class="col-art-img" />
                  <div class="col-art-glow" style="background: ${col.accent}"></div>
                  <button class="col-play-overlay-btn" data-mood="${col.mood}" aria-label="Play ${col.title}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                  </button>
                </div>
                <div class="col-meta-block">
                  <span class="col-track-count">${col.trackCount}</span>
                  <h3 class="col-title">${col.title}</h3>
                  <p class="col-desc">${col.description}</p>
                  <div class="col-footer-actions">
                    <span class="col-mood-tag" style="color: ${col.accent}">#${col.mood}</span>
                    <button class="btn-text-link btn-add-col-universe" data-mood="${col.mood}">
                      + Add Collection
                    </button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- Curated Track Catalog -->
        <section class="discover-section">
          <div class="section-header-clean">
            <div>
              <h2 class="section-title-clean">Independent Catalog Showcase</h2>
              <p class="section-subtitle-clean">Original high-fidelity tone profiles and multi-mood classified tracks</p>
            </div>
          </div>
          <div class="discover-track-cards-grid">
            ${MOODIFY_CATALOG.map(t => {
              const isPlaying = appState.isPlaying && appState.currentTrack?.id === t.id;
              const assignedMoods = moodService.getTrackMoods(t);

              return `
                <div class="discover-track-card ${isPlaying ? 'playing' : ''}" data-track-id="${t.id}">
                  <div class="discover-card-cover">
                    <img src="${t.cover || '/albums/lofi.jpg'}" alt="${t.title}" />
                    <button class="discover-track-play-btn" data-track-id="${t.id}">
                      ${isPlaying ? `
                        <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      ` : `
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                      `}
                    </button>
                  </div>
                  <div class="discover-card-info">
                    <h4 class="discover-card-title">${t.title}</h4>
                    <p class="discover-card-artist">${t.artist}</p>
                    <div class="discover-card-tags">
                      ${assignedMoods.slice(0, 2).map(m => `
                        <span class="mood-tag-mini">#${m}</span>
                      `).join('')}
                    </div>
                  </div>
                  <button class="btn-card-add-universe" data-track-id="${t.id}" title="Add to My Universe">
                    + Add
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      </div>
    `;

    // Event Handlers
    container.querySelector('#btn-play-featured')?.addEventListener('click', async () => {
      const featMood = EDITORIAL_COLLECTIONS[0].mood;
      await appState.setMood(featMood);
      if (appState.tracks.length > 0) {
        appState.playTrack(appState.tracks[0]);
        showToast(`Playing collection: "${EDITORIAL_COLLECTIONS[0].title}"`, 'success');
      }
    });

    container.querySelector('#btn-add-featured-universe')?.addEventListener('click', async () => {
      const tracksToAdd = MOODIFY_CATALOG.filter(t => t.mood === EDITORIAL_COLLECTIONS[0].mood);
      for (const t of tracksToAdd) {
        await libraryService.addTrackToLibrary(t, EDITORIAL_COLLECTIONS[0].title);
      }
      showToast(`Added ${tracksToAdd.length} tracks to My Universe!`, 'success');
    });

    // Moment pill clicks
    container.querySelectorAll('.moment-pill-card').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mood = btn.dataset.mood;
        await appState.setMood(mood);
        if (appState.tracks.length > 0) {
          appState.playTrack(appState.tracks[0]);
          showToast(`Tuned into ${btn.querySelector('.moment-pill-name').textContent}`, 'success');
        }
      });
    });

    // Collection play buttons
    container.querySelectorAll('.col-play-overlay-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mood = btn.dataset.mood;
        await appState.setMood(mood);
        if (appState.tracks.length > 0) {
          appState.playTrack(appState.tracks[0]);
          showToast(`Playing #${mood} collection`, 'success');
        }
      });
    });

    // Add collection to universe
    container.querySelectorAll('.btn-add-col-universe').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mood = btn.dataset.mood;
        const tracksToAdd = MOODIFY_CATALOG.filter(t => t.mood === mood);
        for (const t of tracksToAdd) {
          await libraryService.addTrackToLibrary(t, `Discover: #${mood}`);
        }
        showToast(`Added ${tracksToAdd.length} tracks to My Universe!`, 'success');
      });
    });

    // Individual track play
    container.querySelectorAll('.discover-track-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const trackId = btn.dataset.trackId;
        const track = MOODIFY_CATALOG.find(t => t.id === trackId);
        if (track) {
          appState.playTrack(track);
        }
      });
    });

    // Individual track add to universe
    container.querySelectorAll('.btn-card-add-universe').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = btn.dataset.trackId;
        const track = MOODIFY_CATALOG.find(t => t.id === trackId);
        if (track) {
          await libraryService.addTrackToLibrary(track, '✦ Discover Catalog');
          showToast(`Added "${track.title}" to My Universe!`, 'success');
          btn.textContent = '✓ Saved';
          btn.style.borderColor = 'var(--accent-emerald)';
          btn.style.color = 'var(--accent-emerald)';
        }
      });
    });
  };

  render();
  appState.on('playbackChange', render);
}

