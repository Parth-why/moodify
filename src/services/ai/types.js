/**
 * @file types.js
 * Core Type Contracts & Constants for Moodify AI/ML Services Architecture.
 *
 * All AI services communicate using these standardized DTOs (Data Transfer Objects).
 * Neither the UI nor the Spotify integration depends on model-specific formats.
 */

/**
 * Standard Mood Categories supported in Moodify
 * @readonly
 * @enum {string}
 */
export const MoodCategories = {
  JOYFUL: 'joyful',
  CHILL: 'chill',
  ENERGETIC: 'energetic',
  FOCUSED: 'focused',
  CYBERPUNK: 'cyberpunk',
  MELANCHOLY: 'melancholy',
  EUPHORIC: 'euphoric',
  ROMANTIC: 'romantic',
  NATURE: 'nature'
};

/**
 * Normalized 3-axis audio feature vector used to bridge AI mood output to music parameters.
 * Values are strictly bounded between 0.0 and 1.0.
 *
 * @typedef {Object} MoodVector
 * @property {number} valence - Positivity / musical cheerfulness (0.0 = dark/sad, 1.0 = ecstatic)
 * @property {number} energy - Perceptual intensity & activity (0.0 = calm/ambient, 1.0 = hyper/intense)
 * @property {number} danceability - Rhythmic regularity & beat strength (0.0 = freeform, 1.0 = high groove)
 * @property {number} [acousticness] - Probability of acoustic/organic sound (0.0 - 1.0)
 * @property {number} [tempo] - Approximate BPM (60 - 180)
 */

/**
 * Request payload sent to MoodSuggestionService.
 * CRITICAL PRIVACY RULE: Must NEVER contain Spotify metadata, track IDs, lyrics, or album artwork.
 *
 * @typedef {Object} MoodSuggestionRequest
 * @property {string} prompt - User freeform text (e.g. "rainy night study session in Tokyo")
 * @property {Object} [context] - Ephemeral context
 * @property {string} [context.timeOfDay] - e.g. "morning", "afternoon", "late_night"
 * @property {string} [context.activity] - e.g. "coding", "workout", "reading", "commuting"
 * @property {string} [context.weatherHint] - e.g. "rainy", "sunny", "stormy"
 */

/**
 * Standardized Response from MoodSuggestionService.
 *
 * @typedef {Object} MoodSuggestionResult
 * @property {string} mood - Primary predicted mood key (e.g. 'focused')
 * @property {string} displayTitle - Friendly human readable title (e.g. "Deep Focus & Flow")
 * @property {number} confidence - Estimation confidence score (0.0 to 1.0)
 * @property {string} rationale - Model explanation text for why this mood was suggested
 * @property {MoodVector} targetAudioFeatures - Derived target audio features for music matching
 * @property {string[]} recommendedGenres - Genre tags for music discovery
 * @property {boolean} isSimulated - Flag indicating if this was produced by mock/simulated provider
 * @property {string} simulatedModelTag - Badge tag describing the mock provider (e.g. "[SIMULATED V1 MOCK]")
 * @property {number} timestamp - Epoch timestamp of generation
 */

/**
 * Standardized Response from MoodSenseService (Camera-based facial expression estimation).
 *
 * @typedef {Object} MoodSenseResult
 * @property {string} detectedMood - Mapped mood category (e.g. 'joyful', 'chill', 'focused')
 * @property {number} confidence - Overall confidence score (0.0 to 1.0)
 * @property {Object} expressions - Normalized probability map of detected expressions
 * @property {number} expressions.neutral - (0.0 to 1.0)
 * @property {number} expressions.happy - (0.0 to 1.0)
 * @property {number} expressions.sad - (0.0 to 1.0)
 * @property {number} expressions.surprised - (0.0 to 1.0)
 * @property {number} expressions.focused - (0.0 to 1.0)
 * @property {boolean} faceDetected - True if a face was detected in the active frame
 * @property {MoodVector} targetAudioFeatures - Direct audio feature vector derived from expression
 * @property {boolean} isSimulated - Flag indicating this is simulated V1 mock inference
 * @property {string} simulatedModelTag - Badge tag describing the mock provider
 * @property {string} privacyNotice - Mandatory confirmation of zero biometric persistence
 * @property {number} timestamp - Epoch timestamp
 */

/**
 * Predefined audio feature profiles mapped to standard moods.
 * Used by mock services and as fallback calibration for future real models.
 */
export const MOOD_AUDIO_PROFILES = {
  [MoodCategories.JOYFUL]: {
    valence: 0.88,
    energy: 0.82,
    danceability: 0.80,
    acousticness: 0.20,
    tempo: 122,
    genres: ['pop', 'indie-pop', 'feel-good', 'disco']
  },
  [MoodCategories.CHILL]: {
    valence: 0.60,
    energy: 0.35,
    danceability: 0.55,
    acousticness: 0.65,
    tempo: 84,
    genres: ['lo-fi', 'chillhop', 'downtempo', 'ambient']
  },
  [MoodCategories.ENERGETIC]: {
    valence: 0.75,
    energy: 0.95,
    danceability: 0.88,
    acousticness: 0.05,
    tempo: 135,
    genres: ['edm', 'electronic', 'workout', 'drum-and-bass']
  },
  [MoodCategories.FOCUSED]: {
    valence: 0.50,
    energy: 0.42,
    danceability: 0.40,
    acousticness: 0.50,
    tempo: 100,
    genres: ['ambient', 'classical', 'synth-wave', 'minimal-techno']
  },
  [MoodCategories.CYBERPUNK]: {
    valence: 0.45,
    energy: 0.88,
    danceability: 0.72,
    acousticness: 0.02,
    tempo: 128,
    genres: ['synthwave', 'darksynth', 'cyberpunk', 'industrial']
  },
  [MoodCategories.MELANCHOLY]: {
    valence: 0.22,
    energy: 0.28,
    danceability: 0.32,
    acousticness: 0.80,
    tempo: 72,
    genres: ['acoustic', 'sad-indie', 'piano', 'neo-classical']
  },
  [MoodCategories.EUPHORIC]: {
    valence: 0.92,
    energy: 0.90,
    danceability: 0.85,
    acousticness: 0.10,
    tempo: 128,
    genres: ['future-bass', 'progressive-house', 'festival', 'dance']
  },
  [MoodCategories.ROMANTIC]: {
    valence: 0.70,
    energy: 0.40,
    danceability: 0.60,
    acousticness: 0.70,
    tempo: 90,
    genres: ['r-n-b', 'soul', 'acoustic-love', 'jazz']
  },
  [MoodCategories.NATURE]: {
    valence: 0.65,
    energy: 0.25,
    danceability: 0.30,
    acousticness: 0.90,
    tempo: 68,
    genres: ['nature-sounds', 'meditation', 'ambient-zen', 'flute']
  }
};
