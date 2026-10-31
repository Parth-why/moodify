/**
 * @file spotify-oauth.test.js
 * Unit Test Suite for Spotify PKCE Authorization Flow & Verification.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SpotifyAuth, SPOTIFY_SCOPES } from '../src/services/spotify/spotifyAuth.js';

describe('MOODIFY Spotify PKCE Authorization Engine', () => {
  test('Generates high-entropy random strings of specified length', () => {
    const auth = new SpotifyAuth();
    const str1 = auth.generateRandomString(64);
    const str2 = auth.generateRandomString(64);

    assert.strictEqual(str1.length, 64);
    assert.strictEqual(str2.length, 64);
    assert.notStrictEqual(str1, str2);
  });

  test('Generates valid base64url code challenge from verifier', async () => {
    const auth = new SpotifyAuth();
    const verifier = 'test-verifier-string-1234567890-abcdefghijklmnopqrstuvwxyz';
    const challenge = await auth.generateCodeChallenge(verifier);

    assert.ok(challenge);
    assert.strictEqual(typeof challenge, 'string');
    // Base64url should not contain '+', '/', or '='
    assert.strictEqual(challenge.includes('+'), false);
    assert.strictEqual(challenge.includes('/'), false);
    assert.strictEqual(challenge.includes('='), false);
  });

  test('Enforces presence of Client ID before initiating authorization', async () => {
    const auth = new SpotifyAuth();
    auth.clientId = '';

    await assert.rejects(
      async () => auth.initiateLogin(''),
      /Spotify Client ID is required/
    );
  });

  test('Calculates and returns clean redirect URI', () => {
    const auth = new SpotifyAuth();
    const uri = auth.getRedirectUri();
    assert.ok(uri.startsWith('http'));
  });

  test('Includes required read-only user and playlist scopes', () => {
    assert.ok(SPOTIFY_SCOPES.includes('playlist-read-private'));
    assert.ok(SPOTIFY_SCOPES.includes('playlist-read-collaborative'));
    assert.ok(SPOTIFY_SCOPES.includes('user-library-read'));
    assert.ok(SPOTIFY_SCOPES.includes('user-read-private'));
    assert.ok(SPOTIFY_SCOPES.includes('user-read-email'));
  });
});
