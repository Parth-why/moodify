/**
 * @file moods.test.js
 * Unit Test Suite for MOODIFY V1.5 Persistent Mood System & Multi-Mood Tagging.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MoodService, DEFAULT_MOODS } from '../src/services/moods/moodService.js';

describe('MOODIFY V1.5 Mood Management & Multi-Tagging Engine', () => {
  test('Contains all 12 core default system moods', async () => {
    const service = new MoodService();
    const all = await service.getAllMoods();

    const expectedDefaultNames = [
      'Party', 'Happy', 'Cheerful', 'Lonely', 'Romantic', 'Chill',
      'Energetic', 'Nostalgic', 'Melancholic', 'Surprised', 'Dreamy', 'Confident'
    ];

    for (const name of expectedDefaultNames) {
      const found = all.find(m => m.name.toLowerCase() === name.toLowerCase());
      assert.ok(found, `Expected default mood "${name}" to be present.`);
      assert.strictEqual(found.isDefault, true);
    }
    assert.strictEqual(all.filter(m => m.isDefault).length, 12);
  });

  test('Creates custom mood and prevents duplicate naming', async () => {
    const service = new MoodService();
    const custom = await service.createCustomMood({
      name: 'Cyber Twilight',
      color: '#EC4899',
      category: 'cyberpunk'
    });

    assert.ok(custom.id);
    assert.strictEqual(custom.name, 'Cyber Twilight');
    assert.strictEqual(custom.isDefault, false);

    // Duplicate check
    await assert.rejects(
      async () => service.createCustomMood({ name: 'Cyber Twilight' }),
      /already exists/
    );
  });

  test('Modifies custom mood color and name', async () => {
    const service = new MoodService();
    const created = await service.createCustomMood({
      name: 'Solar Flow',
      color: '#FBBF24'
    });

    const updated = await service.updateCustomMood(created.id, {
      name: 'Solar Flare',
      color: '#EF4444'
    });

    assert.strictEqual(updated.name, 'Solar Flare');
    assert.strictEqual(updated.color, '#EF4444');
  });

  test('Protects default moods from deletion but allows deleting custom moods', async () => {
    const service = new MoodService();

    // Default mood deletion must throw
    await assert.rejects(
      async () => service.deleteCustomMood('def-party'),
      /Default system moods cannot be deleted/
    );

    const temp = await service.createCustomMood({ name: 'Temporary Mood' });
    await service.deleteCustomMood(temp.id);

    const remaining = await service.getAllMoods();
    assert.strictEqual(remaining.some(m => m.id === temp.id), false);
  });

  test('Assigns multiple moods to a single track and preserves them', async () => {
    const service = new MoodService();
    const trackId = 'test-track-multi-1';

    await service.assignMoodsToTrack(trackId, ['nostalgic', 'dreamy', 'melancholic']);

    const assigned = service.getTrackMoods({ id: trackId });
    assert.ok(assigned.includes('nostalgic'));
    assert.ok(assigned.includes('dreamy'));
    assert.ok(assigned.includes('melancholic'));
    assert.strictEqual(assigned.length, 3);
  });

  test('Filters tracks by single and multiple combined moods', async () => {
    const service = new MoodService();

    const mockTracks = [
      { id: 't1', title: 'Track 1', mood: 'chill', userMoodTags: ['chill', 'nostalgic'] },
      { id: 't2', title: 'Track 2', mood: 'party', userMoodTags: ['party', 'energetic'] },
      { id: 't3', title: 'Track 3', mood: 'dreamy', userMoodTags: ['dreamy', 'melancholic'] }
    ];

    // Filter by single mood
    const chillResults = service.filterTracksByMoods(mockTracks, ['chill']);
    assert.strictEqual(chillResults.length, 1);
    assert.strictEqual(chillResults[0].id, 't1');

    // Filter by multi-mood combination (OR match)
    const combined = service.filterTracksByMoods(mockTracks, ['party', 'dreamy']);
    assert.strictEqual(combined.length, 2);
  });

  test('Bulk assigns mood to multiple tracks', async () => {
    const service = new MoodService();
    const trackIds = ['bulk-1', 'bulk-2', 'bulk-3'];

    await service.bulkAssignMood(trackIds, 'confident');

    for (const id of trackIds) {
      const moods = service.getTrackMoods({ id });
      assert.ok(moods.includes('confident'));
    }
  });
});
