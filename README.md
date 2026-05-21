# RoadSoS — Emergency Response Web App

Life-saving emergency response platform built for hackathon demos. Mobile-first user hub + desktop admin analytics, powered by Supabase.

**Project root:** `D:\RoadSafety2`

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide React, Recharts
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Backend:** Supabase Auth, PostgreSQL, Realtime

## Quick Start

### 1. Install dependencies

```powershell
cd D:\RoadSafety2
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the entire [`supabase/schema.sql`](supabase/schema.sql) file
3. Go to **Authentication → Users → Add user** and create:
   - `demo-user@roadsos.demo` / `DemoUser123!`
   - `demo-admin@roadsos.demo` / `DemoAdmin123!`
4. Run in SQL Editor:

```sql
update public.profiles set role = 'admin', full_name = 'Test Admin'
  where email = 'demo-admin@roadsos.demo';
update public.profiles set full_name = 'Test User'
  where email = 'demo-user@roadsos.demo';
```

5. Copy **Project URL** and **anon key** from Settings → API

### 3. Environment variables

```powershell
copy .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```powershell
npm run dev
```

Open **http://localhost:5173**

### 5. Production build

```powershell
npm run build
npm run preview
```

## Judge Demo Script (60 seconds)

1. **Login** → **Test User** → Emergency Hub
2. GPS lock → **Simulate Crash Impact** → 10s countdown → cancel or dispatch
3. **First Aid** → expand **CPR** → 100 BPM metronome
4. **SOS** → red button (SMS with map link)
5. Sign out → **Test Admin** → KPIs, live feed, chart, **Download CSV**

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| User | demo-user@roadsos.demo | DemoUser123! |
| Admin | demo-admin@roadsos.demo | DemoAdmin123! |

## Deploy (Vercel / Netlify)

- Framework: **Vite**
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- SPA routing: `vercel.json` or `public/_redirects`
- Add production URL in Supabase Auth → URL Configuration

## License

MIT — Hackathon build
