# Citadel – Setup Guide (Next.js + Supabase + Steam)

You already gave me the keys. Follow these steps on **your own computer**.

## 1. Download / Open the project

The project folder is `citadel-app`.

## 2. Install dependencies

Open a terminal inside the `citadel-app` folder and run:

```bash
npm install
npm install @supabase/supabase-js next-auth@beta
```

## 3. Environment variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

The keys are already filled in from what you sent me.  
**Change** `NEXTAUTH_SECRET` to any long random string (you can generate one at https://generate-secret.vercel.app/32).

## 4. Create the database tables

1. Go to your Supabase dashboard → **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy everything and paste it into the SQL Editor
4. Click **Run**

This creates the `profiles`, `matches`, and `xp_events` tables.

## 5. Run the app locally

```bash
npm run dev
```

Open http://localhost:3000

## Current Status of Features

- [x] Project structure
- [x] Supabase client + schema
- [ ] Steam login (next priority)
- [ ] Automatic Steam name as display name
- [ ] Rank badge system (Statlocker / Tracklock best-effort)
- [ ] XP Match Finder
- [ ] Ladder

I will continue building the Steam login and rank system next.
