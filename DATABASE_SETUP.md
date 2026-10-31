# MOODIFY — Database Setup Guide (Supabase PostgreSQL)

> **Document Version:** 1.5.0  
> **Target Engine:** Supabase PostgreSQL 15+  
> **Security Protocol:** Strict Row Level Security (RLS) & Multi-Tenant Isolation  

---

## 1. Overview

MOODIFY V1.5 uses **Supabase** for relational data persistence and user authentication. 

All tables are protected by PostgreSQL **Row Level Security (RLS)**, ensuring a user can never inspect, modify, or delete another user's personal music library, custom moods, or settings.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Create a Supabase Project
1. Navigate to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project**.
3. Choose an organization, enter **Moodify** as the project name, set a secure database password, and select your preferred region.
4. Click **Create new project** and wait ~2 minutes for provisioning to complete.

### Step 2: Retrieve API Credentials
1. In your Supabase Project Dashboard, go to **Project Settings** (gear icon) → **API**.
2. Copy the following values:
   * **Project URL**: `https://<your-project-id>.supabase.co`
   * **Project API keys** → `anon` `public`: `eyJhbGciOi...`
3. Paste them into your local `.env` file:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

> [!CAUTION]
> **NEVER USE THE `service_role` KEY IN FRONTEND CODE!**  
> The `service_role` key bypasses all Row Level Security policies. MOODIFY strictly forbids the `service_role` key in client-side code and includes automated security checks that throw fatal exceptions if detected.

---

## 3. Applying Database Migrations

### Method A: Supabase SQL Editor (Recommended)
1. In the Supabase Dashboard, open the **SQL Editor** from the left navigation bar.
2. Click **New Query**.
3. Open [`supabase/migrations/20261031000000_v1_5_initial_schema.sql`](./supabase/migrations/20261031000000_v1_5_initial_schema.sql) in your code editor.
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.
5. Ensure the query completes with `Success. No rows returned`.

### Method B: Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase link --project-ref <your-project-id>
supabase db push
```

---

## 4. Database Schema Breakdown (9 Tables)

| Table | Purpose | Security & RLS Policy |
|---|---|---|
| `public.profiles` | User profile details (username, display name, avatar, bio). Cascades from `auth.users`. | Users can select, insert, update, and delete only their own profile (`auth.uid() = id`). |
| `public.spotify_connections` | Records Spotify connection status and public user ID. *(Tokens are NEVER stored in public tables).* | Restricted strictly to the authenticated account owner (`auth.uid() = user_id`). |
| `public.tracks` | User's personal music library tracks with duration, external links, and custom notes. | Accessible and modifiable only by the owner (`auth.uid() = user_id`). Unique per `(user_id, provider, provider_track_id)`. |
| `public.imported_playlists` | User-imported Spotify playlist records with track counts and import status. | Isolated to owner (`auth.uid() = user_id`). |
| `public.playlist_track_sources` | Junction table associating tracks with one or multiple source playlists. | Isolated to owner (`auth.uid() = user_id`). |
| `public.moods` | 12 default system moods + user custom moods with custom colors and categories. | All authenticated users can read default moods (`is_default = true`). Custom moods are read/write strictly by creator (`auth.uid() = user_id`). |
| `public.track_moods` | Multi-mood tag assignments linking tracks to moods (`track_id` <-> `mood_id`). | Owner access only (`auth.uid() = user_id`). Unique per `(track_id, mood_id)`. |
| `public.user_settings` | User theme, privacy configuration, and discovery preferences JSON. | Owner access only (`auth.uid() = user_id`). |
| `public.import_jobs` | Async tracking for batch playlist imports with progress counters and errors. | Owner access only (`auth.uid() = user_id`). |

---

## 5. Automated Database Triggers

The schema automatically sets up two key triggers:
1. **`on_auth_user_created`**:  
   Listens on `auth.users` insertions. When a user registers via email/password, it automatically provisions an entry in `public.profiles` and `public.user_settings` with default values.
2. **`set_updated_at`**:  
   Automatically updates the `updated_at` timestamp on `profiles`, `spotify_connections`, and `user_settings` whenever a row is modified.

---

## 6. Verifying RLS & Database Functionality

Run the following test query in the Supabase SQL Editor to verify default system moods have seeded properly:
```sql
SELECT id, name, category, color, is_default 
FROM public.moods 
WHERE is_default = true 
ORDER BY name ASC;
```
You should see all 12 core moods (*Chill, Confident, Cheerful, Dreamy, Energetic, Happy, Lonely, Melancholic, Nostalgic, Party, Romantic, Surprised*).

---

## 7. Troubleshooting

* **Issue: "PGRST301: JWT expired"**:  
  Ensure your client has automatic session refresh enabled (MOODIFY's `supabaseClient.js` enables this by default).
* **Issue: "Failed to fetch"**:  
  Check if your browser has adblockers blocking requests to `*.supabase.co` or verify `VITE_SUPABASE_URL` in `.env`.
* **Issue: Running offline without Supabase**:  
  MOODIFY automatically detects if credentials are blank or placeholders and runs seamlessly in local standalone demo mode using namespaced local storage.
