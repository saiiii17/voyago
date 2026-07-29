# Voyago

Trip planning and item-based bill splitting for group trips. Upload a receipt
or enter it manually, assign who had what, and it splits the cost (and taxes,
tip, discounts) proportionally to what each person actually consumed — not an
even split across the whole group. Everything is scoped per-trip, dynamic
(any number of friends, any destination), and free to run.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS — deploys on Vercel's free tier
- Supabase — Postgres, Auth (email + password), Storage — free tier
- Groq (via the Vercel AI SDK) — free tier
  - `qwen/qwen3.6-27b` for receipt photo → structured item extraction
  - `llama-3.3-70b-versatile` for the trip-planning chatbot
- Frankfurter/Open-Meteo/exchangerate-api — free, no-key FX rates and weather

## One-time setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the entire contents of [`supabase/schema.sql`](supabase/schema.sql). This creates every table, the storage buckets, and RLS policies.
3. In **Authentication → Sign In / Providers → Email**, turn **off** "Confirm email." Sign-up is plain email + password with no confirmation email — Supabase's free-tier email sending is low-volume and shared across every project, so it's not used for auth at all here.
4. Grab your Project URL, `anon` public key, and `service_role` key from **Settings → API**.

### 2. Groq API key

Free at [console.groq.com/keys](https://console.groq.com/keys). Groq's model lineup changes — if `GROQ_VISION_MODEL`/`GROQ_CHAT_MODEL` env overrides aren't set, the app defaults to `qwen/qwen3.6-27b` (vision) and `llama-3.3-70b-versatile` (chat); check [console.groq.com/docs/models](https://console.groq.com/docs/models) if either stops working.

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from the steps above.

### 4. Install and run

```bash
npm install
npm run dev
```

### 5. Make yourself the master

Sign up once through the app (this creates your `profiles` row), then in the Supabase SQL editor:

```sql
update profiles set is_master = true where email = 'you@example.com';
```

The master account can see every trip in the app, regardless of who created it or whether they're a member. Everyone else only sees trips they created or were approved into.

## How it works

- **Create a trip** → pick a destination, name, and home currency. You become that trip's owner and its first member.
- **Invite friends** → share the trip's join link or QR code (trip overview page, owner/master view). A friend requests to join; the owner/master approves from the pending-requests panel. Only approved members can see that trip's data.
- **Add an expense** → scan a receipt photo (Groq reads it into an editable item list) or enter it manually. For each item, check off who shared it — the cost (and a proportional share of tax/tip/discount) is split only among the people who had it. For simple expenses like a taxi, use "split equally" instead.
- **Balances** → the overview page shows what each person paid, what they actually consumed, personal (non-split) costs, and a simplified settle-up list — plus the full itemized math behind every number, not just a final total.
- **Trip planning** → a places/itinerary list with cost estimates, a shared packing checklist, document storage for tickets/bookings, and a destination-aware chatbot for questions and price checks.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` in the Vercel project settings (Production + Preview). Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.
4. Update the Supabase Site URL (Authentication → URL Configuration) to match your deployed domain.
5. Deploy.

## Project structure

- `app/` — pages and API route handlers (App Router)
- `lib/split/` — the split calculation engine (pure functions, no I/O) — `calculate.ts` does one expense's item→person math, `balances.ts` aggregates across a trip, `settle.ts` simplifies debts into a minimal payment list
- `lib/supabase/` — browser/server/admin Supabase clients
- `lib/groq/` — receipt OCR and chatbot prompts
- `lib/auth.ts` / `lib/auth-page.ts` — role/access resolution (pure helpers vs. page-redirecting wrappers)
- `supabase/schema.sql` — full schema + RLS policies
- `components/trip/` — trip feature UI
