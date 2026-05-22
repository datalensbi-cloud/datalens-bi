# Day 2 — Build Plan (Brief)

**Goal:** Replace the bare placeholder dashboard with a real app shell — top bar, left sidebar, dark mode, profile menu, polished empty states. This shell is the chassis we hang every Day 3-30 feature off, so it's worth getting right.

**Estimated time:** 3–5 hours of focused work.

**Nothing needed from you up-front** — no new accounts, no DB migrations, no env vars. All frontend.

---

## What "good" looks like at end of Day 2

A logged-in user sees:
- **Top bar** with logo on the left, profile dropdown on the right
- **Left sidebar** with five nav items: Files · Workspaces · Charts · Templates · Settings
- **Main content area** with a friendly empty state — "No files yet. Upload your first one to get started" (the actual upload feature lands Day 3, so the CTA is a placeholder)
- **Dark mode toggle** in the profile dropdown — switches instantly, remembers preference
- **Mobile-responsive** — sidebar collapses to a hamburger menu under 768px
- **Polished loading state** during auth check (skeleton, not "Loading…")
- **Polished 404 page** with a back-to-home link
- **Settings page** skeleton — just shows user name + email for now

---

## Build sequence (8 steps)

### Step 1 — Dark mode infrastructure (~20 min)
- Wire up `next-themes` (already in deps from shadcn install)
- Wrap app in `ThemeProvider` (defaults to system preference)
- Verify Tailwind `dark:` classes flip when toggled

### Step 2 — App shell layout component (~40 min)
- `src/app/AppLayout.tsx` — sidebar + top bar + outlet
- Responsive: sidebar fixed on desktop, sheet (drawer) on mobile
- Move `/dashboard` and other authed routes inside this layout

### Step 3 — Top bar (~30 min)
- Logo + product name on the left
- Profile dropdown on the right
- Hamburger button (mobile only) to open mobile sidebar

### Step 4 — Sidebar nav (~40 min)
- Five nav items with Lucide icons: Files, Workspaces, Charts, Templates, Settings
- Active route highlighted (uses `NavLink` from react-router)
- Each unbuilt feature routes to a placeholder page (see decision 1)

### Step 5 — Profile dropdown (~30 min)
- Avatar circle with auto-generated initials + deterministic color from email
- Dropdown menu: full name + email at top, "Settings" link, dark mode toggle, "Sign out"
- shadcn `dropdown-menu` component (will install)

### Step 6 — Placeholder pages (~30 min)
- `/files`, `/charts`, `/templates`, `/workspaces` — all show a "Coming Day N" empty state with phase + icon
- `/settings` — shows user info card (name, email, member since)
- `/dashboard` — shows the upload empty state CTA

### Step 7 — Polish: skeletons + 404 (~30 min)
- Replace "Loading…" text in `ProtectedRoute` with a proper skeleton matching the app shell shape
- 404 page: icon, "Page not found", "Back to dashboard" button
- AuthCallbackPage: replace text spinner with a proper centered spinner

### Step 8 — Smoke test, commit, push (~20 min)
- Test login → see app shell → click each nav item → see placeholder page
- Test dark mode → toggle works, persists on refresh
- Test mobile: resize browser to 375px, sidebar should collapse to hamburger
- Build clean, commit, push, Vercel auto-deploys
- Verify on live URL

---

## Decision points — guide me here

> **Decision 1 — Sidebar nav for unbuilt features**
>
> Most nav items (Files, Charts, Templates, Workspaces) ship in later days. How should they appear now?
> - **(A) Visible + clickable → "Coming Day N" placeholder page** — shows what's coming, builds anticipation. (Recommended)
> - **(B) Visible but disabled (greyed out) with tooltip** — clearer but feels broken
> - **(C) Hidden — only show nav items for features that exist** — cleanest now, but the nav suddenly growing later feels weird
>
> *My pick: (A). Sets expectations, lets you click around the shell.*

> **Decision 2 — Default sidebar state**
> - **(A) Desktop open + mobile drawer (hamburger)** — standard SaaS pattern. (Recommended)
> - **(B) Collapsed-by-default with icon-only mode + tooltip** — saves space, more "pro" feel (think Linear/Slack), more complex to build
>
> *My pick: (A). We can upgrade to icon-collapsed in Day 18 polish if needed.*

> **Decision 3 — Avatar style**
> - **(A) Auto-generated initials + deterministic color from email** — works for everyone, no upload needed. (Recommended)
> - **(B) Gravatar fallback** — works if user has one, blank otherwise. Adds external dependency.
> - **(C) Plain icon (no personalization)** — boring but neutral
>
> *My pick: (A). Real avatar upload lands Day 17 (workspace settings).*

> **Decision 4 — Dark mode default**
> - **(A) Follow system preference** (Recommended)
> - **(B) Default light, user can opt in**
> - **(C) Default dark, user can opt in**
>
> *My pick: (A). Respects OS setting, doesn't surprise the user.*

> **Decision 5 — Toast position**
>
> We currently have `top-center` from Day 1.
> - **(A) Keep top-center** — visible, slight modal-block feeling
> - **(B) Move to bottom-right** — more app-native pattern (Recommended)
> - **(C) Top-right** — middle ground
>
> *My pick: (B). Bottom-right is the SaaS standard for non-blocking notifications.*

---

## Worth discussing — innovation candidates (you decide IN or OUT)

These are small touches that could go in Day 2 or land later. Tell me which (if any) you want to add — or skip all of them and we stay strictly on plan.

### 1. ⭐ Online/offline indicator next to logo
Small green/red dot near the product name that says "connected to Supabase" or "offline". Real-time websocket ping. Small touch, big confidence signal for analysts who care about data freshness.
**Cost:** +30 min · **Value:** Trust signal · **Risk:** Low

### 2. ⭐ "Try our sample dataset" CTA in empty state
On `/dashboard` empty state, alongside the upload CTA, add a "Don't have a CSV? Try our Northwind sample data →" button. Loads a built-in CSV. Lets users feel the app without needing their own data. (Onboarding feature normally ships Day 26 — bringing forward to Day 2 is cheap and dramatically lowers the time-to-first-chart.)
**Cost:** +45 min · **Value:** HIGH — first-impression conversion · **Risk:** Adds a 200 KB CSV to `public/`

### 3. Recently viewed list in sidebar (placeholder for now)
A "Recent" section below the main nav showing recently viewed charts/files. Empty for now, fills in as user works. Linear-like.
**Cost:** +20 min for the empty version · **Value:** Medium · **Risk:** Low

### 4. Keyboard shortcut hint footer
Subtle "Press ⌘K to search" in bottom-left of sidebar. The actual Cmd+K palette ships Day 26 — this is just the hint. Sets expectation.
**Cost:** +5 min · **Value:** Low for now · **Risk:** None

### 5. Breadcrumbs in top bar
"Dashboard > Charts > New chart" trail. Adds spatial orientation as the app grows.
**Cost:** +20 min · **Value:** Increases as we add depth · **Risk:** None

### 6. Page transition animation (fade between routes)
Subtle 150ms fade when navigating. Small thing, premium feel.
**Cost:** +15 min · **Value:** Low but noticeable · **Risk:** None

### 7. Workspace switcher placeholder in top bar
Dropdown showing "Personal workspace" with a chevron. Doesn't do anything yet — workspaces ship Day 17. Sets the pattern early.
**Cost:** +15 min · **Value:** Low · **Risk:** Confusing if it doesn't work

---

## What I'll NOT do on Day 2 (deferred)

- File upload UI → Day 3
- Real workspace functionality → Day 17
- Real chart creation → Days 4-7
- Real-time collaboration indicators → post-launch
- Cmd+K command palette → Day 26
- Mobile-app-style bottom nav → not in plan (desktop-first)
- Animations beyond simple transitions → not Day 2
- Accessibility deep dive → spot-check now, audit on Day 27

---

## End-of-Day-2 deliverable checklist

- [ ] App shell renders on every authed route (sidebar + top bar + content)
- [ ] All 5 sidebar nav items work (real or placeholder)
- [ ] Dark mode toggle works AND persists on refresh AND on production URL
- [ ] Mobile view (375px width) — sidebar collapses to hamburger, all nav still reachable
- [ ] Profile dropdown shows name + email + sign out + dark mode + settings link
- [ ] Avatar shows correct initials + color for the logged-in user
- [ ] 404 page polished
- [ ] Empty state on dashboard says "No files yet — upload your first" with CTA button (button does nothing yet — Day 3 wires it up)
- [ ] No console errors on any route
- [ ] Live Vercel deploy works
- [ ] No regression in Day 1 features (signup, login, magic link, sign out, session persistence)

---

## How to start

**Reply with:**
1. Decisions on the 5 decision points (e.g. "1A, 2A, 3A, 4A, 5B")
2. Which (if any) innovation candidates you want IN for Day 2 — list numbers (e.g. "1, 2, 5") or "none, stick to plan"
3. Any new ideas from your side — what would make the app shell feel uniquely *DataLens* and not generic SaaS?
4. **"Go"**

I'll then execute Steps 1-8 sequentially, pausing at major milestones for you to course-correct.
