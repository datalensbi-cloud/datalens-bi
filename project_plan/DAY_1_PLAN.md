# Day 1 — Build Plan (Brief)

**Goal:** Live URL where you can sign up, log in, get redirected to a (placeholder) dashboard, and log out. Auth + protected routes + first Vercel deploy working end-to-end.

**Estimated time:** 4–6 hours of focused work.

---

## What I need from you BEFORE we write code

| # | Action | Time | Why |
| - | ------ | ---- | --- |
| 1 | Create **Supabase** account → new project named `datalens-bi` | 5 min | We need DB + Auth from minute 1 |
| 2 | Copy **Project URL** + **anon public key** from Settings → API | 1 min | Goes into `.env.local` |
| 3 | Pick a Supabase region | 1 min | Mumbai (ap-south-1) if you're in India, else nearest |
| 4 | Save the **DB password** somewhere safe | 1 min | Needed if we ever connect from outside the dashboard |
| 5 | Create empty **GitHub** repo `datalens-bi` (private) | 2 min | Don't initialize with README — I'll push first commit |
| 6 | Sign up at **Vercel** with your GitHub | 2 min | For deployment |

**Reply with the Supabase URL + anon key** (or paste them into a `.env.local` file in the project root yourself — I'll use them from there).

---

## Build sequence (8 steps)

### Step 1 — Scaffold the Vite project (~10 min)
- `npm create vite@latest . -- --template react-ts`
- Install Tailwind, PostCSS, autoprefixer
- Configure `tailwind.config.js` + `postcss.config.js` + `index.css`
- Add Prettier + ESLint config (project conventions)
- **You won't see anything visual yet — just a working `npm run dev`**

### Step 2 — Folder structure & path aliases (~10 min)
```
src/
  app/         → routes, root layout
  features/    → auth/, dashboard/ (more added per phase)
  components/
    ui/        → shadcn primitives go here
  lib/         → supabase client, utils
  hooks/
  types/
```
- Set `@/` path alias in `vite.config.ts` and `tsconfig.json`

### Step 3 — Install shadcn/ui base (~10 min)
- `npx shadcn@latest init` (default config)
- Add: `button`, `input`, `label`, `card`, `form`, `sonner` (toast)
- These get copied into `src/components/ui/` — fully editable, no version locking

### Step 4 — Wire up Supabase (~15 min)
- Install `@supabase/supabase-js`
- Create `src/lib/supabase.ts` — typed client
- Create `.env.local` (gitignored) with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Add `.env.example` for documentation
- Create `src/types/supabase.ts` (auto-gen later when we have tables)

### Step 5 — Database schema (~15 min)
- Migration: `profiles` table linked to `auth.users`
- RLS policies: users can read/update only their own profile
- Trigger: auto-create profile row on signup
- Apply via Supabase SQL editor (I'll give you the SQL to paste)

### Step 6 — Auth pages & flow (~60 min)
- `/login` — email/password form with validation (react-hook-form + zod)
- `/signup` — same form + name field, sends confirmation email
- `/auth/callback` — handles email confirmation redirect
- AuthProvider context — wraps app, exposes `{ user, session, loading, signOut }`
- ProtectedRoute wrapper — redirects to `/login` if no session
- `/dashboard` — placeholder page with "Hello {email}" and logout button

### Step 7 — Routing & root layout (~20 min)
- React Router setup with `createBrowserRouter`
- Root layout: handles auth loading state, redirects, error boundary
- Public routes: `/`, `/login`, `/signup`
- Protected routes: `/dashboard/*`

### Step 8 — GitHub + Vercel deploy (~20 min)
- `git init`, first commit with conventional message
- Push to GitHub
- Connect Vercel to GitHub repo → auto-detect Vite
- Add env vars in Vercel dashboard (URL + anon key)
- First production deploy
- Update Supabase Auth → add Vercel URL to allowed redirect URLs
- Smoke test: signup → email confirm → login → see dashboard → logout, on the live URL

---

## Decision points — guide me here

> **Decision 1: Email auth method**
>
> - **(A) Email + password** — simplest, no extra setup. Recommended for Day 1. You can layer Google OAuth in Phase 4.
> - **(B) Magic link (passwordless)** — slicker UX, no password reset flow needed, but requires email config from Day 1.
> - **(C) Both** — adds complexity to Day 1.
>
> *My pick: (A). What do you want?*

> **Decision 2: Email confirmation**
>
> - **(A) Require email confirmation** — Supabase default. Safer, no junk signups, but adds a step.
> - **(B) Skip confirmation** — instant access on signup. Faster for early pilot users.
>
> *My pick: (B) for Days 1–28 (faster pilot testing), then flip to (A) at production launch on Day 29.*

> **Decision 3: Project naming**
>
> The plan calls the product **DataLens BI**. Do you want the package/repo named:
> - `datalens-bi` (matches the brand)
> - `datalens` (cleaner)
> - something else
>
> *My pick: `datalens-bi`. The `-bi` suffix avoids domain conflicts and reads clearly.*

> **Decision 4: Code style / linting strictness**
>
> - **(A) Strict TypeScript + ESLint + Prettier with auto-format on save** — recommended, catches bugs early.
> - **(B) Lenient (TypeScript on, ESLint default, no Prettier)** — less friction, more chaos later.
>
> *My pick: (A).*

---

## End-of-Day-1 deliverable checklist

- [ ] `npm run dev` works locally
- [ ] Can sign up with a new email
- [ ] Can log in with that email
- [ ] Protected `/dashboard` accessible only when logged in
- [ ] Logout works and clears session
- [ ] Live Vercel URL works the same way
- [ ] Repo pushed to GitHub with clean commit history
- [ ] `.env.local` is in `.gitignore` (no secrets committed)

---

## What I'll NOT do on Day 1 (deferred to Day 2)

- Visual polish / branding (Day 2 builds the app shell)
- Anything chart/data related
- Profile editing UI
- Password reset flow (handled by Supabase out-of-box, but we won't build a custom UI yet)
- Google/social OAuth (Phase 4)

---

## How to start

**Reply with:**
1. Your Supabase URL + anon key (or confirm `.env.local` is set up)
2. Your decisions on the 4 decision points above (just numbers: "1A, 2B, 3datalens-bi, 4A" works)
3. **"Go"**

I'll execute Step 1 → Step 8 sequentially, showing you a working state after each major step so you can course-correct if anything looks wrong.
