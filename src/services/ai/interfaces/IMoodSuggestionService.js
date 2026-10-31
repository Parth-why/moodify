/**
 * @file IMoodSuggestionService.js
 * Interface contract for Mood Suggestion AI Services.
 *
 * Any future text/prompt/context-based AI model (e.g. OpenAI, Claude, HuggingFace, Mistral,
 * or local ONNX/LLM) MUST implement this interface.
 *
 * Adhering to this contract ensures that switching models requires ZERO changes to the
 * frontend UI, core player, or Spotify integration layer.
 */

/* eslint-disable no-unused-vars */

export class IMoodSuggestionService {
  /**
   * Generates mood suggestions and target audio features based on user prompt and contextual inputs.
   *
   * @param {import('../types.js').MoodSuggestionRequest} request - Sanitized user prompt & context
   * @returns {Promise<import('../types.js').MoodSuggestionResult>} Standardized mood result
   * @throws {Error} If method is not implemented by subclass or network/inference fails
   */
  async suggestMood(request) {
    throw new Error('IMoodSuggestionService.suggestMood() must be implemented by subclass.');
  }

  /**
   * Checks whether the underlying model provider or service is reachable and ready.
   *
   * @returns {Promise<boolean>} True if ready for inference
   */
  async isAvailable() {
    throw new Error('IMoodSuggestionService.isAvailable() must be implemented by subclass.');
  }

  /**
   * Returns human-readable metadata about the active model (provider, model ID, latency, version).
   *
   * @returns {{ provider: string, modelName: string, isSimulated: boolean, version: string }}
   */
  getModelInfo() {
    throw new Error('IMoodSuggestionService.getModelInfo() must be implemented by subclass.');
  }
}
