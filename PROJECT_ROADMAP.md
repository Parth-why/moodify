# MOODIFY — Comprehensive Product & Engineering Roadmap

> **Current Version:** V1.0.0 (Production Core & Policy Compliance)  
> **Target Horizon:** V1.0 -> V1.5 -> V2.0 -> V3.0  
> **Last Updated:** October 31, 2026

---

## 1. Roadmap Overview & Strategic Horizon

```
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│         PHASE 1           │     │         PHASE 2           │     │         PHASE 3           │
│      MOODIFY V1.0         │────>│      MOODIFY V2.0         │────>│      MOODIFY V3.0         │
│  - Core Player & Synth    │     │  - Real LLM Inference     │     │  - Persistent DB & Auth   │
│  - Spotify Compliance     │     │  - Real MediaPipe Vision  │     │  - Spotify Playlist Export│
│  - Air-Gapped Mocks       │     │  - Moments & Journeys V2  │     │  - Synchronous Mood Rooms │
│  - User Mood Store        │     │  - Client-Side WebAssembly│     │  - Multi-User Discovery   │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

---

## 2. Phase Breakdown

### Phase 1: MOODIFY V1.0 (Current Status: COMPLETE & VERIFIED)
* **Status:** Completed, verified with automated unit tests (`npm test`), and validated via browser automation.
* **Deliverables:**
  - [x] **Sonic Moodscapes:** 9 responsive mood categories with curated palettes and Google Fonts typography.
  - [x] **Independent Catalog:** 13 native mood tracks with custom synthesized audio tone profiles.
  - [x] **Audio Synthesizer Engine:** Multi-oscillator Web Audio API engine providing reliable audio chords, arpeggios, and basslines across all moodscapes.
  - [x] **Audio Frequency Visualizer:** Real-time canvas visualizer running exclusively on MOODIFY-owned synthesized audio.
  - [x] **Air-Gapped AI Architecture:** Decoupled `IMoodSuggestionService` and `IMoodSenseService` contracts managed by `AIServiceRegistry`.
  - [x] **Strict Spotify Compliance:**
    - Zero Euclidean distance matching on Spotify audio features.
    - Zero Spotify data leakage to AI models via `AIPrivacyGuard`.
    - No calls to deprecated `/v1/audio-features` or `/v1/recommendations`.
    - Automated track deduplication.
  - [x] **MoodSense Honesty & Privacy:**
    - Live camera frame processing explicitly disabled in V1.
    - Zero fabricated prediction percentages.
    - Default **Camera-Free Mood Discovery** workflow.
    - Explicit opt-in preview with instant track termination on close.
    - Scientific context notice: Facial expressions are context cues, not definitive emotions.
  - [x] **User Mood Store:** Local storage persistence for user mood overrides, Moments, and favorites.

---

### Phase 2: MOODIFY V2.0 — Real AI/ML Model Integration
* **Target Focus:** Real client-side and serverless AI inference without altering UI or music player logic.
* **Prerequisites:** Complete Phase 1 technical audit (completed).
* **Deliverables:**
  1. **Production LLM Suggestion Service (`OpenAIMoodSuggestionService` / `ClaudeMoodSuggestionService`):**
     - Serverless backend proxy (Cloudflare Worker or Next.js API route) to keep API secrets secure.
     - Maps freeform natural language vibes to standardized `MoodVector`s.
     - Strict assertion: Zero Spotify track or artist data passed in prompt.
     - Registered seamlessly via `aiRegistry.registerSuggestionService(new RealService())`.
  2. **Client-Side Computer Vision (`MediaPipeMoodSenseService`):**
     - Integrates Google MediaPipe FaceLandmarker WebAssembly package.
     - Executes 100% on client GPU/CPU via WebGL/WASM—zero video or image upload to any server.
     - Ephemeral frame processing: Memory buffers purged immediately after blendshape classification.
     - Zero persistence of landmarks or images in local storage or cookies.
     - Registered via `aiRegistry.registerSenseService(new MediaPipeService())`.
  3. **Advanced User Moments & Journeys:**
     - Multi-stage journeys (e.g., transition from "Deep Focus" to "Radiant Joy" over a 45-minute study timer).

---

### Phase 3: MOODIFY V3.0 — Persistent Backend, Auth & Social Mood Rooms
* **Target Focus:** Scalable multi-user ecosystem and social listening.
* **Deliverables:**
  1. **Persistent Cloud Database & Authentication:**
     - PostgreSQL / Supabase backend for user accounts, custom playlists, and synced preferences.
     - Full OAuth 2.0 PKCE flow for Spotify accounts.
  2. **Spotify Playlist Creation & Export:**
     - Allows users to export a curated MOODIFY mood session directly as a playlist in their personal Spotify library (`POST /v1/users/{user_id}/playlists`).
     - Honest import/export status reporting.
  3. **Synchronous Mood Rooms:**
     - Collaborative listening rooms powered by WebSockets / WebRTC.
     - Shared mood canvas where room participants collectively influence ambient lighting and sonic attributes.
  4. **Extended Music Providers:**
     - Independent streaming connectors for Bandcamp and SoundCloud for expanded indie music coverage.

---

## 3. Strict Architectural Invariants

Across all roadmap phases, the following architectural invariants are **strictly non-negotiable**:

1. **Air-Gap Separation:** Spotify Content (metadata, album art, audio streams, lyrics) will NEVER be forwarded to external AI models or used to train recommendation algorithms.
2. **Zero Biometric Retention:** Biometric camera frames, recordings, and facial landmarks will NEVER be persisted to disk, local storage, cookies, or remote analytics.
3. **Autonomous Playback Guarantee:** MOODIFY will always maintain its built-in Web Audio synthesis engine so the app remains enjoyable and audible even without external music streaming subscriptions.
