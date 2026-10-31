import test from 'node:test';
import assert from 'node:assert/strict';
import { audioPlayer } from '../src/services/audio/audioPlayer.js';

test('Audio Isolation: Spotify tracks never route to Web Audio AnalyserNode', async () => {
  const spotifyTrack = {
    id: 'spotify-test-1',
    title: 'Test Spotify Song',
    artist: 'Test Artist',
    source: 'spotify_api',
    previewUrl: 'https://p.scdn.co/mp3-preview/test'
  };

  await audioPlayer.playTrack(spotifyTrack);
  assert.equal(audioPlayer.isSpotifyPlayback, true);

  // Must strictly return null to prevent Spotify audio frequency analysis
  const analyser = audioPlayer.getAnalyser();
  assert.equal(analyser, null, 'AnalyserNode must be null during Spotify playback to prevent audio extraction');

  audioPlayer.pause();
});

test('Audio Isolation: MOODIFY-native tracks correctly use native Web Audio AnalyserNode', async () => {
  const nativeTrack = {
    id: 'moodify-test-1',
    title: 'Neon Skyline Run',
    artist: 'Vector Shift',
    mood: 'cyberpunk',
    source: 'moodify_native'
  };

  await audioPlayer.playTrack(nativeTrack);
  assert.equal(audioPlayer.isSpotifyPlayback, false);

  audioPlayer.pause();
});
