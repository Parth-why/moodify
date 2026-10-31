/**
 * scripts/test_live_supabase.mjs
 * Live Supabase Database & Multi-Tenant RLS Verification Suite for MOODIFY V1.5.
 *
 * Runs non-destructive tests against the live Supabase project configured in .env.
 * Never exposes credentials or touches existing user data.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read .env safely without leaking values
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file does not exist at project root');
  }

  const content = fs.readFileSync(envPath, 'utf8');
  let url = process.env.VITE_SUPABASE_URL;
  let anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      url = trimmed.slice('VITE_SUPABASE_URL='.length).trim();
    } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      anonKey = trimmed.slice('VITE_SUPABASE_ANON_KEY='.length).trim();
    }
  }

  // Remove surrounding quotes if present
  if (url && (url.startsWith('"') || url.startsWith("'"))) url = url.slice(1, -1);
  if (anonKey && (anonKey.startsWith('"') || anonKey.startsWith("'"))) anonKey = anonKey.slice(1, -1);

  return { url, anonKey };
}

const { url, anonKey } = loadEnv();

if (!url || !anonKey) {
  console.error('FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

if (anonKey.includes('service_role')) {
  console.error('FATAL: service_role key detected. Must use anon public key only!');
  process.exit(1);
}

const maskedUrl = url.replace(/https:\/\/(.*?)\.supabase\.co.*/, 'https://$1.supabase.co');
console.log(`[INIT] Loaded configuration for target: ${maskedUrl}`);
console.log(`[INIT] Public Anon Key verified (length: ${anonKey.length}, starts with: ${anonKey.substring(0, 10)}...)`);

// Create anonymous Supabase client
const anonClient = createClient(url, anonKey, {
  auth: { persistSession: false }
});

const results = {
  envConfigured: true,
  clientInitialized: true,
  tableChecks: {},
  defaultMoodsCheck: false,
  connectivity: false,
  authAccountA: false,
  profileAccountA: false,
  customMoodAccountA: false,
  trackMoodAccountA: false,
  persistenceAfterRefresh: false,
  authAccountB: false,
  rlsMoodIsolation: false,
  rlsTrackIsolation: false,
  rlsProfileIsolation: false,
  errors: []
};

async function run() {
  console.log('\n--- 1. Testing Connectivity & Table Existence ---');
  const requiredTables = [
    'profiles',
    'spotify_connections',
    'tracks',
    'imported_playlists',
    'playlist_track_sources',
    'moods',
    'track_moods',
    'user_settings',
    'import_jobs'
  ];

  for (const table of requiredTables) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      if (error && (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('Could not find'))) {
        // Table does not exist
        results.tableChecks[table] = { exists: false, error: error.message };
        console.error(`  ✖ Table 'public.${table}': DOES NOT EXIST (${error.message})`);
      } else if (error) {
        // Table exists, query had RLS policy or other code
        results.tableChecks[table] = { exists: true, note: error.message };
        console.log(`  ✔ Table 'public.${table}': Exists (RLS active, note: ${error.code || error.message})`);
      } else {
        results.tableChecks[table] = { exists: true };
        console.log(`  ✔ Table 'public.${table}': Exists and queryable`);
      }
    } catch (err) {
      results.tableChecks[table] = { exists: false, error: err.message };
      console.error(`  ✖ Table 'public.${table}': Exception ${err.message}`);
    }
  }

  const allTablesExist = Object.values(results.tableChecks).every(t => t.exists);
  if (!allTablesExist) {
    console.error('\n✖ One or more tables are missing! Please verify that the migration SQL was applied.');
    results.errors.push('Missing database tables. Migration may not have completed.');
  } else {
    results.connectivity = true;
    console.log('\n✔ All 9 required tables exist in public schema.');
  }

  console.log('\n--- 2. Testing 12 Default System Moods ---');
  try {
    const { data: moods, error: moodsErr } = await anonClient
      .from('moods')
      .select('name, category, color, is_default')
      .eq('is_default', true)
      .order('name', { ascending: true });

    if (moodsErr) {
      console.error(`  ✖ Failed to query moods: ${moodsErr.message}`);
      results.errors.push(`Moods query error: ${moodsErr.message}`);
    } else {
      console.log(`  Found ${moods.length} default moods:`, moods.map(m => m.name).join(', '));
      const expectedMoods = [
        'Chill', 'Confident', 'Cheerful', 'Dreamy', 'Energetic',
        'Happy', 'Lonely', 'Melancholic', 'Nostalgic', 'Party',
        'Romantic', 'Surprised'
      ].sort();

      const foundMoodNames = moods.map(m => m.name).sort();
      const match = expectedMoods.every(em => foundMoodNames.includes(em));

      if (match && moods.length === 12) {
        results.defaultMoodsCheck = true;
        console.log('  ✔ All 12 default moods are correctly seeded.');
      } else {
        console.warn(`  ⚠ Found ${moods.length} default moods instead of 12. Expected: ${expectedMoods.join(', ')}`);
        results.defaultMoodsCheck = match;
      }
    }
  } catch (err) {
    console.error('  ✖ Exception querying moods:', err.message);
    results.errors.push(err.message);
  }

  console.log('\n--- 3. Testing Test Account A Registration & Authentication ---');
  const timestamp = Date.now();
  const emailA = `moodify_test_a_${timestamp}@gmail.com`;
  const passwordA = `P@ssw0rd_${timestamp}!`;

  // Create isolated client for Account A
  const clientA = createClient(url, anonKey, { auth: { persistSession: false } });

  let sessionA = null;
  let userA = null;
  let customMoodA = null;
  let trackA = null;

  try {
    const { data: signUpData, error: signUpErr } = await clientA.auth.signUp({
      email: emailA,
      password: passwordA,
      options: {
        data: {
          username: `user_a_${timestamp}`,
          display_name: `Test User A ${timestamp}`
        }
      }
    });

    if (signUpErr) {
      console.error(`  ✖ Account A SignUp failed: ${signUpErr.message}`);
      results.errors.push(`Account A SignUp failed: ${signUpErr.message}`);
    } else {
      userA = signUpData.user;
      sessionA = signUpData.session;
      console.log(`  ✔ Account A created (ID: ${userA?.id})`);

      if (!sessionA) {
        console.warn('  ℹ Note: SignUp succeeded but no active session returned.');
        console.warn('  ℹ Supabase project may have "Confirm email" enabled.');
        console.warn('  Attempting explicit signInWithPassword for Account A...');
        const { data: signInData, error: signInErr } = await clientA.auth.signInWithPassword({
          email: emailA,
          password: passwordA
        });

        if (signInErr) {
          console.error(`  ✖ Account A SignIn failed: ${signInErr.message}`);
          results.errors.push(`Account A requires email confirmation: ${signInErr.message}`);
        } else {
          sessionA = signInData.session;
          userA = signInData.user;
          results.authAccountA = true;
          console.log('  ✔ Account A signed in successfully with session token.');
        }
      } else {
        results.authAccountA = true;
        console.log('  ✔ Account A authenticated immediately.');
      }
    }
  } catch (err) {
    console.error('  ✖ Exception during Account A auth:', err.message);
    results.errors.push(err.message);
  }

  if (userA && sessionA) {
    console.log('\n--- 4. Testing Profile Creation via Trigger ---');
    try {
      // Profile should have been auto-created by on_auth_user_created trigger
      const { data: profile, error: profErr } = await clientA
        .from('profiles')
        .select('*')
        .eq('id', userA.id)
        .single();

      if (profErr) {
        console.warn(`  ⚠ Profile not found via trigger (${profErr.message}). Testing manual insert under RLS...`);
        const { data: newProf, error: insErr } = await clientA
          .from('profiles')
          .insert({
            id: userA.id,
            username: `user_a_${timestamp}`,
            display_name: `Test User A`
          })
          .select()
          .single();

        if (insErr) {
          console.error(`  ✖ Failed to insert profile for Account A: ${insErr.message}`);
          results.errors.push(`Profile creation error: ${insErr.message}`);
        } else {
          results.profileAccountA = true;
          console.log(`  ✔ Profile created manually under RLS: ${newProf.username}`);
        }
      } else {
        results.profileAccountA = true;
        console.log(`  ✔ Profile auto-created by trigger:`, {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name
        });
      }
    } catch (err) {
      console.error('  ✖ Exception testing profile:', err.message);
      results.errors.push(err.message);
    }

    console.log('\n--- 5. Testing Custom Mood Creation for Account A ---');
    try {
      const moodNameA = `Starlight Drift ${timestamp}`;
      const { data: newMood, error: moodErr } = await clientA
        .from('moods')
        .insert({
          user_id: userA.id,
          name: moodNameA,
          category: 'chill',
          color: '#38BDF8',
          is_default: false
        })
        .select()
        .single();

      if (moodErr) {
        console.error(`  ✖ Failed to create custom mood for Account A: ${moodErr.message}`);
        results.errors.push(`Custom mood error: ${moodErr.message}`);
      } else {
        customMoodA = newMood;
        results.customMoodAccountA = true;
        console.log(`  ✔ Custom mood created for Account A:`, {
          id: newMood.id,
          name: newMood.name,
          user_id: newMood.user_id
        });
      }
    } catch (err) {
      console.error('  ✖ Exception creating custom mood:', err.message);
      results.errors.push(err.message);
    }

    console.log('\n--- 6. Testing Track Creation & Multi-Mood Assignment for Account A ---');
    try {
      const providerTrackId = `test_track_${timestamp}`;
      const { data: newTrack, error: trackErr } = await clientA
        .from('tracks')
        .insert({
          user_id: userA.id,
          provider: 'moodify_native',
          provider_track_id: providerTrackId,
          title: `Cosmic Waves ${timestamp}`,
          artist: 'Nebula Sounds',
          album: 'Deep Space',
          duration_s: 240
        })
        .select()
        .single();

      if (trackErr) {
        console.error(`  ✖ Failed to insert track for Account A: ${trackErr.message}`);
        results.errors.push(`Track insert error: ${trackErr.message}`);
      } else {
        trackA = newTrack;
        console.log(`  ✔ Track inserted for Account A (UUID: ${trackA.id})`);

        // Assign default mood 'Chill' and custom mood
        const { data: defaultMoodChill } = await clientA
          .from('moods')
          .select('id')
          .eq('name', 'Chill')
          .eq('is_default', true)
          .single();

        const moodIdsToAssign = [defaultMoodChill?.id, customMoodA?.id].filter(Boolean);
        const inserts = moodIdsToAssign.map(mId => ({
          user_id: userA.id,
          track_id: trackA.id,
          mood_id: mId,
          assignment_source: 'user_assigned'
        }));

        const { data: assigned, error: assignErr } = await clientA
          .from('track_moods')
          .insert(inserts)
          .select();

        if (assignErr) {
          console.error(`  ✖ Failed to assign moods to track: ${assignErr.message}`);
          results.errors.push(`Track moods assign error: ${assignErr.message}`);
        } else {
          results.trackMoodAccountA = true;
          console.log(`  ✔ Successfully assigned ${assigned.length} moods to track (track_id: ${trackA.id})`);
        }
      }
    } catch (err) {
      console.error('  ✖ Exception during track mood assignment:', err.message);
      results.errors.push(err.message);
    }

    console.log('\n--- 7. Testing Session & Data Persistence (Simulated Client Reload) ---');
    try {
      // Create fresh client with Account A's session token to simulate browser reload
      const reloadedClientA = createClient(url, anonKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${sessionA.access_token}` }
        }
      });

      // Verify custom mood persists
      const { data: reloadedMoods, error: rErr } = await reloadedClientA
        .from('moods')
        .select('*')
        .eq('user_id', userA.id);

      if (rErr || !reloadedMoods || reloadedMoods.length === 0) {
        console.error(`  ✖ Failed to reload moods across session: ${rErr?.message || 'none returned'}`);
        results.errors.push(`Session persistence error: ${rErr?.message}`);
      } else {
        // Verify track and track moods persist
        const { data: reloadedTrackMoods, error: rtmErr } = await reloadedClientA
          .from('track_moods')
          .select('id, track_id, mood_id')
          .eq('user_id', userA.id);

        if (rtmErr || !reloadedTrackMoods || reloadedTrackMoods.length === 0) {
          console.error(`  ✖ Failed to reload track_moods: ${rtmErr?.message || 'none returned'}`);
        } else {
          results.persistenceAfterRefresh = true;
          console.log(`  ✔ Verified persistence: Retrieved ${reloadedMoods.length} custom mood(s) and ${reloadedTrackMoods.length} track mood tag(s) across fresh client session.`);
        }
      }
    } catch (err) {
      console.error('  ✖ Exception during persistence verification:', err.message);
      results.errors.push(err.message);
    }
  }

  console.log('\n--- 8. Testing Account B Registration & RLS Multi-Tenant Isolation ---');
  const emailB = `moodify_test_b_${timestamp}@gmail.com`;
  const passwordB = `P@ssw0rd_${timestamp}!_B`;
  const clientB = createClient(url, anonKey, { auth: { persistSession: false } });

  let userB = null;
  let sessionB = null;

  try {
    const { data: signUpDataB, error: signUpErrB } = await clientB.auth.signUp({
      email: emailB,
      password: passwordB,
      options: {
        data: {
          username: `user_b_${timestamp}`,
          display_name: `Test User B ${timestamp}`
        }
      }
    });

    if (signUpErrB) {
      console.error(`  ✖ Account B SignUp failed: ${signUpErrB.message}`);
      results.errors.push(`Account B SignUp failed: ${signUpErrB.message}`);
    } else {
      userB = signUpDataB.user;
      sessionB = signUpDataB.session;

      if (!sessionB) {
        const { data: signInDataB, error: signInErrB } = await clientB.auth.signInWithPassword({
          email: emailB,
          password: passwordB
        });
        if (signInErrB) {
          console.error(`  ✖ Account B SignIn failed: ${signInErrB.message}`);
          results.errors.push(`Account B SignIn failed: ${signInErrB.message}`);
        } else {
          sessionB = signInDataB.session;
          userB = signInDataB.user;
          results.authAccountB = true;
          console.log(`  ✔ Account B authenticated (ID: ${userB?.id})`);
        }
      } else {
        results.authAccountB = true;
        console.log(`  ✔ Account B authenticated immediately (ID: ${userB?.id})`);
      }
    }
  } catch (err) {
    console.error('  ✖ Exception during Account B auth:', err.message);
    results.errors.push(err.message);
  }

  results.profileAccountB = false;
  results.authLoginLogout = false;
  results.rlsWriteProtection = false;

  if (userB && sessionB) {
    console.log('\n--- 8b. Testing Profile Auto-Creation for Account B ---');
    try {
      const { data: profileB, error: profErrB } = await clientB
        .from('profiles')
        .select('*')
        .eq('id', userB.id)
        .single();

      if (profileB) {
        results.profileAccountB = true;
        console.log(`  ✔ Profile auto-created for Account B via trigger:`, {
          id: profileB.id,
          username: profileB.username,
          display_name: profileB.display_name
        });
      } else {
        console.warn(`  ⚠ Profile B check note:`, profErrB?.message);
      }
    } catch (err) {
      console.error('  ✖ Exception checking Profile B:', err.message);
    }
  }

  if (userA && sessionA) {
    console.log('\n--- 8c. Testing Explicit Logout & Re-Login for Account A ---');
    try {
      const { error: outErr } = await clientA.auth.signOut();
      if (outErr) {
        console.error('  ✖ SignOut error:', outErr.message);
      } else {
        console.log('  ✔ Account A signed out successfully.');
      }

      const { data: reInData, error: inErr } = await clientA.auth.signInWithPassword({
        email: emailA,
        password: passwordA
      });

      if (inErr) {
        console.error('  ✖ Re-login error:', inErr.message);
      } else {
        results.authLoginLogout = true;
        sessionA = reInData.session;
        console.log('  ✔ Account A re-authenticated successfully with fresh session.');
      }
    } catch (err) {
      console.error('  ✖ Exception during login/logout test:', err.message);
    }
  }

  if (userB && sessionB && userA) {
    console.log('\n--- 9. Verifying Strict Row Level Security (RLS) Isolation ---');
    try {
      // 0. Account B attempts to maliciously delete Account A's custom mood
      if (customMoodA) {
        const { data: maliciousDelete, error: delErr } = await clientB
          .from('moods')
          .delete()
          .eq('id', customMoodA.id)
          .select();

        // Under RLS, deleting another user's row deletes 0 rows or errors
        if (!maliciousDelete || maliciousDelete.length === 0) {
          results.rlsWriteProtection = true;
          console.log(`  ✔ RLS Write Protection Verified: Account B attempted to DELETE Account A's mood; 0 rows affected.`);
        } else {
          console.error(`  FATAL RLS BREACH: Account B was able to DELETE Account A's mood!`);
          results.errors.push('RLS BREACH: Unauthorized row deletion allowed');
        }
      }
      // 1. Account B queries moods: Must see 12 default moods, but ZERO of Account A's custom moods
      const { data: bMoods, error: bMoodsErr } = await clientB
        .from('moods')
        .select('*');

      if (bMoodsErr) {
        console.error(`  ✖ Account B moods query failed: ${bMoodsErr.message}`);
      } else {
        const leakedMoodA = bMoods.find(m => m.user_id === userA.id);
        if (leakedMoodA) {
          console.error(`  FATAL RLS LEAK: Account B can see Account A's mood (${leakedMoodA.name})!`);
          results.errors.push('RLS LEAK: Custom moods not isolated between users');
        } else {
          results.rlsMoodIsolation = true;
          console.log(`  ✔ RLS Mood Isolation Verified: Account B sees ${bMoods.length} moods (all default or Account B's), 0 of Account A's moods.`);
        }
      }

      // 2. Account B queries tracks: Must see ZERO of Account A's tracks
      const { data: bTracks, error: bTracksErr } = await clientB
        .from('tracks')
        .select('*');

      if (bTracksErr) {
        console.error(`  ✖ Account B tracks query error: ${bTracksErr.message}`);
      } else {
        const leakedTrackA = bTracks.find(t => t.user_id === userA.id);
        if (leakedTrackA) {
          console.error(`  FATAL RLS LEAK: Account B can see Account A's track (${leakedTrackA.title})!`);
          results.errors.push('RLS LEAK: Tracks not isolated between users');
        } else {
          results.rlsTrackIsolation = true;
          console.log(`  ✔ RLS Track Isolation Verified: Account B sees 0 of Account A's tracks.`);
        }
      }

      // 3. Account B queries Account A's profile directly
      const { data: bProfiles, error: bProfErr } = await clientB
        .from('profiles')
        .select('*')
        .eq('id', userA.id);

      if (bProfErr) {
        console.log(`  ✔ RLS Profile Isolation Verified: Query blocked by RLS (${bProfErr.message})`);
        results.rlsProfileIsolation = true;
      } else if (bProfiles && bProfiles.length === 0) {
        results.rlsProfileIsolation = true;
        console.log(`  ✔ RLS Profile Isolation Verified: Account B received 0 rows for Account A's profile ID.`);
      } else {
        console.warn(`  ℹ Profile visibility: Public read policy may apply or row returned (${bProfiles?.length} rows).`);
      }

      // 4. Create custom mood for Account B and verify Account A cannot see it
      const moodNameB = `Aurora Borealis ${timestamp}`;
      const { data: newMoodB } = await clientB
        .from('moods')
        .insert({
          user_id: userB.id,
          name: moodNameB,
          category: 'dreamy',
          color: '#8B5CF6',
          is_default: false
        })
        .select()
        .single();

      if (newMoodB) {
        console.log(`  ✔ Account B created custom mood: ${newMoodB.name}`);
        // Now query from Account A's client:
        const { data: aMoodsCheck } = await clientA
          .from('moods')
          .select('*')
          .eq('name', moodNameB);

        if (aMoodsCheck && aMoodsCheck.length > 0) {
          console.error(`  FATAL RLS LEAK: Account A can see Account B's mood (${moodNameB})!`);
          results.errors.push('RLS LEAK: Account A saw Account B custom mood');
        } else {
          console.log(`  ✔ Bidirectional RLS Isolation Verified: Account A received 0 rows when searching for Account B's mood.`);
        }
      }

    } catch (err) {
      console.error('  ✖ Exception during RLS verification:', err.message);
      results.errors.push(err.message);
    }
  }

  // Safe Cleanup of TEST RECORDS ONLY (Never touches user data)
  console.log('\n--- 10. Clean Cleanup of Test Records Only ---');
  try {
    if (userA && clientA) {
      await clientA.from('track_moods').delete().eq('user_id', userA.id);
      await clientA.from('tracks').delete().eq('user_id', userA.id);
      await clientA.from('moods').delete().eq('user_id', userA.id);
      await clientA.from('profiles').delete().eq('id', userA.id);
      console.log('  ✔ Cleaned up test data for Account A.');
    }
    if (userB && clientB) {
      await clientB.from('moods').delete().eq('user_id', userB.id);
      await clientB.from('profiles').delete().eq('id', userB.id);
      console.log('  ✔ Cleaned up test data for Account B.');
    }
  } catch (cleanErr) {
    console.warn('  ℹ Note on test record cleanup:', cleanErr.message);
  }

  console.log('\n=============================================');
  console.log('            LIVE TEST RESULTS SUMMARY        ');
  console.log('=============================================');
  console.log(`Connectivity & Client:         ${results.connectivity ? 'PASS' : 'FAIL'}`);
  console.log(`All 9 Tables Present:          ${allTablesExist ? 'PASS' : 'FAIL'}`);
  console.log(`12 Default Moods Seeded:       ${results.defaultMoodsCheck ? 'PASS' : 'FAIL'}`);
  console.log(`Account A Registration & Auth: ${results.authAccountA ? 'PASS' : 'FAIL'}`);
  console.log(`Profile Auto-Creation (A):     ${results.profileAccountA ? 'PASS' : 'FAIL'}`);
  console.log(`Custom Mood Creation (A):      ${results.customMoodAccountA ? 'PASS' : 'FAIL'}`);
  console.log(`Track & Multi-Mood Assignment: ${results.trackMoodAccountA ? 'PASS' : 'FAIL'}`);
  console.log(`Session & DB Persistence:      ${results.persistenceAfterRefresh ? 'PASS' : 'FAIL'}`);
  console.log(`Account B Registration & Auth: ${results.authAccountB ? 'PASS' : 'FAIL'}`);
  console.log(`Profile Auto-Creation (B):     ${results.profileAccountB ? 'PASS' : 'FAIL'}`);
  console.log(`Explicit Logout & Re-Login:    ${results.authLoginLogout ? 'PASS' : 'FAIL'}`);
  console.log(`RLS Write Protection (Delete): ${results.rlsWriteProtection ? 'PASS' : 'FAIL'}`);
  console.log(`RLS Mood Data Isolation:       ${results.rlsMoodIsolation ? 'PASS' : 'FAIL'}`);
  console.log(`RLS Track Data Isolation:      ${results.rlsTrackIsolation ? 'PASS' : 'FAIL'}`);
  console.log(`RLS Profile Isolation:        ${results.rlsProfileIsolation ? 'PASS' : 'FAIL'}`);
  console.log('=============================================');

  if (results.errors.length > 0) {
    console.log('\nReported Issues / Errors:');
    results.errors.forEach(e => console.log(' - ' + e));
  }

  fs.writeFileSync('scripts/live_test_output.json', JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});

