import test from 'node:test';
import assert from 'node:assert/strict';
import { aiRegistry } from '../src/services/ai/registry.js';
import { IMoodSuggestionService } from '../src/services/ai/interfaces/IMoodSuggestionService.js';
import { IMoodSenseService } from '../src/services/ai/interfaces/IMoodSenseService.js';

test('AI Registry: Defaults to simulated mock implementations with explicit markers', () => {
  const info = aiRegistry.getActiveModelInfo();
  assert.equal(info.suggestion.isSimulated, true);
  assert.equal(info.sense.isSimulated, true);
});

test('AI Registry: Enforces interface contracts when swapping suggestion service', () => {
  // Reject non-conforming object
  assert.throws(() => {
    aiRegistry.registerSuggestionService({});
  }, /Must implement IMoodSuggestionService/);

  // Accept valid service implementation
  class CustomMockService extends IMoodSuggestionService {
    async suggestMood() {
      return {
        mood: 'chill',
        displayTitle: 'Custom Test Mood',
        confidence: 0.99,
        rationale: 'Test',
        targetAudioFeatures: { valence: 0.5, energy: 0.5, danceability: 0.5 },
        recommendedGenres: ['ambient'],
        isSimulated: true,
        simulatedModelTag: '[TEST SERVICE]',
        timestamp: Date.now()
      };
    }
    async isAvailable() { return true; }
    getModelInfo() {
      return { provider: 'Custom Test', modelName: 'TestModel', isSimulated: true, version: '1.0' };
    }
  }

  const custom = new CustomMockService();
  aiRegistry.registerSuggestionService(custom);
  assert.equal(aiRegistry.getSuggestionService(), custom);
});

test('AI Registry: Enforces interface contracts when swapping vision sense service', () => {
  assert.throws(() => {
    aiRegistry.registerSenseService({ invalid: true });
  }, /Must implement IMoodSenseService/);

  class CustomSenseService extends IMoodSenseService {
    startAnalysis() {}
    stopAnalysis() {}
    async estimateMood() { return {}; }
    async isAvailable() { return true; }
    getModelInfo() {
      return { provider: 'Custom Vision', modelName: 'VisionTest', isSimulated: true, version: '1.0' };
    }
  }

  const vision = new CustomSenseService();
  aiRegistry.registerSenseService(vision);
  assert.equal(aiRegistry.getSenseService(), vision);
});
