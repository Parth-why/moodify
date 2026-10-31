# MOODIFY — Production Deployment Guide

> **Document Version:** 1.5.0  
> **Build Engine:** Vite 8 (Vanilla JS + CSS)  
> **Target Output:** Static Single Page Application (`dist/`)  

---

## 1. Overview

MOODIFY is built as an ultra-fast, zero-dependency static web application compiled into the `dist/` folder via Vite. 

It can be deployed to any modern static hosting platform (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or an Nginx/Docker container) with zero backend server maintenance required.

---

## 2. Production Environment Variables

Ensure the following environment variables are configured in your hosting provider's dashboard:

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous Supabase key | `eyJhbGciOiJIUzI1Ni...` |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer App Client ID | `4f9810a0...` |
| `VITE_SPOTIFY_REDIRECT_URI` | Production URL where users return after Spotify auth | `https://your-domain.com/` |

---

## 3. Deploying to Popular Platforms

### Option A: Vercel (Recommended)
1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
3. Import your `moodify` repository.
4. Build & Output Settings:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. In **Environment Variables**, add the 4 production variables listed above.
6. Click **Deploy**.

#### Client-Side Routing Configuration for Vercel:
Create `vercel.json` if needed for SPA fallback:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### Option B: Netlify
1. Go to [Netlify](https://www.netlify.com/) and select **Add new site** → **Import an existing project**.
2. Connect your GitHub repository.
3. Configure build settings:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
4. Add your environment variables under **Site configuration** → **Environment variables**.
5. Create a `_redirects` file in `public/_redirects`:
   ```
   /*    /index.html   200
   ```
6. Click **Deploy site**.

---

### Option C: Cloudflare Pages
1. Go to Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**.
2. Connect your GitHub repo.
3. Framework preset: **Vite**.
4. Build command: `npm run build`, output: `dist`.
5. Add environment variables and deploy.

---

## 4. Post-Deployment Authentication & Spotify Configuration

Once your production domain is active (e.g. `https://moodify-music.vercel.app/`):

### 1. Update Supabase Auth URL Configuration
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://your-domain.com/`
3. Under **Redirect URLs**, add: `https://your-domain.com/**`
4. Save changes.

### 2. Update Spotify Developer Dashboard
1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Select your App → **Settings**.
3. In **Redirect URIs**, add:
   ```
   https://your-domain.com/
   ```
4. Save changes.

---

## 5. Local Production Build Validation

Before deploying, always test the production bundle locally:
```bash
# 1. Run all unit tests
npm test

# 2. Build production assets
npm run build

# 3. Preview production build locally
npm run preview
```
Visit the preview URL (typically `http://localhost:4173/`) to verify everything behaves identically to development.
