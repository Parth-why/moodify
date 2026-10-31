/**
 * @file registry.js
 * Central AI Service Registry & Dependency Injection Hub.
 *
 * Enforces Requirement 6:
 * "Make it possible to replace mock services with real models without
 * rewriting the frontend or core backend."
 *
 * The frontend UI components and core app orchestrator interact ONLY with
 * this registry. When migrating to real models in V2, simply register the
 * new concrete adapter classes here.
 */

import { IMoodSuggestionService } from './interfaces/IMoodSuggestionService.js';
import { IMoodSenseService } from './interfaces/IMoodSenseService.js';
import { MockMoodSuggestionService } from './mock/MockMoodSuggestionService.js';
import { MockMoodSenseService } from './mock/MockMoodSenseService.js';

class AIServiceRegistry {
  constructor() {
    // Default to V1 Mock implementations
    this._suggestionService = new MockMoodSuggestionService();
    this._senseService = new MockMoodSenseService();
    this._listeners = new Set();
  }

  /**
   * Retrieves the currently active MoodSuggestionService instance.
   * @returns {IMoodSuggestionService}
   */
  getSuggestionService() {
    return this._suggestionService;
  }

  /**
   * Retrieves the currently active MoodSenseService instance.
   * @returns {IMoodSenseService}
   */
  getSenseService() {
    return this._senseService;
  }

  /**
   * Replaces the active MoodSuggestionService with a new implementation
   * (e.g. OpenAI, Claude, HuggingFace, or custom ONNX model).
   *
   * @param {IMoodSuggestionService} service - Instance implementing IMoodSuggestionService
   * @throws {TypeError} If service does not implement required interface methods
   */
  registerSuggestionService(service) {
    if (!service || typeof service.suggestMood !== 'function') {
      throw new TypeError(
        'Invalid service: Must implement IMoodSuggestionService with a suggestMood(request) method.'
      );
    }
    const prev = this._suggestionService;
    this._suggestionService = service;
    console.info(`[AIServiceRegistry] Replaced SuggestionService:`, {
      from: prev.getModelInfo?.() || prev.constructor.name,
      to: service.getModelInfo?.() || service.constructor.name
    });
    this._notifyChange('suggestion', service);
  }

  /**
   * Replaces the active MoodSenseService with a new vision model
   * (e.g. MediaPipe FaceMesh, TensorFlow.js, or local WASM runner).
   *
   * @param {IMoodSenseService} service - Instance implementing IMoodSenseService
   * @throws {TypeError} If service does not implement required interface methods
   */
  registerSenseService(service) {
    if (!service || typeof service.startAnalysis !== 'function' || typeof service.stopAnalysis !== 'function') {
      throw new TypeError(
        'Invalid service: Must implement IMoodSenseService with startAnalysis and stopAnalysis methods.'
      );
    }
    const prev = this._senseService;
    if (prev && typeof prev.stopAnalysis === 'function') {
      prev.stopAnalysis();
    }
    this._senseService = service;
    console.info(`[AIServiceRegistry] Replaced SenseService:`, {
      from: prev.getModelInfo?.() || prev.constructor.name,
      to: service.getModelInfo?.() || service.constructor.name
    });
    this._notifyChange('sense', service);
  }

  /**
   * Returns active model telemetry and simulation statuses.
   *
   * @returns {{
   *   suggestion: { provider: string, modelName: string, isSimulated: boolean, version: string },
   *   sense: { provider: string, modelName: string, isSimulated: boolean, version: string }
   * }}
   */
  getActiveModelInfo() {
    return {
      suggestion: this._suggestionService.getModelInfo(),
      sense: this._senseService.getModelInfo()
    };
  }

  /**
   * Subscribes to service provider swaps.
   *
   * @param {(type: 'suggestion'|'sense', service: any) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notifyChange(type, service) {
    for (const listener of this._listeners) {
      try {
        listener(type, service);
      } catch (err) {
        console.error('[AIServiceRegistry] Listener error:', err);
      }
    }
  }
}

// Global Singleton Instance
export const aiRegistry = new AIServiceRegistry();
