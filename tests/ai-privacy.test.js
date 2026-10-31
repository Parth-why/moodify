import test from 'node:test';
import assert from 'node:assert/strict';
import { AIPrivacyGuard } from '../src/services/ai/privacyGuard.js';

test('AI Privacy Guard: Strips forbidden Spotify metadata from suggestion payloads', () => {
  const contaminatedPayload = {
    prompt: 'Coding late at night in Tokyo',
    spotifyId: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
    trackName: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273',
    lyrics: 'Never gonna give you up, never gonna let you down',
    spotifyToken: 'BQAbCdEf123456789',
    context: {
      timeOfDay: 'late_night',
      activity: 'coding'
    }
  };

  const sanitized = AIPrivacyGuard.sanitizeSuggestionRequest(contaminatedPayload);

  // Assert forbidden Spotify fields are stripped
  assert.equal(sanitized.spotifyId, undefined);
  assert.equal(sanitized.trackName, undefined);
  assert.equal(sanitized.artist, undefined);
  assert.equal(sanitized.albumArt, undefined);
  assert.equal(sanitized.lyrics, undefined);
  assert.equal(sanitized.spotifyToken, undefined);

  // Assert safe prompt and context remain
  assert.equal(sanitized.prompt, 'Coding late at night in Tokyo');
  assert.equal(sanitized.context.timeOfDay, 'late_night');
  assert.equal(sanitized.context.activity, 'coding');

  // Assert air-gap integrity pass
  assert.doesNotThrow(() => {
    AIPrivacyGuard.assertAirGapIntegrity(sanitized);
  });
});

test('AI Privacy Guard: Rejects nested Spotify data with air-gap exception', () => {
  const nestedContaminated = {
    prompt: 'Listening to music',
    nested: {
      spotify_id: '12345'
    }
  };

  assert.throws(() => {
    AIPrivacyGuard.assertAirGapIntegrity(nestedContaminated);
  }, /AIR-GAP VIOLATION/);
});

test('AI Privacy Guard: Canvas memory purging works correctly', () => {
  let cleared = false;
  const mockCanvas = {
    width: 640,
    height: 480,
    getContext: () => ({
      clearRect: (x, y, w, h) => {
        if (w === 640 && h === 480) cleared = true;
      }
    })
  };

  AIPrivacyGuard.purgeCanvasBuffer(mockCanvas);
  assert.equal(cleared, true);
});
