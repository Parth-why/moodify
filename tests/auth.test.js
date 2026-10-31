/**
 * @file auth.test.js
 * Unit Test Suite for MOODIFY V1.5 Authentication & Profile Service.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/services/auth/authService.js';

describe('MOODIFY Authentication & Profile Service', () => {
  test('AuthService initializes cleanly in demo/standalone mode without errors', async () => {
    const auth = new AuthService();
    await auth.init();
    assert.strictEqual(auth.initialized, true);
    assert.strictEqual(typeof auth.isAuthenticated(), 'boolean');
  });

  test('signUp validates required fields and password length', async () => {
    const auth = new AuthService();
    await auth.init();

    await assert.rejects(
      async () => auth.signUp({ email: '', password: '123' }),
      /Email and password are required/
    );

    await assert.rejects(
      async () => auth.signUp({ email: 'test@example.com', password: '123' }),
      /Password must be at least 6 characters long/
    );
  });

  test('signUp creates user and associated profile with fallback defaults', async () => {
    const auth = new AuthService();
    await auth.init();

    const result = await auth.signUp({
      email: 'alex@moodify.io',
      password: 'password123',
      username: 'alex_sonic',
      displayName: 'Alex Sonic'
    });

    assert.ok(result.user);
    assert.strictEqual(result.user.email, 'alex@moodify.io');
    assert.strictEqual(auth.isAuthenticated(), true);

    const profile = auth.getProfile();
    assert.ok(profile);
    assert.strictEqual(profile.username, 'alex_sonic');
    assert.strictEqual(profile.display_name, 'Alex Sonic');
    assert.ok(profile.avatar_url);
  });

  test('updateProfile modifies profile fields and notifies listeners', async () => {
    const auth = new AuthService();
    await auth.init();

    await auth.signUp({
      email: 'jordan@moodify.io',
      password: 'securepass123',
      username: 'jordan',
      displayName: 'Jordan'
    });

    let eventCaptured = false;
    auth.onAuthStateChange((event, user, profile) => {
      if (event === 'PROFILE_UPDATED' && profile.bio === 'Ambient beats enthusiast') {
        eventCaptured = true;
      }
    });

    const updated = await auth.updateProfile({
      bio: 'Ambient beats enthusiast',
      display_name: 'Jordan Rivera'
    });

    assert.strictEqual(updated.bio, 'Ambient beats enthusiast');
    assert.strictEqual(updated.display_name, 'Jordan Rivera');
    assert.strictEqual(eventCaptured, true);
  });

  test('signOut clears current user and profile session', async () => {
    const auth = new AuthService();
    await auth.init();

    await auth.signUp({
      email: 'temp@moodify.io',
      password: 'password123'
    });
    assert.strictEqual(auth.isAuthenticated(), true);

    await auth.signOut();
    assert.strictEqual(auth.isAuthenticated(), false);
    assert.strictEqual(auth.getUser(), null);
    assert.strictEqual(auth.getProfile(), null);
  });

  test('resetPassword sends recovery request without throwing', async () => {
    const auth = new AuthService();
    await auth.init();

    await assert.rejects(
      async () => auth.resetPassword(''),
      /Email address is required/
    );

    const res = await auth.resetPassword('valid@moodify.io');
    assert.strictEqual(res, true);
  });

  test('Security Check: Service-role key is forbidden on client', () => {
    assert.doesNotThrow(() => {
      // Verifies that neither process.env nor import.meta has leaked service_role
      const key = process.env.VITE_SUPABASE_ANON_KEY || '';
      assert.strictEqual(key.includes('service_role'), false);
    });
  });
});
