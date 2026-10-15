# FITFLOW — Gym & Fitness Platform (frontend demo)

A multi-page fitness product built **frontend only**: public website, demo auth, onboarding,
personal dashboard (tasks, workouts, nutrition, progress) and a separate gym-management demo area.
There is **no backend**. All data lives in the browser's `localStorage`.

> "FITFLOW" is a working brand name. Change it in `src/lib/brand.ts`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

Requires Node 18.18+ (tested on Node 24).

## Demo login

- **One click:** "Explore Demo" on `/sign-in` (or visit `/sign-in?demo=1`) creates and signs in to a demo account with several weeks of sample data.
- **Credentials:** `demo@fitflow.app` / `demo1234`. These work after the demo account has been opened once in that browser.
- **Fresh account:** sign up at `/sign-up`. You'll go through onboarding and start with real empty states plus a starter plan built from your answers.

## Routes

| Public | App (signed in) | Gym demo |
|---|---|---|
| `/` | `/onboarding` | `/dashboard/gym` (overview) |
| `/features` | `/dashboard` | `/dashboard/gym/members` |
| `/workouts` | `/dashboard/tasks` | `/dashboard/gym/memberships` |
| `/nutrition` | `/dashboard/workouts` (planner, routines, history) | `/dashboard/gym/attendance` |
| `/about` | `/dashboard/workouts/active` (workout mode) | `/dashboard/gym/trainers` |
| `/contact` | `/dashboard/exercises` | `/dashboard/gym/classes` |
| `/sign-in`, `/sign-up`, `/forgot-password` | `/dashboard/nutrition` | |
| `/privacy`, `/terms` (placeholders) | `/dashboard/progress`, `/dashboard/profile`, `/dashboard/settings` | |

## Tech stack

Next.js 15.5 (App Router) · React 19.1 · TypeScript · Tailwind CSS v4 · Radix UI primitives with shadcn-style components in `src/components/ui` · Lucide icons · Recharts 3 · React Hook Form + Zod · date-fns · sonner (toasts).

`next.config.ts` sets `images.unoptimized` because all photos are bundled locally, so the server-side image optimizer isn't needed.
`package.json` overrides `postcss` to a patched version.

## Project structure

```
src/
  app/                 routes: (marketing), (auth), onboarding, dashboard/**
  components/ui/       design-system primitives (button, dialog, field, tabs…)
  components/…         feature components (marketing, dashboard, workouts, nutrition, progress, gym)
  lib/types.ts         domain model: the contract a backend should satisfy
  lib/data/            mock data: exercises, routines, meals, demo user seed, gym seed
  lib/actions.ts       pure state transitions for user data   (data, input) => data
  lib/gym-actions.ts   pure state transitions for gym data
  lib/calculations.ts  pure business logic: totals, streaks, goal progress, statuses
  lib/schemas.ts       Zod form schemas
  lib/storage.ts       SSR-safe localStorage wrapper with validation
  lib/auth.ts          DEMO-ONLY auth (hashed passwords, local sessions)
  lib/store/           React context that hydrates, persists and exposes state
```

## How persistence works

- Keys are namespaced `fitflow:*`: `accounts`, `session`, `theme`, `contact-messages`, `user:<id>` and `gym:<id>`.
- The store hydrates **after mount** to avoid SSR/hydration mismatches. Protected pages show skeletons until then.
- Stored data is validated (shape and version). Missing or corrupt data falls back to fresh seed data.
- "Remember me" stores the session in `localStorage`; otherwise it uses `sessionStorage`.
- Changes sync across open tabs through the `storage` event.
- Settings → **Export JSON** downloads your data. **Reset demo data** reseeds the account. **Delete account** removes it.

## Simulated features (clearly labelled in the UI)

- Authentication: local only, not secure. Passwords are salted and SHA-256 hashed, never stored in plaintext.
- Password reset: no email is sent.
- Contact form: saved locally, not sent.
- Notifications: the toggles only store a preference.
- Gym payments and renewals: demo records only, nothing is charged.
- Check-in/out and QR code: no hardware or QR verification.
- Member / Trainer / Admin role switcher: UI only, not authorization.
- All people, members, trainers and figures are fictional. Nutrition values are approximate.

## Known limitations

- Data is per-browser and per-device. Clearing site data erases it.
- Route protection is client-side UX only.
- Workout timers run while the tab is open. A reload during an active workout discards it (the browser warns first).
- Recurring tasks are modelled as daily habits, not repeating task rules.
- Target-weight goals are entered in kg.
- No automated test suite is committed. QA was done with an external Playwright script (see the "Quality checks" section).

## Suggested backend integration (next phase)

1. **Auth:** replace `src/lib/auth.ts` with a real provider (e.g. Supabase Auth, Auth.js or Clerk). Enforce route protection in middleware or server components.
2. **Database:** map `src/lib/types.ts` to tables: users/profiles, settings, tasks, habits, habit_logs, routines (+ routine_exercises), scheduled_workouts, workout_sessions, meals, water_logs, weights, measurements, personal_bests, goals, activity. Gym side: plans, members, payments, attendance, trainers, classes, bookings, with per-gym tenancy.
3. **Data layer:** each function in `actions.ts` / `gym-actions.ts` becomes one API mutation or server action. Swap `updateData`/`updateGym` in the store for TanStack Query (or similar) with optimistic updates. Keep `calculations.ts` shared.
4. **Real roles:** server-side RBAC (member/trainer/admin) replaces the demo role switcher.
5. **Integrations:** payments (e.g. Stripe), email/notifications, QR check-in. Each needs server-side verification.
6. **Content:** move exercises and the meal library to a CMS or DB. Add real exercise media.

## Quality checks performed

`npm run lint`, `npm run typecheck` and `npm run build` all pass. A Playwright run (38 checks) covered:

- signup validation, onboarding, sign-in/out and route protection
- task create/edit/complete/delete and persistence
- workout rest timer, pause/resume, and cancel vs. save
- meal totals and validation, progress with empty and populated data
- gym role gating and check-in, and the contact form

A route sweep at 320 / 768 / 1440 px found no horizontal overflow and no console errors.

## Credits

Photography from Unsplash. See `public/images/CREDITS.md`.
