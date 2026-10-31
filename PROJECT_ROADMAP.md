# MOODIFY — Comprehensive Product & Engineering Roadmap

> **Current Version:** V1.5.0 (Database, Authentication & Real Music Integration)  
> **Target Horizon:** V1.0 -> V1.5 (Complete) -> V2.0 -> V3.0  
> **Last Updated:** October 31, 2026  

---

## 1. Roadmap Strategic Horizon

```
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│         PHASE 1           │     │        PHASE 1.5          │     │         PHASE 2           │     │         PHASE 3           │
│      MOODIFY V1.0         │────>│      MOODIFY V1.5         │────>│      MOODIFY V2.0         │────>│      MOODIFY V3.0         │
│  - Core Player & Synth    │     │  - Supabase PostgreSQL    │     │  - Real MediaPipe Vision  │     │  - Synchronous Mood Rooms │
│  - Spotify Compliance     │     │  - Supabase Auth & RLS    │     │  - Serverless LLM Proxy   │     │  - Collaborative Listening│
│  - Air-Gapped Mocks       │     │  - Spotify PKCE OAuth     │     │  - Direct Playlist Export │     │  - Social Feed & Follows  │
│  - User Mood Store        │     │  - My Universe Library    │     │  - Advanced Mood Journeys │     │  - Public Profiles        │
│  - 9 Moods Base           │     │  - 12 Moods & Multi-Tags  │     │                           │     │                           │
│  (COMPLETE & AUDITED)     │     │  (COMPLETE & VERIFIED)    │     │  (NEXT DEVELOPMENT PHASE) │     │  (FUTURE HORIZON)         │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

---

## 2. Phase Breakdown & Status

### Phase 1: MOODIFY V1.0 — Core Architecture & Policy Compliance (COMPLETE)
* [x] **Sonic Moodscapes:** Initial mood categories with curated color palettes.
* [x] **Independent Catalog:** 13 native mood tracks with synthesis tone profiles.
* [x] **Web Audio Synthesizer Engine:** Multi-oscillator harmonic chord arpeggiator.
* [x] **Audio Frequency Visualizer:** Real-time spectrum visualizer strictly on MOODIFY audio.
* [x] **Air-Gapped AI Architecture:** Decoupled interfaces (`IMoodSuggestionService`, `IMoodSenseService`).
* [x] **Strict Spotify Compliance:** Elimination of Euclidean distance matching and deprecated endpoints.
* [x] **MoodSense Honesty & Privacy:** Camera processing disabled, simulated benchmark presets.

---

### Phase 1.5: MOODIFY V1.5 — Database, Auth & Real Music Integration (COMPLETE & VERIFIED)
* [x] **Supabase PostgreSQL Multi-Tenancy:**
  - 9 relational tables (`profiles`, `spotify_connections`, `tracks`, `imported_playlists`, `playlist_track_sources`, `moods`, `track_moods`, `user_settings`, `import_jobs`).
  - UUID primary keys, foreign keys, cascades, unique constraints, and indexes.
  - Strict Row Level Security (RLS) policies isolating user records (`auth.uid() = user_id`).
  - Automated triggers for new user initialization and `updated_at` timestamps.
* [x] **Real User Authentication (`authService.js`):**
  - Sign Up, Sign In, Persistent Sessions, Password Recovery, Profile Editing.
  - Dark cinematic modal UI with form validation, error banners, and loading states.
* [x] **5-Step Onboarding Wizard (`OnboardingModal.js`):**
  - Welcome, Identity Setup, Core Mood Selection, Optional Spotify Link, Universe Launch.
* [x] **Spotify OAuth 2.0 with PKCE (`spotifyAuth.js`):**
  - High-entropy cryptographic verifier and SHA-256 challenge.
  - CSRF state protection and public token exchange without client secret in browser.
  - Automatic token expiry tracking and refresh.
* [x] **"My Universe" Personal Music Library (`libraryService.js`, `TrackGrid.js`):**
  - Batch Spotify playlist discovery and import with real-time progress callbacks.
  - Track deduplication by provider ID and normalized `title::artist` composite key.
  - Multi-playlist source relationships.
  - Sorting (Date Added, Title, Artist, Duration) and track removal.
* [x] **12 Core Default Moods & Multi-Mood Tagging (`moodService.js`, `MoodSelector.js`):**
  - 12 default moods (*Party, Happy, Cheerful, Lonely, Romantic, Chill, Energetic, Nostalgic, Melancholic, Surprised, Dreamy, Confident*).
  - Custom mood creation and deletion.
  - Multi-mood tagging per track (e.g. *#Nostalgic*, *#Dreamy*, *#Melancholic*).
  - Multi-mood filtering engine.
* [x] **Safe V1 Local Data Migration (`localDataMigrator.js`):**
  - Automatic detection and migration of legacy localStorage overrides and preferences without data loss.
* [x] **Automated Testing Suite:** 38 passing unit tests across 5 test suites.

---

### Phase 2: MOODIFY V2.0 — Real AI/ML Model Integration (NEXT PHASE)
* **Target Focus:** Real client-side and serverless AI inference without altering UI or core music player logic.
* **Deliverables:**
  1. **Client-Side Computer Vision (`MediaPipeMoodSenseService`):**
     - Integrates `@mediapipe/tasks-vision` WebAssembly package for local facial landmark and blendshape classification.
     - 100% on-device GPU/WASM inference — zero video frames or facial geometry uploaded or persisted.
     - Plugs into existing `IMoodSenseService` contract via `AIServiceRegistry`.
  2. **Production LLM Suggestion Service (`OpenAIMoodSuggestionService`):**
     - Cloudflare Worker / Serverless API proxy to protect API keys.
     - Maps freeform natural language user prompts into standardized `MoodVector`s.
     - Air-Gap rule strictly enforced: Zero Spotify data sent in prompt payloads.
  3. **Direct Spotify Playlist Export:**
     - Allows users to export a curated MOODIFY mood session directly as a playlist in their personal Spotify library (`POST /v1/users/{user_id}/playlists`).
  4. **Multi-Stage Mood Journeys:**
     - Progressive sonic transitions (e.g. from Deep Focus to Radiant Joy over a customizable time duration).

---

### Phase 3: MOODIFY V3.0 — Social Universe & Live Mood Rooms (FUTURE HORIZON)
* **Target Focus:** Social listening and collaborative music spaces.
* **Deliverables:**
  1. **Synchronous Mood Rooms:**
     - Collaborative listening rooms powered by WebSockets / WebRTC.
     - Shared mood canvas where room participants collectively influence ambient lighting and sonic attributes.
  2. **Social Universe:**
     - Public user profiles, following/followers, and activity feeds.
  3. **Extended Music Providers:**
     - Connectors for Bandcamp and SoundCloud for expanded indie music coverage.

---

## 3. Strict Architectural Invariants

Across all roadmap phases, the following architectural invariants are **strictly non-negotiable**:

1. **Air-Gap Separation:** Spotify Content (metadata, album art, audio streams, lyrics) will NEVER be forwarded to external AI models or used to train recommendation algorithms.
2. **Zero Biometric Retention:** Biometric camera frames, recordings, and facial landmarks will NEVER be persisted to disk, local storage, cookies, or remote analytics.
3. **Autonomous Playback Guarantee:** MOODIFY will always maintain its built-in Web Audio synthesis engine so the app remains enjoyable and audible even without external music streaming subscriptions.
4. **Row Level Security Multi-Tenancy:** User libraries, custom moods, and settings remain isolated at the database engine level.
