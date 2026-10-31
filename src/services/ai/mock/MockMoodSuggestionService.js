/**
 * @file MockMoodSuggestionService.js
 * Mock implementation of IMoodSuggestionService for V1 Development and UI Testing.
 *
 * Simulates intelligent NLP/LLM mood inference without external dependencies.
 * All outputs are explicitly marked with `isSimulated: true` and simulation badges.
 */

import { IMoodSuggestionService } from '../interfaces/IMoodSuggestionService.js';
import { AIPrivacyGuard } from '../privacyGuard.js';
import { MoodCategories, MOOD_AUDIO_PROFILES } from '../types.js';

export class MockMoodSuggestionService extends IMoodSuggestionService {
  constructor() {
    super();
    this.providerName = 'Moodify Mock AI Lab';
    this.modelName = 'Simulated-PromptMood-V1';
    this.version = '1.0.0-mock';
  }

  /**
   * Generates simulated mood suggestions based on prompt keywords and context.
   *
   * @param {import('../types.js').MoodSuggestionRequest} rawRequest
   * @returns {Promise<import('../types.js').MoodSuggestionResult>}
   */
  async suggestMood(rawRequest) {
    // 1. Strictly sanitize payload through AIPrivacyGuard (enforces Rule 8)
    const request = AIPrivacyGuard.sanitizeSuggestionRequest(rawRequest);
    const text = (request.prompt || '').toLowerCase();
    const context = request.context || {};

    // Simulate realistic inference latency (250ms - 450ms)
    await new Promise((resolve) => setTimeout(resolve, 320));

    // Keyword matching rules for intelligent mock simulation
    let predictedMood = MoodCategories.CHILL;
    let rationale = 'Default ambient relaxation baseline selected based on neutral context.';

    if (text.match(/code|coding|study|focus|read|work|deep|debug|algorithm|math/)) {
      predictedMood = MoodCategories.FOCUSED;
      rationale = `Identified high cognitive load terms ('focus', 'deep work'). Tuned for minimal distraction with moderate tempo and steady rhythms.`;
    } else if (text.match(/gym|workout|run|running|lift|pump|cardio|energy|hype|beast/)) {
      predictedMood = MoodCategories.ENERGETIC;
      rationale = `Detected high-intensity physical keywords. Maximized acoustic drive (0.95 energy) and upbeat tempo for peak motivation.`;
    } else if (text.match(/party|dance|club|festival|rave|celebrate|weekend|euphoria/)) {
      predictedMood = MoodCategories.EUPHORIC;
      rationale = `Recognized celebratory party context. Calibrated high valence (0.92) with danceable grooves and expansive soundscapes.`;
    } else if (text.match(/cyber|neon|future|synth|tokyo|night drive|blade|matrix|tech/)) {
      predictedMood = MoodCategories.CYBERPUNK;
      rationale = `Synthesized retro-futuristic dark synth aesthetic with driving arpeggios and high electronic density.`;
    } else if (text.match(/sad|rain|melancholy|lonely|heartbreak|grief|cry|nostalgia|gloomy/)) {
      predictedMood = MoodCategories.MELANCHOLY;
      rationale = `Detected introspective emotional undertones. Selected reflective minor tonalities with delicate acoustic textures.`;
    } else if (text.match(/happy|joy|sun|sunny|beach|smile|morning|bright|good vibes|cheer/)) {
      predictedMood = MoodCategories.JOYFUL;
      rationale = `Identified positive valence markers. Boosted brightness, major key signatures, and cheerful instrumentation.`;
    } else if (text.match(/love|romance|date|candle|intimate|warmth|kiss|lovers/)) {
      predictedMood = MoodCategories.ROMANTIC;
      rationale = `Classified intimate romantic context. Selected warm vocal tones, lush strings, and sensual mid-tempo rhythms.`;
    } else if (text.match(/nature|forest|zen|meditate|breathe|peace|tree|ocean|stream/)) {
      predictedMood = MoodCategories.NATURE;
      rationale = `Recognized organic mindfulness themes. Prioritized organic acoustics, atmospheric field recordings, and restorative frequencies.`;
    } else if (context.timeOfDay === 'late_night') {
      predictedMood = MoodCategories.CHILL;
      rationale = `Late night temporal context applied. Selected subdued lo-fi beats and cozy down-tempo textures.`;
    }

    const profile = MOOD_AUDIO_PROFILES[predictedMood] || MOOD_AUDIO_PROFILES[MoodCategories.CHILL];
    const confidence = parseFloat((0.88 + Math.random() * 0.09).toFixed(2));

    const titles = {
      [MoodCategories.JOYFUL]: 'Radiant Joy & Golden Vibes',
      [MoodCategories.CHILL]: 'Cozy Lo-Fi & Twilight Chill',
      [MoodCategories.ENERGETIC]: 'High Voltage Kinetic Energy',
      [MoodCategories.FOCUSED]: 'Deep Neural Focus & Flow State',
      [MoodCategories.CYBERPUNK]: 'Neon Overdrive & Synthwave',
      [MoodCategories.MELANCHOLY]: 'Midnight Rain & Velvet Melancholy',
      [MoodCategories.EUPHORIC]: 'Euphoric Horizons & Festival Drive',
      [MoodCategories.ROMANTIC]: 'Velvet Soul & Warm Romance',
      [MoodCategories.NATURE]: 'Tranquil Zen & Biophilic Echoes'
    };

    return {
      mood: predictedMood,
      displayTitle: titles[predictedMood] || 'Custom Mood Session',
      confidence,
      rationale: `[SIMULATED AI RESPONSE] ${rationale}`,
      targetAudioFeatures: {
        valence: profile.valence,
        energy: profile.energy,
        danceability: profile.danceability,
        acousticness: profile.acousticness,
        tempo: profile.tempo
      },
      recommendedGenres: [...profile.genres],
      isSimulated: true,
      simulatedModelTag: '[SIMULATED V1 MOCK]',
      timestamp: Date.now()
    };
  }

  async isAvailable() {
    return true;
  }

  getModelInfo() {
    return {
      provider: this.providerName,
      modelName: this.modelName,
      isSimulated: true,
      version: this.version
    };
  }
}
