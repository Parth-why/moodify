# MOODIFY — Spotify Developer Dashboard & PKCE Integration Guide

> **Document Version:** 1.5.0  
> **Authorization Standard:** OAuth 2.0 with PKCE (Proof Key for Code Exchange)  
> **Target Compliance:** Spotify Developer Policy (February 2026 Migration)  

---

## 1. Overview

MOODIFY integrates with the Spotify Web API using the **Authorization Code Flow with PKCE**. 

This is the officially recommended flow for single-page web applications because **it eliminates the need for a client secret**. The client secret is never bundled, exposed, or committed to frontend code, protecting your application against credential leakage.

---

## 2. Setting Up Your Spotify Developer Application

### Step 1: Create an App in the Spotify Developer Dashboard
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in with your Spotify account.
2. Click **Create app**.
3. Fill in the application details:
   * **App name**: `Moodify`
   * **App description**: `Personal mood-driven music universe and emotion discovery platform.`
   * **Website**: `http://127.0.0.1:5173/` (or your production domain)
   * **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Check the terms agreement and click **Save**.

### Step 2: Configure the Redirect URI (CRITICAL)
1. In your app's dashboard page, click **Settings** (top right).
2. Under **Redirect URIs**, click **Add URI**.
3. Add the exact redirect URI for your environment:
   * **Local Development**:
     ```
     http://127.0.0.1:5173/
     ```
   * **Production** (if deploying):
     ```
     https://your-production-domain.com/
     ```
4. Click **Save** at the bottom of the Settings page.

> [!IMPORTANT]
> The redirect URI in Spotify Developer Dashboard must match your browser URL character-for-character (including the trailing slash `/`). If mismatched, Spotify will reject the login with `INVALID_REDIRECT_URI`.

### Step 3: Copy Your Client ID
1. On the **Basic Information** tab of your Spotify App, locate the **Client ID**.
2. Copy this string.
3. Paste it into your `.env` file:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
   ```

---

## 3. How the PKCE Authorization Works

```
1. MOODIFY (Browser)
   │
   ├─► Generates high-entropy random string: `code_verifier` (64 chars)
   ├─► Calculates SHA-256 hash & base64url encodes: `code_challenge`
   ├─► Generates CSRF prevention token: `state`
   │
   ▼
2. Redirect to Spotify Authorization:
   https://accounts.spotify.com/authorize?
     client_id=...&
     response_type=code&
     redirect_uri=http://127.0.0.1:5173/&
     code_challenge_method=S256&
     code_challenge=...&
     state=...&
     scope=playlist-read-private playlist-read-collaborative user-library-read user-read-private user-read-email
   │
   ▼
3. User approves on Spotify Login Page
   │
   ▼
4. Redirect back to MOODIFY:
   http://127.0.0.1:5173/?code=...&state=...
   │
   ├─► Validates `state` against session storage (CSRF protection)
   ├─► POST to https://accounts.spotify.com/api/token
   │     body: grant_type=authorization_code, code=..., code_verifier=..., client_id=...
   │
   ▼
5. Receives `access_token` and `refresh_token`
   │
   └─► Ready to import playlists & search tracks without exposing any secrets!
```

---

## 4. Required Spotify Scopes

MOODIFY requests the following read-only scopes:
* `playlist-read-private`: Reads user's personal private playlists for import into "My Universe".
* `playlist-read-collaborative`: Reads collaborative playlists.
* `user-library-read`: Reads saved tracks for library organization.
* `user-read-private`: Validates user account status.
* `user-read-email`: Associates user identity safely.

MOODIFY does **not** request write permissions or playback control permissions unless explicitly needed.

---

## 5. Spotify Developer Mode Restrictions

When an app is created in the Spotify Developer Dashboard, it starts in **Development Mode**:
* Only user accounts explicitly added in **Settings** → **Users and Access** can authorize with the application.
* Add your personal Spotify email under **Users and Access** to test the integration.
* For public use by anyone, Spotify requires an App Extension request.

---

## 6. Spotify Developer Policy & Compliance Rules

In accordance with Spotify's February 2026 Developer Policy:
1. **No Algorithmic Derivation**: MOODIFY does not calculate Euclidean distances or derive recommendation algorithms from Spotify audio features.
2. **Zero Spotify Data to AI**: Spotify metadata, track names, lyrics, and artwork are air-gapped from external AI/ML models.
3. **Zero Audio Extraction**: Spotify audio streams are never connected to the Web Audio `AnalyserNode`.
4. **Playback Restrictions**: Full song streaming on web requires an active Spotify Premium subscription; MOODIFY directs users to official playback methods.
