/**
 * @file MockMoodSenseService.js
 * Mock implementation of IMoodSenseService for Camera UI Workflow Testing.
 *
 * HONESTY & PRIVACY COMPLIANCE (Phase 2):
 * 1. Clearly distinguished: Labeled as [SIMULATED WORKFLOW BENCHMARK].
 * 2. No fabricated probabilities presented as real predictions.
 * 3. Camera frame processing is DISABLED in V1 until real models are loaded.
 * 4. Zero retention: No video, image, landmark, or expression data is stored.
 * 5. Important note: Facial expressions are context cues and do NOT represent
 *    a definitive emotional state.
 */

import { IMoodSenseService } from '../interfaces/IMoodSenseService.js';
import { AIPrivacyGuard } from '../privacyGuard.js';
import { MoodCategories, MOOD_AUDIO_PROFILES } from '../types.js';

export class MockMoodSenseService extends IMoodSenseService {
  constructor() {
    super();
    this.providerName = 'Moodify Workflow Simulator';
    this.modelName = 'Simulated-FaceSense-Mock-V1';
    this.version = '1.0.0-mock';
    this._intervalId = null;
    this._animationFrameId = null;
    this._isActive = false;
    this._canvas = null;
    this._phase = 0;
    this._selectedPresetMood = MoodCategories.JOYFUL;
  }

  /**
   * Sets manual target emotion for test scenarios (UI preset benchmarking).
   *
   * @param {string} moodKey
   */
  setSimulatedMoodTarget(moodKey) {
    if (Object.values(MoodCategories).includes(moodKey)) {
      this._selectedPresetMood = moodKey;
    }
  }

  /**
   * Starts simulated UI preview.
   * NOTE: Does NOT process or analyze live camera frames. Camera processing
   * is kept disabled in V1 until a real model is integrated.
   *
   * @param {HTMLVideoElement} videoElement
   * @param {HTMLCanvasElement} [overlayCanvas]
   * @param {(result: import('../types.js').MoodSenseResult) => void} onUpdate
   * @param {Object} [options]
   */
  startAnalysis(videoElement, overlayCanvas, onUpdate, options = {}) {
    this.stopAnalysis();

    this._isActive = true;
    this._canvas = overlayCanvas;
    const sampleRateMs = options.sampleRateMs || 300;

    // Simulation animation loop for rendering facial reticle HUD guide
    const renderHUD = () => {
      if (!this._isActive) return;
      this._phase += 0.05;

      if (this._canvas) {
        this._drawSimulatedFaceMesh(this._canvas, this._phase);
      }

      this._animationFrameId = requestAnimationFrame(renderHUD);
    };

    renderHUD();

    // Periodic benchmark update (honest UI simulation, not real predictions)
    this._intervalId = setInterval(() => {
      if (!this._isActive) return;

      const profile = MOOD_AUDIO_PROFILES[this._selectedPresetMood] || MOOD_AUDIO_PROFILES[MoodCategories.JOYFUL];

      /** @type {import('../types.js').MoodSenseResult} */
      const result = {
        detectedMood: this._selectedPresetMood,
        confidence: 0.0, // Honest: 0.0 indicates simulated benchmark, not real inference confidence
        expressions: {
          happy: this._selectedPresetMood === MoodCategories.JOYFUL ? 1.0 : 0.0,
          focused: this._selectedPresetMood === MoodCategories.FOCUSED ? 1.0 : 0.0,
          chill: this._selectedPresetMood === MoodCategories.CHILL ? 1.0 : 0.0,
          sad: this._selectedPresetMood === MoodCategories.MELANCHOLY ? 1.0 : 0.0,
          neutral: 0.0,
          surprised: 0.0
        },
        faceDetected: true,
        targetAudioFeatures: {
          valence: profile.valence,
          energy: profile.energy,
          danceability: profile.danceability,
          acousticness: profile.acousticness,
          tempo: profile.tempo
        },
        isSimulated: true,
        simulatedModelTag: '[SIMULATED UI PRESET — REAL CAMERA AI DISABLED IN V1]',
        privacyNotice: 'Zero Biometric Retention: Camera processing is disabled in V1. No images, video, landmarks, or predictions are stored.',
        emotionDisclaimer: 'Notice: Facial expressions are subtle contextual cues and do not reflect a definitive emotional state.',
        timestamp: Date.now()
      };

      if (typeof onUpdate === 'function') {
        onUpdate(result);
      }
    }, sampleRateMs);
  }

  stopAnalysis() {
    this._isActive = false;

    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    if (this._canvas) {
      AIPrivacyGuard.purgeCanvasBuffer(this._canvas);
      this._canvas = null;
    }
  }

  async estimateMood(frameSource) {
    const profile = MOOD_AUDIO_PROFILES[this._selectedPresetMood];
    return {
      detectedMood: this._selectedPresetMood,
      confidence: 0.0,
      expressions: { happy: 0.0, neutral: 0.0, surprised: 0.0, sad: 0.0, focused: 0.0 },
      faceDetected: true,
      targetAudioFeatures: { ...profile },
      isSimulated: true,
      simulatedModelTag: '[SIMULATED UI PRESET — REAL CAMERA AI DISABLED IN V1]',
      privacyNotice: 'Zero biometric data stored.',
      emotionDisclaimer: 'Facial expressions do not reflect a definitive emotional state.',
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

  _drawSimulatedFaceMesh(canvas, phase) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 - 10;
    const rx = w * 0.25 + Math.sin(phase * 1.5) * 2;
    const ry = h * 0.32 + Math.cos(phase * 1.5) * 2;

    ctx.save();

    // 1. Guide Reticle
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Corner Bracket Guides
    const bw = rx * 1.35;
    const bh = ry * 1.25;
    const bx = cx - bw / 2;
    const by = cy - bh / 2;
    const bracketLen = 20;

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;

    // Corners
    ctx.beginPath();
    ctx.moveTo(bx, by + bracketLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + bracketLen, by);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bracketLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx, by + bh - bracketLen);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bracketLen, by + bh);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - bracketLen);
    ctx.stroke();

    // 3. Status Tag
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(bx, by - 26, bw, 22);
    ctx.fillStyle = '#FBBF24';
    ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UI SIMULATION GUIDE — CAMERA INFERENCE DISABLED IN V1', cx, by - 11);

    ctx.restore();
  }
}
