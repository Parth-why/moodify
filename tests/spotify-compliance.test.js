import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SpotifyClient } from '../src/services/spotify/spotifyClient.js';
import { MOODIFY_CATALOG } from '../src/services/catalog/moodifyCatalog.js';

test('Spotify Compliance: Verifies absence of Euclidean distance matching', () => {
  const filePath = path.resolve('src/services/spotify/spotifyClient.js');
  const code = fs.readFileSync(filePath, 'utf-8');

  // Must NOT contain Euclidean distance or _calculateAudioDistance
  assert.equal(code.includes('_calculateAudioDistance'), false, 'Code must not contain _calculateAudioDistance');
  assert.equal(code.includes('Math.sqrt(dValence'), false, 'Code must not contain Euclidean distance calculations on audio features');
  assert.equal(/fetch\([^)]*\/v1\/recommendations/i.test(code), false, 'Code must not call deprecated /v1/recommendations endpoint');
  assert.equal(/fetch\([^)]*\/v1\/audio-features/i.test(code), false, 'Code must not call deprecated /v1/audio-features endpoint');
});

test('Spotify Compliance: Track deduplication functions reliably', () => {
  const client = new SpotifyClient();
  const rawList = [
    { id: '1', title: 'Neon Skyline', artist: 'Vector Shift' },
    { id: '1', title: 'Neon Skyline', artist: 'Vector Shift' }, // duplicate ID
    { id: '2', title: 'neon skyline', artist: 'vector shift ' }, // duplicate title+artist (case-insensitive)
    { id: '3', title: 'Different Track', artist: 'Vector Shift' }
  ];

  const deduplicated = client._deduplicateTracks(rawList);
  assert.equal(deduplicated.length, 2);
  assert.equal(deduplicated[0].id, '1');
  assert.equal(deduplicated[1].id, '3');
});

test('Spotify Compliance: MOODIFY native catalog is independent and categorized', () => {
  assert.ok(MOODIFY_CATALOG.length >= 10);
  for (const track of MOODIFY_CATALOG) {
    assert.equal(track.source, 'moodify_native');
    assert.ok(track.mood, `Track ${track.id} must have a mood assigned`);
    assert.ok(Array.isArray(track.userMoodTags), `Track ${track.id} must have userMoodTags`);
  }
});
