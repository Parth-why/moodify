/**
 * @file migration.test.js
 * Unit Test Suite for MOODIFY V1.0 to V1.5 Local Data Migration Engine.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { LocalDataMigrator } from '../src/services/userdata/localDataMigrator.js';
import { moodService } from '../src/services/moods/moodService.js';

// Polyfill minimal localStorage if running in headless node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

describe('MOODIFY V1.0 to V1.5 Data Migration Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('Detects pending migration when V1 data exists and migration flag is unset', () => {
    const migrator = new LocalDataMigrator();

    assert.strictEqual(migrator.hasPendingMigration(), false);

    localStorage.setItem('moodify_user_mood_overrides', JSON.stringify({
      'track-1': { userMood: 'cyberpunk' }
    }));

    assert.strictEqual(migrator.hasPendingMigration(), true);
  });

  test('Safely migrates mood overrides into moodService and sets completion flag', async () => {
    const migrator = new LocalDataMigrator();

    const legacyOverrides = {
      'track-legacy-1': { userMood: 'nostalgic', updatedAt: 123456 },
      'track-legacy-2': { userMood: 'dreamy', updatedAt: 123457 }
    };
    localStorage.setItem('moodify_user_mood_overrides', JSON.stringify(legacyOverrides));
    localStorage.setItem('moodify_user_preferences', JSON.stringify({ preferredMoods: ['chill', 'dreamy'] }));

    const res = await migrator.runMigration();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.stats.tracks, 2);
    assert.strictEqual(res.stats.preferences, 1);

    // Verify track moods are now accessible in moodService
    const moods1 = moodService.getTrackMoods({ id: 'track-legacy-1' });
    assert.ok(moods1.includes('nostalgic'));

    const moods2 = moodService.getTrackMoods({ id: 'track-legacy-2' });
    assert.ok(moods2.includes('dreamy'));

    // Verify migration flag is set so subsequent runs don't re-execute
    assert.strictEqual(localStorage.getItem('moodify_v1_migration_completed'), 'true');
    assert.strictEqual(migrator.hasPendingMigration(), false);

    // Verify original data was preserved as safety backup (never silently destroyed)
    assert.ok(localStorage.getItem('moodify_user_mood_overrides'));
  });

  test('Security Check: Migration never copies or touches Spotify tokens', async () => {
    const migrator = new LocalDataMigrator();

    localStorage.setItem('moodify_spotify_token', 'sensitive-secret-token');
    await migrator.runMigration();

    // The sensitive key remains strictly untouched by migration logic
    assert.strictEqual(localStorage.getItem('moodify_spotify_token'), 'sensitive-secret-token');
  });
});
