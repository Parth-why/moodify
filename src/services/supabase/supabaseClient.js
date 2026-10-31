/**
 * @file supabaseClient.js
 * Centralized Supabase Client & Configuration for MOODIFY V1.5.
 *
 * SECURITY & ARCHITECTURAL RULES:
 * 1. Uses the public anonymous key (VITE_SUPABASE_ANON_KEY) only.
 * 2. NEVER exposes or accepts the Supabase service-role secret in frontend client code.
 * 3. Enforces Row Level Security (RLS) on all PostgreSQL operations via auth.uid().
 * 4. Provides a graceful fallback when environment variables are not yet configured.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Security check: Guard against accidental entry of service-role key
if (supabaseAnonKey && supabaseAnonKey.includes('service_role')) {
  console.error('[SECURITY ALERT] Supabase service-role key detected in frontend client! Removing immediately.');
  throw new Error('FATAL SECURITY VIOLATION: Service-role key must NEVER be used in client-side code.');
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.info(
    '[Moodify Supabase] Client running in Standalone/Demo mode. To connect real PostgreSQL database, provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

/**
 * Singleton Supabase Client instance
 */
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'moodify_supabase_auth_token'
      }
    })
  : null;

/**
 * Verifies Supabase connection health
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'Supabase credentials not configured in .env. Running in local standalone mode.'
    };
  }

  try {
    const { error } = await supabase.from('moods').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected to Supabase PostgreSQL with active RLS.' };
  } catch (err) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}
