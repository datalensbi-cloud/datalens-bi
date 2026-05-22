# Day 2 — Change Report

**Date completed:** 2026-05-22
**Goal:** Real app shell (sidebar + top bar + dark mode + responsive + polished empty states) replacing Day 1's bare placeholder.
**Status:** ✅ Shipped to production. All routes 200. Smoke-tested by Piyush.
**Commits:** `cc4248d` (build) → `<audit commit hash>` (audit fixes — see below)

---

## What shipped (high level)

A complete, generic-SaaS-quality app shell that every Day 3-30 feature now hangs off:

- Persistent sidebar (desktop) / hamburger drawer (mobile) navigation
- Sticky top bar with logo, connection indicator, profile dropdown
- Light / Dark / System theme toggle with instant switch + persistence
- Avatar with auto-generated initials and deterministic color per user
- Polished loading skeleton during auth bootstrap
- Reusable "Coming Day N" placeholder pages for the 4 unbuilt features
- Settings page with actual profile data
- Friendly dashboard empty state with disabled-until-Day-3 upload CTA
- Branded 404 page
- Subtle route fade transitions
- 3-state online/offline/degraded indicator with tooltip

---

## Files added (18 new)

### App shell (`src/app/`)

| File | Purpose |
| ---- | ------- |
| `ThemeProvider.tsx` | Wraps app in `next-themes` ThemeProvider, configures system-preference default |
| `AppLayout.tsx` | Composes Sidebar + TopBar + PageTransition + Outlet for protected routes |
| `TopBar.tsx` | Sticky top bar; renders hamburger (mobile only), logo (mobile only), online indicator, profile dropdown |
| `Sidebar.tsx` | Fixed left sidebar — visible only on lg+ screens |
| `SidebarNav.tsx` | Shared nav list used by both desktop Sidebar and mobile Sheet drawer |
| `ProfileDropdown.tsx` | Avatar button → dropdown with name/email, Settings link, Theme submenu, Sign out |
| `OnlineIndicator.tsx` | Three-state colored dot + tooltip showing Supabase connectivity |
| `PageTransition.tsx` | Re-keys outlet on pathname to retrigger Tailwind fade-in animation |
| `nav-items.ts` | Single source of truth for sidebar entries (icon, label, target, ships-on day) |

### Hooks (`src/hooks/`)

| File | Purpose |
| ---- | ------- |
| `useOnlineStatus.ts` | Combines `navigator.onLine` events with a periodic Supabase health ping, returns `online` / `degraded` / `offline` |
| `useAvatar.ts` | `getInitials()` + `getAvatarColorClass()` — pure functions, deterministic per email |

### Placeholder pages (`src/features/`)

| File | Purpose |
| ---- | ------- |
| `files/FilesPage.tsx` | "Coming Day 3" page listing upload features |
| `charts/ChartsPage.tsx` | "Coming Day 7" page listing chart builder features |
| `templates/TemplatesPage.tsx` | "Coming Day 20" page listing template features |
| `workspaces/WorkspacesPage.tsx` | "Coming Day 17" page listing workspace features |
| `settings/SettingsPage.tsx` | Real settings page — profile card with name, email, ID, member-since |

### Polish + utility components (`src/components/`)

| File | Purpose |
| ---- | ------- |
| `ComingSoonPage.tsx` | Reusable "Coming Day N" layout — icon + title + features list + badge |
| `AppShellSkeleton.tsx` | Loading-state skeleton shaped like the shell — replaces text "Loading…" during auth check |
| `NotFoundPage.tsx` | Branded 404 with Compass icon + two CTAs (Dashboard, Sign in) |
| `Spinner.tsx` | `<Spinner>` + `<FullPageSpinner>` reusable across the app |

---

## Files modified (6)

| File | What changed | Why |
| ---- | ------------ | --- |
| `src/main.tsx` | Wrapped `<App/>` in `<ThemeProvider>` | Day 2 dark mode |
| `src/App.tsx` | Moved `<Toaster>` position from `top-center` → `bottom-right` | Decision 5B — less obtrusive |
| `src/app/router.tsx` | Restructured: protected routes now nest inside `<AppLayout>`; added 5 new routes (files, charts, templates, workspaces, settings); 404 uses `<NotFoundPage>` | Shell wraps every authed page |
| `src/features/auth/ProtectedRoute.tsx` | Replaced text "Loading…" with `<AppShellSkeleton/>` | Better loading UX |
| `src/features/auth/AuthCallbackPage.tsx` | Replaced text spinner with `<FullPageSpinner label="Signing you in…"/>` | Consistent spinner pattern |
| `src/features/dashboard/DashboardPage.tsx` | Rewrote — removed its own header (now in shell), added personalized greeting + empty-state CTA card | Belongs inside shell now |

### Shadcn components added (7)

`dropdown-menu`, `sheet`, `separator`, `avatar`, `tooltip`, `skeleton`, `badge`

### Dependencies pulled in by shadcn

`@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-avatar`, `@radix-ui/react-separator`, `vaul` (Sheet base)

---

## Decisions implemented (from DAY_2_PLAN.md)

| # | Decision | Status |
| - | -------- | ------ |
| 1 | Nav items for unbuilt features → "Coming Day N" placeholder pages | ✅ |
| 2 | Sidebar: open on desktop, hamburger drawer on mobile | ✅ |
| 3 | Avatar: auto-generated initials + deterministic color | ✅ |
| 4 | Dark mode default: follow system preference | ✅ |
| 5 | Toast position: bottom-right (changed from top-center) | ✅ |

## Innovations implemented (3 of 7 candidates)

| # | Feature | Status |
| - | ------- | ------ |
| 1 | Online/offline indicator (3-state with tooltip) | ✅ — but see audit fix below |
| 3 | Recently viewed sidebar placeholder | ✅ — empty for now |
| 6 | Route fade transitions | ✅ — 200ms via tailwindcss-animate |

## Innovations deferred per your call

| # | Feature | Deferred to |
| - | ------- | ----------- |
| 2 | Sample dataset CTA in empty state | Day 26 (onboarding) |
| 4 | Keyboard shortcut hint footer | Not in plan |
| 5 | Breadcrumbs | Day 16 (multi-chart dashboards) |
| 7 | Workspace switcher placeholder | Day 17 (real workspaces ship) |

---

## 🔍 Audit findings

Per the daily wrap protocol, I re-read every Day 2 file and audited for bugs, dead code, accessibility issues, and risky patterns. Here's everything found.

### Fixed in audit pass

| # | Severity | File | Issue | Fix |
| - | -------- | ---- | ----- | --- |
| 1 | **HIGH** | `hooks/useOnlineStatus.ts` | `supabase.auth.getSession()` reads from localStorage, NOT the network — so the "degraded" state could never fire correctly. The whole point of the indicator (Innovation #1) was broken. | Changed ping to a real network call: HEAD request to `${SUPABASE_URL}/auth/v1/health`. Now correctly detects Supabase outages. |
| 2 | LOW | `features/dashboard/DashboardPage.tsx` | The "Upload your first file" button is `disabled` but also has an `onClick={() => navigate('/files')}` — dead code (disabled buttons can't fire onClick). | Removed the onClick. Button stays disabled until Day 3 enables it. |
| 3 | LOW | `app/ProfileDropdown.tsx` | `value={theme}` passes potentially `undefined` to `DropdownMenuRadioGroup` on first render (next-themes pattern). Functional but inconsistent. | Added explicit fallback: `value={theme ?? 'system'}`. |
| 4 | LOW | `app/TopBar.tsx` | Hamburger `aria-label="Open menu"` was static — even when the menu was open, screen readers still said "Open menu". | Made the aria-label reactive to the open state: "Open menu" / "Close menu". |

### Deferred (not changed, flagged here)

| # | Topic | Why deferred |
| - | ----- | ------------ |
| A | Bundle size warning (>500 KB raw, 211 KB gzipped) | Already planned for Day 27 (production hardening) — will introduce `React.lazy` route-level code splitting then. Not a bug today, just a perf warning. |
| B | Online indicator pings every 30s | At 30s × all active sessions, the bandwidth cost is minor — likely a few hundred bytes/session. Worth revisiting Day 27 if it becomes meaningful. Could move to longer interval (60-120s) or only ping after a real request fails. |
| C | Page transitions only animate IN, not OUT | Tailwind's `animate-in` is mount-only. True cross-fade requires `framer-motion` (≈50 KB) or React Transition Group. The current effect still feels nice and ships at zero extra bundle cost. Defer to post-launch if anyone notices. |
| D | ComingSoonPage has no in-page "back to dashboard" button | Users have the sidebar always visible; bottom CTA would be redundant noise. Reconsider if mobile feedback says users get stuck. |
| E | Recently viewed sidebar section is hardcoded empty | Will be wired on Day 6 (when first chart is saved). For now, the placeholder explanation is sufficient. |

### Things explicitly verified (no issues)

- Build is clean (1789 modules, no TS errors)
- Lint is clean (0 warnings, 0 errors)
- All 10 routes return HTTP 200 on production
- Dark mode CSS variables defined for every shadcn color used in Day 2 components
- Mobile viewport (375px) — sidebar properly collapses; drawer animates correctly
- Avatar deterministic hashing — verified same email always maps to same color
- Sign-out error handling — try/catch with user-friendly toast (added in Day 1 polish, retained)
- All `useEffect` cleanups in place (event listeners, intervals)
- No console errors observed on any route

---

## Metrics

| Metric | Day 1 | Day 2 | Δ |
| ------ | ----- | ----- | - |
| Files in `src/` | 24 | 42 | +18 |
| Production JS (gzipped) | 172 KB | 211 KB | +39 KB |
| Production CSS (gzipped) | 3.6 KB | 5.9 KB | +2.3 KB |
| Modules in build | 1678 | 1789 | +111 |
| Build time | 18 s | 6 s | -12 s (cache warm) |
| Lint warnings | 0 | 0 | – |
| Routes serving 200 | 4 | 10 | +6 |

---

## Commits in this day

| Commit | Description |
| ------ | ----------- |
| `11c8821` | Day 1 polish (lint cleanup, signOut error handling, signup edge cases) — landed between Day 1 wrap and Day 2 start |
| `cc4248d` | Day 2: app shell, navigation, dark mode, polished empty states |
| (audit)  | Day 2 audit: online indicator + dead code + a11y polish — separate commit, see commit message for breakdown |

---

## Sign-off

**Built and verified by:** Claude (build) + Piyush (smoke test)
**Production URL:** https://datalens-bi.vercel.app
**Next step:** Day 3 — file upload (CSV/XLSX → parse → store → preview)

When you're ready, say **"start Day 3"** and I'll draft the plan in the same DAY_N_PLAN.md format.
