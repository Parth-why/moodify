# MOODIFY — AI Mood Music & Sonic Ecosystem

> **"Your music. Your emotions. Your universe."**  
> **Version:** 1.5.0 (Database, Authentication & Real Music Integration)

---

## Overview

**MOODIFY** is a personal music organization, emotional discovery, and sonic ecosystem designed to harmonize your emotional states with sound. 

Unlike conventional music platforms that box tracks into rigid genres, MOODIFY organizes music around **deeply personal emotional frequencies, Moments, and journeys**.

### Key Highlights of Version 1.5:
* **Dark Cinematic Interface**: Immersive glassmorphic design system with vibrant cyan, purple, and pink accents, glowing mood chips, and dynamic micro-animations.
* **12 Sonic Moodscapes**: Default emotional frequencies (*Party, Happy, Cheerful, Lonely, Romantic, Chill, Energetic, Nostalgic, Melancholic, Surprised, Dreamy, Confident*) plus unlimited user-created custom moods.
* **Multi-Mood Tagging**: Songs are multifaceted—assign multiple simultaneous moods to any track (e.g. *#Nostalgic*, *#Dreamy*, *#Melancholic*).
* **"My Universe" Personal Library**: Persistent music library with track deduplication, multi-playlist association, search, and sorting (by Title, Artist, Duration, Date Added).
* **Supabase PostgreSQL & Auth**: Multi-tenant authentication (Sign In, Sign Up, Password Recovery, Profile Management) protected by PostgreSQL Row Level Security (RLS) across 9 relational tables.
* **Spotify OAuth 2.0 PKCE**: Public client authorization code flow with SHA-256 code challenge/verifier and zero client secrets exposed in browser code.
* **Web Audio Ambient Synthesizer & Canvas Visualizer**: Multi-oscillator harmonic chord arpeggiator generating original ambient soundscapes, synced to a real-time frequency spectrum visualizer.
* **Air-Gapped AI Privacy Guard**: Strict policy compliance guaranteeing Spotify content and biometric camera buffers are never piped into external AI inference or recommendation models.
* **Safe V1 Local Data Migration**: Automatically migrates legacy `localStorage` mood overrides and preferences into persistent cloud structures without data loss.

---

## Technology Stack

* **Frontend Engine**: Vanilla JavaScript (ES Modules), Vite 8
* **Styling**: Vanilla CSS Design System with custom tokens & glassmorphism
* **Audio Architecture**: Web Audio API (Multi-oscillator harmonic synthesis, AnalyserNode, Canvas rendering)
* **Backend Database & Auth**: Supabase PostgreSQL 15, Supabase Auth, Row Level Security (RLS)
* **Music Integration**: Spotify Web API (PKCE Authorization Code Flow, Search, Playlist item fetching)
* **Test Runner**: Node.js Native Test Runner (`node --test`)

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18 or higher (v20+ recommended)
* [npm](https://www.npmjs.com/) v9 or higher

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Parth-why/moodify.git
cd moodify
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# Supabase PostgreSQL & Auth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Spotify Application (PKCE Flow)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
```
*(Note: If you run without `.env`, MOODIFY automatically runs in standalone local demo mode, allowing full exploration of the synthesizer, native catalog, and UI workflows!)*

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Automated Test Suite
Execute the 38 unit tests covering AI Privacy, Spotify Compliance, Audio Isolation, Auth, Database, Library Deduplication, and PKCE:
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

---

## Documentation Directory

* [`V1_5_IMPLEMENTATION_PLAN.md`](./V1_5_IMPLEMENTATION_PLAN.md): Architectural roadmap and phase breakdown.
* [`DATABASE_SETUP.md`](./DATABASE_SETUP.md): Supabase PostgreSQL schema, migrations, and RLS policies.
* [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md): Spotify Developer Dashboard registration & PKCE configuration.
* [`SPOTIFY_COMPLIANCE.md`](./SPOTIFY_COMPLIANCE.md): February 2026 Spotify Developer Policy guidelines and air-gap guarantees.
* [`DEPLOYMENT.md`](./DEPLOYMENT.md): Production hosting guide (Vercel, Netlify, Cloudflare).
* [`ARCHITECTURE.md`](./ARCHITECTURE.md): System diagrams, data isolation boundaries, and state management.
* [`V1_5_COMPLETION_REPORT.md`](./V1_5_COMPLETION_REPORT.md): Comprehensive feature completion and audit report.

---

## License
Private & Proprietary — MOODIFY Project. All rights reserved.
