<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GameMind V2

## Local setup

### Prerequisites
- Node.js 18+
- A Supabase project (for authenticated cloud sync)

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Create `.env.local`:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> `GEMINI_API_KEY` is only required if you enable Gemini-powered features in your own extension/integration. Core session logging/auth flow does not require it.

### 3) Database setup (Supabase SQL)
Run SQL files in Supabase SQL Editor in this order:
1. Core schema/tables file(s) that create `profiles` and `sessions`
2. Any migration SQL that adds progression fields (for example `level`, `current_xp`, `unlocked_rewards`)
3. RLS policy SQL (including `SELECT`, `INSERT`, `UPDATE`, and `DELETE` for `sessions`)

If you apply new migrations while the app is live, refresh the Supabase schema cache (see troubleshooting for `PGRST204`).

### 4) Run app
```bash
npm run dev
```

## Guest mode
Guest mode is available when no authenticated Supabase session is active.

### What works
- Local app usage and session tracking UI
- Local profile state for the current browser

### Limitations
- No cloud sync or multi-device persistence
- No authenticated Supabase profile/session storage
- Data may be lost if local browser storage is cleared

## Troubleshooting

### Missing env vars / startup errors
If you see a Supabase configuration error, verify:
- `VITE_SUPABASE_URL` is set
- `VITE_SUPABASE_ANON_KEY` is set
- You restarted `npm run dev` after editing `.env.local`

### RLS delete policy gaps
If "Clear data" appears to do nothing, your `sessions` table likely lacks a `DELETE` RLS policy for authenticated users. Add/repair the delete policy in Supabase.

### `PGRST204` stale schema cache
`PGRST204` usually means PostgREST still has old schema metadata. After running migrations:
- Refresh schema cache / restart API in Supabase dashboard
- Retry request after cache refresh
