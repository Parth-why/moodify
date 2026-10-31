# MOODIFY — System Architecture & Technical Specifications

> **Document Version:** 1.5.0  
> **Core Architecture:** Modular Event-Driven Single Page Application  
> **Target Release:** MOODIFY V1.5  

---

## 1. High-Level System Architecture

MOODIFY is structured into decoupled layers, ensuring the visual presentation, audio engine, database persistence, and external service adapters operate independently through well-defined contracts.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                                      │
│                                                                                        │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐   │
│   │    Header    │   │ MoodSelector │   │  TrackGrid   │   │       PlayerBar       │   │
│   │ (Auth/Search)│   │  (12 Moods)  │   │ (My Universe)│   │ (Visualizer & Synth)  │   │
│   └───────┬──────┘   └───────┬──────┘   └───────┬──────┘   └───────────┬───────────┘   │
│           │                  │                  │                      │               │
│   ┌───────┴──────┐   ┌───────┴──────┐   ┌───────┴──────┐   ┌───────────┴───────────┐   │
│   │  AuthModal   │   │OnboardingMod │   │PlaylistImport│   │    MoodSenseModal     │   │
│   │  & Profile   │   │  (5 Steps)   │   │   (Batch)    │   │  (Simulated Preset)   │   │
│   └───────┬──────┘   └───────┬──────┘   └───────┬──────┘   └───────────┬───────────┘   │
└───────────┼──────────────────┼──────────────────┼──────────────────────┼───────────────┘
            ▼                  ▼                  ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           CENTRAL REACTIVE STATE CONTAINER                             │
│                                                                                        │
│                                  AppState (EventBus)                                   │
│            - currentMood, targetAudioFeatures, currentTrack, tracks, isPlaying         │
└───────────┬──────────────────┬──────────────────┬──────────────────────┬───────────────┘
            │                  │                  │                      │
            ▼                  ▼                  ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DOMAIN SERVICES LAYER                                     │
│                                                                                        │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐   │
│   │ AuthService  │   │ MoodService  │   │LibraryService│   │      AudioPlayer      │   │
│   │ (Profiles &  │   │ (12 Moods &  │   │ (Deduplicate │   │     (Web Audio API    │   │
│   │  Sessions)   │   │ Multi-Tags)  │   │ & Playlists) │   │     Synthesizer)      │   │
│   └───────┬──────┘   └───────┬──────┘   └───────┬──────┘   └───────────┬───────────┘   │
└───────────┼──────────────────┼──────────────────┼──────────────────────┼───────────────┘
            │                  │                  │                      │
            ▼                  ▼                  ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           AIR-GAP PRIVACY GUARD & SECURITY                             │
│                                                                                        │
│   • Blocks Spotify track IDs, lyrics, artwork & audio from entering AI payloads        │
│   • Ensures zero persistence of webcam video buffers or biometric landmarks            │
│   • Guarantees AnalyserNode never taps into external Spotify audio streams             │
└───────────┬────────────────────────────────────────────────────────────┬───────────────┘
            │                                                            │
            ▼                                                            ▼
┌───────────────────────────────┐                             ┌──────────────────────────┐
│   SUPABASE POSTGRESQL & AUTH  │                             │     SPOTIFY WEB API      │
│                               │                             │                          │
│   - profiles (RLS)            │                             │   - OAuth 2.0 with PKCE  │
│   - tracks (RLS)              │                             │   - /v1/search?type=track│
│   - imported_playlists (RLS)  │                             │   - /v1/me/playlists     │
│   - moods & track_moods (RLS) │                             │   - /v1/playlists/...    │
│   - user_settings (RLS)       │                             │   - Zero AI derivations  │
└───────────────────────────────┘                             └──────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Decoupled Dependency Injection
Components never directly invoke third-party SDKs or execute raw database queries. 
Instead:
* **UI Components** emit events or call singleton domain services (`authService`, `moodService`, `libraryService`, `audioPlayer`).
* **Domain Services** encapsulate business logic and route data through compliant adapters.
* **Service Registry (`AIServiceRegistry`)** decouples AI interfaces (`IMoodSuggestionService`, `IMoodSenseService`) from UI components. Any mock service can be swapped with a real model without rewriting a single line of UI code.

### 2.2 Air-Gapped Data Partitioning
In strict compliance with Spotify Developer Policy:
* **Spotify Data** is treated strictly as an external provider stream.
* **MOODIFY User Data** (user-assigned mood tags, custom moods, Moments, Journeys, and listening preferences) is stored in independent database tables or namespaced local storage.
* **AI Firewalls**: [`AIPrivacyGuard.sanitizeSuggestionRequest()`](file:///d:/CLG/Hustle/Moodify/src/services/ai/privacyGuard.js) recursively strips all provider metadata, lyrics, and artwork before AI prompt dispatch.

### 2.3 Audio Synthesizer Isolation
* The Web Audio ambient synthesizer produces pleasant harmonic pad progressions and arpeggiations autonomously using native `OscillatorNode` and `GainNode` graphs.
* When a Spotify track is selected for playback, [`audioPlayer.getAnalyser()`](file:///d:/CLG/Hustle/Moodify/src/services/audio/audioPlayer.js) returns `null`. Spotify audio is never decompressed, extracted, or piped into custom FFT analyzers.
* The canvas spectrum visualizer operates exclusively on MOODIFY-owned synthesis tones.

---

## 3. Database Relational Model & Multi-Tenancy

All 9 PostgreSQL tables enforce PostgreSQL **Row Level Security (RLS)**:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own data" ON <table>
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Table Relationships:
1. `profiles`: Extends `auth.users(id)` with display metadata.
2. `tracks`: Stores personal music library items, indexed by `(user_id, provider, provider_track_id)`.
3. `imported_playlists`: Stores imported playlist records with total track counts.
4. `playlist_track_sources`: Many-to-many junction table between `tracks` and `imported_playlists`.
5. `moods`: Stores the 12 core default system moods (`is_default = true`) and user custom moods (`is_default = false`).
6. `track_moods`: Many-to-many junction table supporting multiple moods per track (`(track_id, mood_id)` unique constraint).
7. `user_settings`: User theme, air-gap privacy preferences, and discovery biases.
8. `spotify_connections`: Connection state and public user ID.
9. `import_jobs`: Async progress tracking for large playlist imports.

---

## 4. Resilience & Standalone Demo Mode

MOODIFY features built-in resilience:
* If Supabase credentials are not configured in `.env`, the application automatically falls back to **Local Standalone Demo Mode** using namespaced `localStorage` (`moodify_v1_5_*`).
* Users can test registration, onboarding, custom moods, track tagging, and ambient audio playback without being blocked by external service setup.
* When real credentials are provided, `LocalDataMigrator` safely bridges any local data into the cloud database.
