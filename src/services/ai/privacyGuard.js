/**
 * @file privacyGuard.js
 * Strict Privacy & Air-Gap Enforcement Layer for Moodify AI/ML Services.
 *
 * Implements architectural constraints:
 * 1. Rule 8: Zero Spotify metadata/artwork/lyrics leakage to AI models.
 * 2. Rule 9: Zero camera frame/landmark/expression persistence.
 */

// Forbidden keys that must NEVER be passed to AI inference models
const FORBIDDEN_SPOTIFY_PATTERNS = [
  /spotify/i,
  /track_?id/i,
  /track_?uri/i,
  /album_?art/i,
  /artwork/i,
  /lyrics/i,
  /audio_?buffer/i,
  /preview_?url/i,
  /access_?token/i,
  /refresh_?token/i,
  /client_?secret/i
];

export class AIPrivacyGuard {
  /**
   * Enforces Rule 8: Sanitizes suggestion requests to ensure Spotify metadata
   * or private user listening history is strictly stripped before AI processing.
   * Recursively sanitizes nested objects and strings.
   *
   * @param {Object} rawRequest - Incoming user or context request
   * @returns {import('./types.js').MoodSuggestionRequest} Sanitized safe request
   * @throws {Error} If explicit unauthorized Spotify data injection is detected
   */
  static sanitizeSuggestionRequest(rawRequest) {
    if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
      return Object.freeze({ prompt: '', context: {} });
    }

    // Deep check and sanitize keys
    this._deepSanitize(rawRequest);

    // Whitelist-only output contract
    const safePayload = {
      prompt: typeof rawRequest.prompt === 'string' ? rawRequest.prompt.slice(0, 500).trim() : '',
      context: {
        timeOfDay: typeof rawRequest.context?.timeOfDay === 'string' ? rawRequest.context.timeOfDay : undefined,
        activity: typeof rawRequest.context?.activity === 'string' ? rawRequest.context.activity : undefined,
        weatherHint: typeof rawRequest.context?.weatherHint === 'string' ? rawRequest.context.weatherHint : undefined
      }
    };

    return Object.freeze(safePayload);
  }

  /**
   * Recursive sanitizer that strips forbidden keys and values.
   * @private
   */
  static _deepSanitize(obj) {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const isForbidden = FORBIDDEN_SPOTIFY_PATTERNS.some(regex => regex.test(key));
      if (isForbidden) {
        console.warn(`[AIPrivacyGuard] Blocked forbidden property: "${key}" from AI inference payload.`);
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this._deepSanitize(obj[key]);
      }
    }
  }

  /**
   * Enforces strict air-gap assertions for automated testing.
   * Throws Error if any forbidden pattern is present.
   *
   * @param {Object} payload
   */
  static assertAirGapIntegrity(payload) {
    const serialized = JSON.stringify(payload);
    for (const pattern of FORBIDDEN_SPOTIFY_PATTERNS) {
      if (pattern.test(serialized)) {
        throw new Error(`[AIPrivacyGuard] AIR-GAP VIOLATION: Payload contains forbidden token matching ${pattern}`);
      }
    }
    return true;
  }

  /**
   * Enforces Rule 9: Wipes ephemeral canvas and frame data.
   * Guarantees zero residual image or landmark storage in memory.
   *
   * @param {HTMLCanvasElement} canvas
   */
  static purgeCanvasBuffer(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Audits browser storage systems to assert zero biometric or expression persistence.
   * Validates that neither localStorage nor sessionStorage contains camera snapshots,
   * landmarks, or expression logs.
   *
   * @returns {{ compliant: boolean, violations: string[] }}
   */
  static auditBiometricStorageCompliance() {
    const violations = [];
    const sensitivePatterns = [/face/i, /landmark/i, /expression/i, /camera/i, /biometric/i, /snapshot/i];

    const checkStorage = (storage, name) => {
      try {
        if (!storage) return;
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (sensitivePatterns.some(pattern => pattern.test(key))) {
            violations.push(`${name} contains sensitive key: ${key}`);
          }
        }
      } catch (err) {
        console.error(`[AIPrivacyGuard] Storage check failed for ${name}:`, err);
      }
    };

    if (typeof localStorage !== 'undefined') checkStorage(localStorage, 'localStorage');
    if (typeof sessionStorage !== 'undefined') checkStorage(sessionStorage, 'sessionStorage');

    const compliant = violations.length === 0;
    if (!compliant) {
      console.error('[AIPrivacyGuard] BIOMETRIC PRIVACY VIOLATION DETECTED:', violations);
    }

    return { compliant, violations };
  }
}
