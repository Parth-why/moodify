# MOODIFY — Spotify Developer Policy & Compliance Specification

> **Document Version:** 1.0.0  
> **Effective Compliance Date:** February 2026 Migration Baseline  
> **Applicable Regulations:** Spotify Developer Terms of Service (Sections II, III & IV)

---

## 1. Compliance Architecture Overview

Moodify integrates with the Spotify Web API strictly as a discovery and playback client. To comply with Spotify's Developer Policy and the February 2026 API changes, Moodify enforces a strict, air-gapped boundary between Spotify Content, MOODIFY's internal user mood store, and external AI/ML services.

```
┌────────────────────────────────────────────────────────┐
│                   MOODIFY ECOSYSTEM                    │
│                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │   MOODIFY User Store    │  │   MOODIFY Catalog   │  │
│  │  - User Mood Overrides  │  │  - Native Tracks    │  │
│  │  - Moments & Journeys   │  │  - Synthesized Tone │  │
│  │  - User Preferences     │  │  - Independent Tags │  │
│  └───────────┬─────────────┘  └──────────┬──────────┘  │
│              │                           │             │
│              ▼                           ▼             │
│         ┌─────────────────────────────────────┐        │
│         │     MOODIFY Core Music Engine       │        │
│         └──────────────────┬──────────────────┘        │
│                            │                           │
│                            ▼                           │
│              ┌───────────────────────────┐             │
│              │  AIR-GAP PRIVACY GUARD    │             │
│              └─────────────┬─────────────┘             │
└────────────────────────────┼───────────────────────────┘
                             │
              STRICT FIREWALL (NO SPOTIFY DATA)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│   Future AI Models    │         │   Spotify Web API     │
│  - Text Prompts Only  │         │  - Official Search    │
│  - Zero Spotify Data  │         │  - Web Playback SDK   │
│  - Zero Biometrics    │         │  - No AI Derivation   │
└───────────────────────┘         └───────────────────────┘
```

---

## 2. Mandatory Policy Requirements & Verifications

### 2.1. Prohibition of Derived Recommendation Algorithms (Rule 1)
* **Policy Mandate:** Developers must not use Spotify Content or metadata to derive, train, or power external recommendation algorithms or machine learning models.
* **MOODIFY Implementation:**
  - All Euclidean distance calculation formulas (e.g. comparing track valence, energy, or danceability against target vectors) have been **completely eliminated** from the codebase.
  - Music matching is driven by:
    1. Direct user-assigned mood tags.
    2. MOODIFY's native curated catalog.
    3. User-created Moments and Journeys.

### 2.2. Zero Spotify Content in AI/ML Inference or Training (Rule 2)
* **Policy Mandate:** Do not use Spotify metadata, audio features, album artwork, lyrics, audio streams, or other Spotify Content as inputs for external AI/ML inference or model training.
* **MOODIFY Implementation:**
  - Enforced programmatically by [`AIPrivacyGuard.sanitizeSuggestionRequest()`](file:///d:/CLG/Hustle/Moodify/src/services/ai/privacyGuard.js).
  - Outgoing AI requests are filtered recursively. Any keys matching `/spotify/i`, `/track_?id/i`, `/album_?art/i`, `/lyrics/i`, or `/audio_?buffer/i` are stripped immediately.
  - Validated by unit tests in [`tests/ai-privacy.test.js`](file:///d:/CLG/Hustle/Moodify/tests/ai-privacy.test.js).

### 2.3. Independent Source of Mood Recommendations (Rule 3)
* **Policy Mandate:** Mood recommendations must originate from non-Spotify sources.
* **MOODIFY Implementation:**
  - MOODIFY relies on:
    - **User-assigned moods and corrections:** Managed via [`UserMoodStore`](file:///d:/CLG/Hustle/Moodify/src/services/userdata/userMoodStore.js).
    - **Moments & Journeys:** User-created emotional sessions (e.g., "Late Night Deep Work").
    - **MOODIFY Independent Catalog:** Stored in [`moodifyCatalog.js`](file:///d:/CLG/Hustle/Moodify/src/services/catalog/moodifyCatalog.js).

### 2.4. Data Partitioning & Storage Separation (Rule 4)
* **Policy Mandate:** Spotify data must not be co-mingled with user-generated proprietary mood databases.
* **MOODIFY Implementation:**
  - User mood overrides and Moments are stored in dedicated local storage keys (`moodify_user_mood_overrides`, `moodify_user_moments`).
  - Spotify tokens and client IDs are stored in distinct keys (`moodify_spotify_token`, `moodify_spotify_client_id`).

### 2.5. Prohibition of Spotify Audio Extraction & Analysis (Rule 5)
* **Policy Mandate:** Spotify audio must never be captured, ripped, decompressed, or analyzed by custom client audio graphs.
* **MOODIFY Implementation:**
  - In [`audioPlayer.js`](file:///d:/CLG/Hustle/Moodify/src/services/audio/audioPlayer.js), `getAnalyser()` returns `null` whenever a Spotify track is active (`isSpotifyPlayback === true`).
  - Spotify streams are NEVER connected to a Web Audio `createMediaElementSource` or `AnalyserNode`.

### 2.6. MOODIFY-Owned Synthesizer & Visualizer (Rule 6)
* **Policy Mandate:** Custom visualizers must operate only on permitted audio.
* **MOODIFY Implementation:**
  - The Web Audio synthesizer generates original ambient pads, chord progressions, and bass arpeggios using native oscillators.
  - The canvas frequency visualizer is driven exclusively by this MOODIFY-owned synthesis engine.

### 2.7. Officially Supported Playback & Premium Restrictions (Rule 7)
* **Policy Mandate:** Full audio playback must use officially supported SDKs and respect subscription tiers.
* **MOODIFY Implementation:**
  - Spotify tracks display a notice: *"Available via Spotify API search. Requires Spotify Premium for full playback."*
  - Provides direct deep links to open tracks in the official Spotify app/web player (`https://open.spotify.com/track/...`).

### 2.8. February 2026 API Migration Compatibility (Rule 8)
* **Policy Mandate:** Applications must not rely on deprecated or restricted endpoints.
* **MOODIFY Implementation:**
  - In Spotify's recent API migration:
    - `GET /v1/audio-features`: Deprecated / Restricted. **Not called by MOODIFY.**
    - `GET /v1/audio-analysis`: Deprecated / Restricted. **Not called by MOODIFY.**
    - `GET /v1/recommendations`: Restricted for apps without extended access. **Not called by MOODIFY.**
  - MOODIFY uses only permitted standard endpoints:
    - `GET /v1/search?q={query}&type=track`
    - `GET /v1/me/playlists` (where user permissions are granted)

### 2.9. Honest Playlist Import Claims (Rule 9)
* **Policy Mandate:** Applications must never misrepresent inaccessible playlist contents as imported.
* **MOODIFY Implementation:**
  - Inaccessible or private user playlists are never displayed as imported. If a user playlist cannot be read, an honest error message is shown.

### 2.10. Documentation of Spotify API Limitations (Rule 10)
* Detailed below in Section 3.

---

## 3. Current Spotify API Limitations

Developers and maintainers should be aware of the following technical and policy constraints when working with the Spotify Web API:

| Feature / Endpoint | Status in 2026 | Technical Limitation | MOODIFY Mitigation |
|---|---|---|---|
| **Audio Features API** (`/v1/audio-features`) | Deprecated / Restricted | Access restricted to approved partners; cannot query valence, energy, danceability for tracks. | MOODIFY does not use this endpoint. Moods are categorized independently by MOODIFY or assigned by users. |
| **Recommendations API** (`/v1/recommendations`) | Restricted | Seed genres and target audio feature queries are restricted for general developer apps. | Replaced with standard keyword and genre search via `/v1/search?type=track`. |
| **Web Previews (`preview_url`)** | Severely Limited | 30-second MP3 previews are unavailable for many major label tracks in the Web API. | MOODIFY includes an autonomous Web Audio ambient chord synthesizer, ensuring audio playback and visualizers work for all tracks. |
| **Full Web Playback** | Restricted to Premium | The Spotify Web Playback SDK strictly requires an active Spotify Premium subscription. | Free-tier users are presented with deep links to launch the Spotify native app. |
| **Rate Limiting** | Active (429 Too Many Requests) | Rolling 30-second window quotas per Client ID. | Client implements track deduplication and local caching to minimize redundant API calls. |

---

## 4. Compliance Verification Checklist

Before releasing any new feature or pull request, run the compliance test suite:

```bash
npm test
```

The test runner asserts that:
- [x] No Euclidean distance formulas exist in `spotifyClient.js`.
- [x] No fetch calls target `/v1/recommendations` or `/v1/audio-features`.
- [x] Track deduplication reliably filters duplicates.
- [x] Spotify tracks never connect to the Web Audio `AnalyserNode`.
- [x] `AIPrivacyGuard` rejects any Spotify metadata or tokens in AI payloads.
