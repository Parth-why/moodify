-- ============================================================================
-- MOODIFY V1.5 — PostgreSQL Database Schema & Row Level Security (RLS)
-- ============================================================================
-- Migration: 20261031000000_v1_5_initial_schema.sql
-- Description: Creates 9 core tables with UUIDs, foreign keys, cascades, 
-- indexes, triggers, and airtight Row Level Security for authenticated multi-tenancy.
-- ============================================================================

-- Ensure pgcrypto extension is active for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Users can view and manage their own profile.
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
    ON public.profiles FOR DELETE 
    USING (auth.uid() = id);

-- ============================================================================
-- 2. SPOTIFY CONNECTIONS TABLE
-- ============================================================================
-- Stores connection state and public Spotify user ID.
-- SENSITIVE CREDENTIAL RULE: Access/refresh tokens are NEVER stored in public tables.
CREATE TABLE IF NOT EXISTS public.spotify_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_user_id TEXT,
    connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'expired')),
    connected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_spotify_connection_user UNIQUE (user_id)
);

ALTER TABLE public.spotify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spotify connection" 
    ON public.spotify_connections FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify connection" 
    ON public.spotify_connections FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify connection" 
    ON public.spotify_connections FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify connection" 
    ON public.spotify_connections FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TRACKS TABLE (Personal Music Library)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'spotify' CHECK (provider IN ('spotify', 'moodify_native', 'custom')),
    provider_track_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    cover_url TEXT,
    duration_s INTEGER NOT NULL DEFAULT 0,
    preview_url TEXT,
    external_url TEXT,
    user_notes TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_provider_track UNIQUE (user_id, provider, provider_track_id)
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracks" 
    ON public.tracks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks" 
    ON public.tracks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" 
    ON public.tracks FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
    ON public.tracks FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_provider_id ON public.tracks(provider, provider_track_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_title ON public.tracks(user_id, artist, title);

-- ============================================================================
-- 4. IMPORTED PLAYLISTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.imported_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'spotify' CHECK (provider IN ('spotify', 'custom')),
    provider_playlist_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    total_tracks INTEGER NOT NULL DEFAULT 0,
    import_status TEXT NOT NULL DEFAULT 'completed' CHECK (import_status IN ('pending', 'importing', 'completed', 'failed', 'partial')),
    imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_provider_playlist UNIQUE (user_id, provider, provider_playlist_id)
);

ALTER TABLE public.imported_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own imported playlists" 
    ON public.imported_playlists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imported playlists" 
    ON public.imported_playlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported playlists" 
    ON public.imported_playlists FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported playlists" 
    ON public.imported_playlists FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_imported_playlists_user ON public.imported_playlists(user_id);

-- ============================================================================
-- 5. PLAYLIST TRACK SOURCES TABLE (Many-to-Many: Track <-> Playlist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_track_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES public.imported_playlists(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_playlist_track UNIQUE (user_id, track_id, playlist_id)
);

ALTER TABLE public.playlist_track_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own playlist track sources" 
    ON public.playlist_track_sources FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlist track sources" 
    ON public.playlist_track_sources FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlist track sources" 
    ON public.playlist_track_sources FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pts_track_id ON public.playlist_track_sources(track_id);
CREATE INDEX IF NOT EXISTS idx_pts_playlist_id ON public.playlist_track_sources(playlist_id);

-- ============================================================================
-- 6. MOODS TABLE (12 Defaults + Custom User Moods)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'custom',
    color TEXT NOT NULL DEFAULT '#8B5CF6',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_mood_name UNIQUE (user_id, name)
);

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

-- Users can read their own moods OR system default moods (where is_default = true)
CREATE POLICY "Users can view own and default moods" 
    ON public.moods FOR SELECT 
    USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom moods" 
    ON public.moods FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own custom moods" 
    ON public.moods FOR UPDATE 
    USING (auth.uid() = user_id AND is_default = false) 
    WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own custom moods" 
    ON public.moods FOR DELETE 
    USING (auth.uid() = user_id AND is_default = false);

CREATE INDEX IF NOT EXISTS idx_moods_user ON public.moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_default ON public.moods(is_default);

-- ============================================================================
-- 7. TRACK MOODS TABLE (Multiple Moods per Track)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.track_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    mood_id UUID NOT NULL REFERENCES public.moods(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assignment_source TEXT NOT NULL DEFAULT 'user_assigned' CHECK (assignment_source IN ('user_assigned', 'bulk_assigned', 'onboarding_preset', 'ai_suggested_confirmed')),
    CONSTRAINT uq_track_mood UNIQUE (track_id, mood_id)
);

ALTER TABLE public.track_moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their track moods" 
    ON public.track_moods FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their track moods" 
    ON public.track_moods FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their track moods" 
    ON public.track_moods FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_track_moods_track ON public.track_moods(track_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_mood ON public.track_moods(mood_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_user ON public.track_moods(user_id);

-- ============================================================================
-- 8. USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark-cinematic',
    privacy_settings JSONB NOT NULL DEFAULT '{"airGapActive": true, "allowBiometrics": false}'::jsonb,
    discovery_preferences JSONB NOT NULL DEFAULT '{"preferredMoods": ["chill", "focused"], "energyBias": 0.5, "acousticBias": 0.5}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_settings_user UNIQUE (user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their settings" 
    ON public.user_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their settings" 
    ON public.user_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settings" 
    ON public.user_settings FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. IMPORT JOBS TABLE (Async Playlist & Library Import Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'spotify_playlist',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their import jobs" 
    ON public.import_jobs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their import jobs" 
    ON public.import_jobs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their import jobs" 
    ON public.import_jobs FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. SYSTEM DEFAULT MOODS SEEDING
-- ============================================================================
-- 12 Core Default Moods (available to all users, user_id is NULL)
INSERT INTO public.moods (name, category, color, is_default, user_id)
VALUES
    ('Party', 'party', '#F59E0B', true, NULL),
    ('Happy', 'joyful', '#FBBF24', true, NULL),
    ('Cheerful', 'joyful', '#34D399', true, NULL),
    ('Lonely', 'melancholy', '#64748B', true, NULL),
    ('Romantic', 'romantic', '#F43F5E', true, NULL),
    ('Chill', 'chill', '#38BDF8', true, NULL),
    ('Energetic', 'energetic', '#EF4444', true, NULL),
    ('Nostalgic', 'chill', '#D97706', true, NULL),
    ('Melancholic', 'melancholy', '#818CF8', true, NULL),
    ('Surprised', 'energetic', '#EC4899', true, NULL),
    ('Dreamy', 'focused', '#A855F7', true, NULL),
    ('Confident', 'energetic', '#10B981', true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. AUTOMATIC PROFILE & SETTINGS INITIALIZATION TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create User Settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to invoke on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 12. UPDATED_AT TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_spotify_connections_updated_at BEFORE UPDATE ON public.spotify_connections FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
