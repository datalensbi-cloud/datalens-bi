# DataLens BI — Tech Stack Technical Report

**Document purpose:** A complete reference of every tool, library, and service in the DataLens BI stack. For each entry: what role it plays, why we picked it, what we considered instead, and when we'd reconsider the choice.

**Audience:** You (Piyush), future contributors, future-me (Claude) on later sessions.

**Last updated:** 2026-05-22

---

## Table of contents

1. [Stack at a glance](#stack-at-a-glance)
2. [System architecture (text diagram)](#system-architecture)
3. [Frontend — Framework & Build](#frontend--framework--build)
4. [Frontend — Styling & UI](#frontend--styling--ui)
5. [Frontend — State Management](#frontend--state-management)
6. [Frontend — Routing](#frontend--routing)
7. [Frontend — Forms & Validation](#frontend--forms--validation)
8. [Data Visualization](#data-visualization)
9. [Data Parsing & Tables](#data-parsing--tables)
10. [Drag & Drop](#drag--drop)
11. [Exports — Excel & PDF](#exports--excel--pdf)
12. [Dashboard Layout](#dashboard-layout)
13. [Utilities](#utilities)
14. [Backend & Infrastructure](#backend--infrastructure)
15. [Hosting & Deployment](#hosting--deployment)
16. [Observability](#observability)
17. [Communication](#communication)
18. [Billing](#billing)
19. [Domain & Network](#domain--network)
20. [AI / ML Stack (Phase 3+)](#ai--ml-stack-phase-3)
21. [Dev Tooling](#dev-tooling)
22. [Cost breakdown](#cost-breakdown)
23. [Bundle size budget](#bundle-size-budget)
24. [Migration paths — what if we outgrow X?](#migration-paths)

---

## Stack at a glance

| Layer | Tool | Role |
| ----- | ---- | ---- |
| Build | Vite | Dev server + bundler |
| Language | TypeScript | Type safety |
| UI lib | React 18 | Components |
| Styling | TailwindCSS | Utility CSS |
| Components | shadcn/ui (on Radix) | Accessible primitives |
| Server state | TanStack Query | Cache, fetch, sync |
| Client state | Zustand | UI state |
| Routing | React Router v6 | Routes |
| Forms | react-hook-form + zod | Form state + validation |
| Charts | Apache ECharts | All visualizations |
| Tables | TanStack Table | Headless data tables |
| CSV parse | PapaParse | Browser CSV reading |
| Excel parse | SheetJS (xlsx) | Browser .xlsx reading |
| Drag-drop | @dnd-kit/core | Builder interactions |
| Excel export | ExcelJS | .xlsx generation |
| PDF export | jsPDF + html2canvas | Branded PDF reports |
| Dashboard grid | react-grid-layout | Multi-chart layout |
| Dates | date-fns | Date utilities |
| Backend | Supabase | DB + Auth + Storage + RLS |
| Vector DB | Supabase pgvector | Embedding storage (Phase 3) |
| Hosting | Vercel | Frontend + edge |
| Error tracking | Sentry | Production errors |
| Email | Resend | Transactional email |
| Billing | Stripe | Subscriptions |
| Domain | Cloudflare Registrar | Domain management |
| LLM | Anthropic Claude API | AI suggestions + narratives |
| Embeddings | OpenAI text-embedding-3-small | Schema fingerprinting |

---

## System architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite SPA)                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ ECharts     │  │ Pivot/Table │  │ Builder UI  │  │ Exports     │ │
│  │ (canvas)    │  │ (TanStack)  │  │ (dnd-kit)   │  │ (ExcelJS,   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  │  jsPDF)     │ │
│         │                │                │          └─────────────┘ │
│  ┌──────┴────────────────┴────────────────┴────────────────────────┐ │
│  │            TanStack Query (cache) + Zustand (UI state)         │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ HTTPS / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Vercel (CDN + static hosting + serverless functions)                │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Supabase         │       │ Stripe           │       │ Anthropic / OpenAI│
│ - Postgres + RLS │       │ - Checkout       │       │ - Claude (LLM)   │
│ - Auth (JWT)     │       │ - Webhooks       │       │ - Embeddings     │
│ - Storage (S3)   │       │ - Customer Portal│       │   (Phase 3)      │
│ - pgvector       │       └──────────────────┘       └──────────────────┘
│ - Edge Functions │
└──────────────────┘
        │
        ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Sentry           │       │ Resend           │       │ Cloudflare       │
│ - Error tracking │       │ - Email sending  │       │ - DNS + domain   │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## Frontend — Framework & Build

### React 18

**Role:** UI library. All components, state hooks, rendering.

**Why we picked it:**
- Largest ecosystem (libraries, hiring, AI assistance)
- React Server Components / Suspense / transitions cover any future SSR need
- Every charting/table library we use ships first-class React bindings

**Alternatives considered:**
- **Vue 3** — cleaner syntax, smaller bundle. But the BI ecosystem (ECharts wrappers, dnd-kit equivalents) is less mature for Vue, and AI tools generate better React.
- **Svelte / SvelteKit** — smaller runtime, very fast. But fewer mature components for our domain (no shadcn equivalent, weaker chart wrappers).
- **Solid.js** — best raw perf. Ecosystem still niche, hiring impossible.

**When to reconsider:** If runtime perf becomes a blocker (10k+ DOM nodes in a single view), look at Solid or move heavy paths to canvas. Both are years away for our scale.

---

### TypeScript

**Role:** Static type checking for JS. Catches bugs at compile time, makes refactoring safe.

**Why we picked it:**
- Catches the majority of nil-reference and shape-mismatch bugs before runtime
- IDE autocomplete on Supabase types, ECharts options, etc.
- Industry default — every library ships types

**Alternatives considered:**
- **Plain JS** — faster to write, slower to maintain. Not viable for a 30-day build with growing surface area.
- **Flow** — Facebook's alternative, abandoned-ish. Don't.

**When to reconsider:** Never. Strict TS pays for itself by Day 10.

---

### Vite

**Role:** Dev server (instant HMR) + production bundler (Rollup-based).

**Why we picked it:**
- Sub-second hot reload during dev — critical when iterating on chart configs
- Out-of-box TypeScript, JSX, CSS modules, env vars
- Production builds use Rollup → smaller bundles than CRA's webpack
- First-class plugin ecosystem

**Alternatives considered:**
- **Create React App (CRA)** — dead. Officially deprecated.
- **Next.js** — full framework with SSR, file routing, API routes. Overkill for an SPA-first app. We can add a Next.js marketing site later if needed.
- **Remix / TanStack Start** — SSR-focused frameworks. Same overkill argument. Adds deploy complexity.
- **Parcel** — zero-config but smaller ecosystem.
- **Rspack / Turbopack** — Webpack/Vite competitors written in Rust. Faster cold builds, less mature.

**When to reconsider:** If we need SSR for SEO on chart embed pages (Day 23), evaluate moving the marketing/embed routes to Next.js while keeping the app in Vite. Or use Vite SSR plugin.

---

## Frontend — Styling & UI

### TailwindCSS

**Role:** Utility-first CSS framework. Styling via `className="flex gap-2 p-4 rounded-lg"` instead of writing CSS files.

**Why we picked it:**
- No naming things — biggest CSS time-sink eliminated
- Design tokens (spacing, colors, fonts) enforced via config — visual consistency
- Tree-shaken — only used classes ship in prod CSS (final bundle: ~10 KB)
- Dark mode via `dark:` prefix
- shadcn/ui is built on it

**Alternatives considered:**
- **CSS Modules** — type-safe scoped CSS. More verbose, slower to iterate.
- **styled-components / Emotion** — runtime cost (CSS-in-JS), slower SSR.
- **Vanilla Extract** — type-safe, zero runtime. Great alternative but smaller ecosystem.
- **UnoCSS** — Tailwind-compatible but faster build. Less stable API.
- **Plain CSS + BEM** — full control, slow to ship.

**When to reconsider:** If team grows past 5 frontend devs and Tailwind class strings become unreadable, evaluate Vanilla Extract or moving heavy components to CSS Modules.

---

### shadcn/ui

**Role:** Component library. Provides accessible, themable building blocks (Button, Dialog, Select, Table, Toast, etc.) — but **copied into your repo**, not installed as a versioned dependency.

**Why we picked it:**
- Components live in `src/components/ui/` — you own them, you edit them
- Built on Radix UI primitives (best-in-class accessibility, keyboard nav, focus management)
- Styled with Tailwind — matches our system
- No version-lock hell when the library updates
- Looks professional out of the box

**Alternatives considered:**
- **MUI (Material UI)** — huge ecosystem but opinionated Material design (looks like Google products). Heavy runtime CSS-in-JS.
- **Chakra UI** — clean, accessible. CSS-in-JS runtime cost. Less momentum than shadcn in 2024+.
- **Ant Design** — feature-rich, very corporate look. Hard to escape its aesthetic.
- **Mantine** — great DX, big component set. Locked to its theming system.
- **Headless UI** — unstyled primitives from Tailwind team. Less complete than Radix.
- **Park UI** — newer Ark UI + Panda CSS combo. Promising but immature.

**When to reconsider:** Never likely for v1. shadcn's "copy-paste" model means we can selectively replace components if we outgrow them.

---

### Radix UI (transitive — under shadcn)

**Role:** Unstyled accessible primitives — handles dropdowns, dialogs, popovers, focus traps, ARIA attributes, keyboard navigation.

**Why we picked it:** It's what shadcn/ui wraps. World-class accessibility, used by Linear, Vercel, Shopify.

**Alternatives:** Headless UI, Reach UI (archived), React Aria from Adobe. Radix has the strongest community + Vercel/shadcn backing.

---

### Lucide React (icons)

**Role:** Icon set used by shadcn/ui (fork of Feather Icons, more icons, actively maintained).

**Why we picked it:** Bundled with shadcn install, tree-shakeable, 1000+ icons, consistent stroke style.

**Alternatives:** Heroicons (Tailwind team), Phosphor, Tabler, react-icons (mega-bundle of everything).

---

## Frontend — State Management

### TanStack Query (formerly React Query)

**Role:** Server state — fetching, caching, retries, optimistic updates, background refetch. The single source of truth for data that lives on the server (Supabase rows).

**Why we picked it:**
- Solves the hardest problem in React: keeping server data in sync with UI
- Built-in cache, stale-while-revalidate, mutation queues, optimistic UI
- Devtools panel for debugging cache state
- Works perfectly with Supabase

**Alternatives considered:**
- **SWR** — Vercel's lighter alternative. Equally good for simple cases, fewer features (mutations, prefetching, infinite queries are weaker).
- **Apollo Client** — GraphQL-focused. We're not using GraphQL.
- **Redux Toolkit Query** — fine if you're already on Redux. We're not, and won't be.
- **Roll-your-own with useEffect** — guaranteed bugs.

**When to reconsider:** Never for this kind of app.

---

### Zustand

**Role:** Client/UI state — things that live only in the browser (dark mode, modal open/closed, current builder selections, active workspace).

**Why we picked it:**
- 1 KB. Hooks-based. No providers, no boilerplate.
- Works with TypeScript naturally
- No "wrapping the whole app in a provider" ceremony
- Simple async actions, persist middleware for localStorage

**Alternatives considered:**
- **Redux Toolkit** — industry standard but verbose. Overkill for our scope.
- **Jotai** — atomic state model, very flexible. Slightly heavier mental model.
- **Recoil** — Facebook's atomic state. Maintenance status unclear.
- **Valtio** — proxy-based, very ergonomic. Smaller community than Zustand.
- **React Context only** — works for tiny state, performance cliff when many components consume it.

**When to reconsider:** If we ever need time-travel debugging or complex middleware (auth flows that touch many slices), look at Redux Toolkit.

---

## Frontend — Routing

### React Router v6

**Role:** Client-side routing — URL ↔ component mapping, nested routes, protected routes, redirects.

**Why we picked it:**
- The default, most documented choice
- Plays well with TanStack Query (loaders, actions)
- Strong TypeScript support in v6.4+ (data router APIs)

**Alternatives considered:**
- **TanStack Router** — newer, fully typed routing (type-safe URL params). Beautiful but immature, fewer tutorials, breaking changes still happening.
- **Wouter** — 2 KB minimal router. Great for tiny apps, lacks our needed features (nested layouts, loaders).
- **Next.js file-based router** — comes with Next.js. We're not using Next.

**When to reconsider:** TanStack Router becomes the obvious upgrade once it hits v2 stable. Migration story is straightforward.

---

## Frontend — Forms & Validation

### react-hook-form

**Role:** Form state management — handles inputs, errors, submission, dirty tracking with minimal re-renders.

**Why we picked it:**
- Uses uncontrolled inputs by default → fewer re-renders → forms stay snappy with 30+ fields
- First-class TypeScript
- Integrates with zod via `@hookform/resolvers/zod`

**Alternatives considered:**
- **Formik** — older industry standard. Slower (controlled inputs), heavier API.
- **TanStack Form** — same team as Query/Router. Promising, less mature.
- **React Final Form** — Redux-Form successor. Niche.
- **Roll-your-own with useState** — fine for 2-field forms, painful past that.

**When to reconsider:** TanStack Form when it hits v1 stable.

---

### zod

**Role:** Schema validation — define data shape, validate at runtime, derive TypeScript types from schema.

**Why we picked it:**
- Single source of truth: write schema once, get runtime validation AND TS types
- Excellent error messages
- Works for forms (with react-hook-form), API responses, env vars

**Alternatives considered:**
- **Yup** — older, used by Formik. Less TS-native.
- **Valibot** — newer, smaller bundle (5 KB vs zod's 13 KB), modular. Worth watching.
- **Joi** — server-focused (Hapi.js heritage). Heavy in browser.
- **ArkType** — TS-native syntax, fast. Newer, smaller community.

**When to reconsider:** Valibot if bundle size becomes a problem.

---

## Data Visualization

### Apache ECharts

**Role:** All charts — bar, line, pie, scatter, heatmap, treemap, sankey, KPI cards (custom), and 20+ more chart types.

**Why we picked it:**
- **Performance:** Canvas renderer handles 100k+ data points smoothly. SVG renderer for crisp small charts. WebGL plugin for millions of points.
- **Coverage:** Every chart type we'll ever want is built-in (vs Recharts which lacks heatmap, sankey, sunburst, etc.)
- **Used by:** Apache Superset, Grafana plugins, AntV-like ecosystems
- **Mature:** Backed by Apache Foundation, used in production by Baidu, Alibaba, etc.
- **Themes:** Easy to apply color palettes and brand colors
- **Interactivity:** Hover, click, brush selection, zoom, all built-in

**Alternatives considered:**
- **Recharts** — React-native API, easy to use. **Slow past 5k data points.** Limited chart types. Default choice for hobby projects, wrong for BI.
- **Chart.js + react-chartjs-2** — popular, canvas-based. Fewer chart types than ECharts, weaker theming.
- **Plotly.js** — scientific plotting, very capable. **Huge bundle** (~3 MB) — a non-starter for a web app.
- **Visx (Airbnb)** — D3-based primitives for React. Powerful but requires building each chart from scratch. Months of work to match ECharts.
- **D3.js directly** — ultimate flexibility, ultimate dev time. We need built-in charts, not a charting framework.
- **Nivo** — pretty default styles, ergonomic React API. Slower than ECharts on big datasets, fewer chart types.
- **AntV G2 / Charts** — Alibaba's equivalent. Less English documentation.
- **Highcharts** — commercial license required for commercial use. ECharts is Apache 2.0 (free).

**When to reconsider:** If we ever need 3D visualizations seriously, look at Plotly or Three.js. Unlikely for a BI tool.

---

## Data Parsing & Tables

### PapaParse

**Role:** Parse CSV files in the browser. Streaming, worker-mode, type detection.

**Why we picked it:**
- Battle-tested (millions of weekly downloads)
- Worker mode → doesn't freeze UI on big files
- Handles weird CSVs (quoted commas, embedded newlines, various encodings)
- Streaming → can process 100MB files chunk by chunk

**Alternatives considered:**
- **csv-parse** — Node-focused, works in browser but heavier
- **fast-csv** — Node-focused
- **Roll-your-own with `String.split(",")`** — breaks immediately on real-world CSVs

**When to reconsider:** Never. PapaParse is the answer.

---

### SheetJS (xlsx)

**Role:** Parse and (read) Excel `.xlsx` and `.xls` files in the browser.

**Why we picked it:**
- The only mature browser-side Excel parser
- Handles formulas (reads computed values), formatting, multi-sheet workbooks
- Reads Excel 97 .xls, Excel 2007+ .xlsx, ODS, Numbers

**Alternatives considered:**
- **ExcelJS** — we use this for *writing* Excel (better at it). Reading is weaker.
- **exceljs vs sheetjs for reading** — SheetJS handles weird/legacy files better.
- **Server-side parsing** — would require a backend service. Defeats our zero-backend goal.

**Note on licensing:** SheetJS community edition (CC-BY 4.0 attribution) is free. The Pro edition has more formats. Community is sufficient for v1.

**When to reconsider:** If Excel parsing becomes a perf bottleneck, move it to a Web Worker (which it supports) or a Supabase Edge Function.

---

### TanStack Table (formerly React Table)

**Role:** Headless table library — gives you sorting, filtering, pagination, virtualization logic, you supply the markup.

**Why we picked it:**
- Headless = full control over styling (works perfectly with Tailwind + shadcn)
- Virtualization (only renders visible rows) → smooth 100k-row tables
- TypeScript-first, derives column types from data
- Sort/filter/group built-in, no need to write them ourselves

**Alternatives considered:**
- **AG Grid** — most powerful data grid, used by enterprises. Community edition free. Heavy bundle (~500 KB). Look-and-feel hard to escape.
- **Material React Table** — built on TanStack Table + MUI. Pre-styled but couples us to MUI.
- **Roll-your-own** — fine for 100-row tables, dies past that.

**When to reconsider:** AG Grid if customers request features like in-cell editing, master/detail, range selection (Excel-like UX). Months 6+.

---

## Drag & Drop

### @dnd-kit/core

**Role:** Drag-drop for the chart builder (drag columns onto axis drop zones, reorder dashboard widgets).

**Why we picked it:**
- Modern, accessibility-first (keyboard support, screen reader announcements)
- Lightweight (~10 KB core)
- Works on touch + mouse + keyboard
- TypeScript-first
- Backed by a single maintainer with strong commitment

**Alternatives considered:**
- **react-dnd** — older, more complex API. Reliable but verbose.
- **react-beautiful-dnd** — Atlassian's library. Beautiful but **abandoned** (deprecated).
- **Sortable.js + react-sortable-hoc** — older patterns.
- **HTML5 native drag-drop** — broken on touch devices, no accessibility.

**When to reconsider:** If we need richer 2D constraints (Figma-style canvas), look at React Flow.

---

## Exports — Excel & PDF

### ExcelJS

**Role:** Generate `.xlsx` files in the browser with formulas, styling, conditional formatting, charts, multi-sheet workbooks.

**Why we picked it:**
- Only browser-capable lib that preserves number types (numbers stay sortable in Excel, not strings)
- Cell styling, conditional formatting, formulas
- Multi-sheet workbooks
- Embedded chart support (Phase 2)

**Alternatives considered:**
- **SheetJS write mode** — works but styling/formatting weaker than ExcelJS
- **xlsx-populate** — abandoned
- **Server-side libs** (python openpyxl, Node exceljs server-side) — requires backend

**When to reconsider:** If we add a Python backend for heavy processing (Phase 5+), `openpyxl` is more powerful for complex Excel features (pivot tables, named ranges).

---

### jsPDF + html2canvas

**Role:** Generate branded PDF reports — captures chart/pivot div as image, lays out on A4 with header/footer.

**Why we picked it:**
- Pure browser, no server needed
- jsPDF handles layout, html2canvas handles screenshotting
- Both mature, well-documented

**Alternatives considered:**
- **react-pdf** (`@react-pdf/renderer`) — declarative PDF layout in React components. Better for typography-heavy PDFs (think invoices) but no good story for embedding chart images.
- **pdfmake** — table-heavy PDFs, weaker on free-form layout.
- **Puppeteer (server-side)** — best output quality (real Chrome rendering). Requires backend (Supabase Edge Function, ~250 MB Chrome binary). Defer to Phase 5.
- **Browser print dialog (window.print)** — free but inconsistent across browsers, no programmatic control.

**When to reconsider:** If PDF quality complaints come in (charts not sharp, layout breaks), move to Puppeteer in a Supabase Edge Function. That's the "professional" path but adds infra.

---

## Dashboard Layout

### react-grid-layout

**Role:** Grid layout for multi-chart dashboards (Day 16) — drag widgets to reposition, resize handles, saved layouts.

**Why we picked it:**
- The standard for dashboard grids in React
- Used by Grafana clones, Apache Superset frontend
- Responsive breakpoints built-in
- Layout serializable to JSON (easy to save to DB)

**Alternatives considered:**
- **react-grid-system** — only layout, no drag
- **gridstack.js** — vanilla JS, has React bindings but less native
- **Roll-your-own with CSS Grid + dnd-kit** — possible but weeks of work

**When to reconsider:** If we want "free-form canvas" mode (Figma-like, not grid-constrained), look at React Flow or react-konva.

---

## Utilities

### date-fns

**Role:** Date parsing, formatting, arithmetic. Used for date filters, date grouping in pivots, KPI period-over-period.

**Why we picked it:**
- Functional, tree-shakeable (import only what you use → tiny bundle impact)
- Immutable (returns new Date, doesn't mutate)
- TypeScript-first

**Alternatives considered:**
- **Day.js** — Moment-like API, 2 KB. Also great. Slightly less tree-shakeable.
- **Moment.js** — deprecated. Don't.
- **Luxon** — by Moment.js creator. Powerful, slightly larger.
- **Native `Intl.DateTimeFormat`** — for formatting only. We need arithmetic too.

**When to reconsider:** Day.js if we want a smaller bundle with the same Moment-like API.

---

## Backend & Infrastructure

### Supabase

**Role:** Our entire backend in a single platform — Postgres database, Auth (email + OAuth + magic link), Storage (S3-compatible), Row-Level Security policies, Edge Functions, Realtime, pgvector for embeddings.

**Why we picked it:**
- **One auth model** across DB + storage + edge functions (RLS policies in SQL apply everywhere)
- **Postgres under the hood** — no proprietary lock-in. Can self-host or migrate to any Postgres host.
- **Storage tied to auth** — file access policies are SQL, not config files
- **pgvector built-in** — schema fingerprinting works without a separate vector DB
- **Edge Functions** (Deno) — when we need a small server-side function, no need to spin up a separate service
- **Generous free tier** — 500 MB DB, 1 GB storage, 50k MAU, enough for v1 + first 100 paid users
- **Realtime** — websockets for collaborative editing in Phase 5 (free, no extra infra)

**Alternatives considered:**
- **Firebase** — Google's BaaS. Firestore is NoSQL (worse for the analytical queries we'll write), lock-in is harder to escape.
- **Appwrite** — self-hostable Supabase alternative. Less mature, smaller community.
- **PocketBase** — single Go binary, SQLite. Brilliant for tiny apps. SQLite limits us on concurrent writes at scale.
- **Custom Node + Postgres** (Railway / Fly / Render) — most control. Days of setup we don't need on Day 1.
- **Neon / PlanetScale + Auth0 + S3 + Stripe** — best-of-breed each layer. 4 vendors, 4 bills, 4 auth integrations. Too much for v1.
- **AWS (RDS + Cognito + S3)** — production-grade but weeks of IAM/VPC setup.

**When to reconsider:**
- Database egress costs go nuts → move to Neon (cheaper egress) while keeping Supabase Auth + Storage.
- Need true multi-region → consider PlanetScale (MySQL, multi-region native) or Neon.
- Hit RLS perf walls on complex queries → write SQL views or move to a service layer.

**Lock-in risk:** Low. The DB is Postgres, files are S3-compatible. Auth is the stickiest layer but Supabase exports user data on request.

---

### Supabase pgvector (extension)

**Role:** Vector storage for schema fingerprinting (Day 19) — store OpenAI embeddings of column names, find nearest neighbors by cosine similarity.

**Why we picked it:**
- Already part of Supabase Postgres, no separate service
- Cosine + L2 distance functions built-in
- Can index with HNSW for fast nearest-neighbor search on millions of vectors

**Alternatives considered:**
- **Pinecone** — managed vector DB. Excellent but $70+/mo minimum. Overkill for ~1000 column embeddings per workspace.
- **Weaviate / Qdrant / Milvus** — open-source vector DBs. Require self-hosting or paid cloud tier.
- **Chroma** — embedded vector DB. Great for Python apps, fewer JS clients.
- **In-memory cosine similarity (no DB)** — fine for <10k vectors. We'll exceed that quickly across workspaces.

**When to reconsider:** If vector count exceeds 10M or vector search becomes slow despite indexing, evaluate Pinecone.

---

## Hosting & Deployment

### Vercel

**Role:** Frontend hosting (static + SPA fallback), edge network (CDN), preview deploys per PR, custom domain with auto SSL, serverless functions if needed.

**Why we picked it:**
- Zero-config deploys from GitHub (push to main → live in 30s)
- Preview deploys for every branch → instant QA URL for stakeholders
- Edge network → fast loads globally
- Generous free tier (100 GB bandwidth/mo), Pro starts at $20/mo
- First-class support for Vite, React, env vars, redirect rules
- Stripe / Sentry / Resend all have ready-made integrations

**Alternatives considered:**
- **Netlify** — Vercel's twin. Equally good. Vercel has slight edge on Vite support and AI tooling.
- **Cloudflare Pages** — cheapest at scale (free tier is massive), edge functions on Workers. Less polished DX than Vercel.
- **Railway / Fly.io / Render** — better for full-stack apps with custom servers. Overkill for SPA + Supabase.
- **AWS Amplify / Azure Static Web Apps** — corporate options. Painful UX.
- **GitHub Pages** — free but no env vars, no preview deploys, no edge functions.

**When to reconsider:** Bandwidth bill exceeds $200/mo → move to Cloudflare Pages (free at that scale).

---

## Observability

### Sentry

**Role:** Production error tracking — captures uncaught errors, stack traces, breadcrumbs, user info. Alerts on regressions.

**Why we picked it:**
- Industry standard, every engineer knows it
- Free tier: 5k errors/mo (enough for early stage)
- React error boundary integration
- Supabase Edge Function support
- Source map upload for readable stack traces

**Alternatives considered:**
- **LogRocket** — adds session replay (video of user's session). Powerful but $99+/mo.
- **Rollbar / Bugsnag** — solid alternatives, similar pricing.
- **OpenTelemetry + self-hosted** — vendor-neutral, complex setup.
- **PostHog** — analytics + session replay + error tracking. Worth considering as a combined tool.

**When to reconsider:** If user analytics becomes equally important, consider PostHog as a one-tool solution.

---

## Communication

### Resend

**Role:** Transactional email sending — workspace invites, Stripe receipts, password resets, weekly summary emails.

**Why we picked it:**
- Built by the team behind react-email (compose emails as React components)
- $0 free tier: 3k emails/mo, 100/day
- Beautiful DX, dashboard, webhooks
- Better deliverability than rolling our own SMTP

**Alternatives considered:**
- **SendGrid** — incumbent, ugly DX, complex pricing
- **Mailgun** — same generation as SendGrid, equally clunky
- **Postmark** — best deliverability, more expensive
- **AWS SES** — cheapest at scale, fiddly setup
- **Loops** — marketing + transactional combined, good but $49/mo minimum

**When to reconsider:** Volume exceeds 50k emails/mo → AWS SES is dramatically cheaper.

---

## Billing

### Stripe

**Role:** Subscription billing — Checkout pages (no PCI scope), webhook events for subscription lifecycle, Customer Portal for self-serve billing management, tax/VAT handling via Stripe Tax.

**Why we picked it:**
- Universal — every SaaS uses it, every customer trusts it
- Stripe Checkout → we never see card data → no PCI compliance
- Customer Portal → users manage cancellations/upgrades themselves → less support burden
- Stripe Tax → handles GST/VAT automatically (important in India)
- Webhook events are reliable and well-documented

**Alternatives considered:**
- **Paddle** — handles tax as Merchant of Record (you get a cleaner tax story globally). Higher fees (~5% vs Stripe's ~2.9%).
- **Lemon Squeezy** — Paddle alternative. Same MoR model. Newer.
- **Razorpay** — India-first. Good if we're India-only. Stripe now supports India natively (since 2024).
- **Chargebee / Recurly** — enterprise subscription management. Overkill until $100k+ MRR.

**When to reconsider:** If we go global and tax compliance becomes painful, Paddle/Lemon Squeezy save engineering time at the cost of higher fees.

---

## Domain & Network

### Cloudflare Registrar

**Role:** Domain name purchase and DNS management.

**Why we picked it:**
- Sells domains at cost (no markup) — `.com` for ~$10/yr vs $15-20 elsewhere
- DNS is fast and free
- Built-in DDoS protection
- Easy to enable Cloudflare CDN / Workers later

**Alternatives considered:**
- **Namecheap** — fine, $13-15/yr for `.com`. Slightly more polished UI.
- **GoDaddy** — avoid. Pushy upsells, worse pricing.
- **Google Domains** — sold to Squarespace, RIP.
- **Porkbun** — cheap, no-frills.

**Note:** You buy the domain at Cloudflare, point it to Vercel via DNS records. Cloudflare doesn't proxy traffic unless you flip the orange cloud on.

---

## AI / ML Stack (Phase 3+)

### Anthropic Claude API

**Role:** AI chart suggestions on upload (Day 22), AI executive summaries in PDF exports (Day 22), future natural-language query → chart (post-launch).

**Why we picked it:**
- Best-in-class reasoning + instruction following for structured outputs (JSON chart configs)
- Generous context window (200k+ tokens) — can feed full dataset samples
- Strong cost/performance with Haiku for cheap tasks, Sonnet for complex ones, Opus for hardest
- Tool use / structured output APIs make integration clean
- We're building this with Claude — dogfooding the same model the product uses is poetic and practical

**Alternatives considered:**
- **OpenAI GPT-4o / GPT-5** — comparable quality. Slightly different strengths. Worth A/B testing eventually.
- **Google Gemini** — fast, multimodal. Strong but ecosystem less polished for tool use.
- **Self-hosted (Llama 3, Mistral)** — no API cost but you pay for GPU. Quality below frontier for hard tasks. Defer indefinitely.

**Cost guardrails:** Per-user daily caps (free: 5 AI calls/day, pro: 100/day). Prompt caching reduces cost ~90% on repeated context.

**When to reconsider:** Multi-provider abstraction if costs spike or we want redundancy. Build via Vercel AI SDK which has provider-agnostic API.

---

### OpenAI text-embedding-3-small

**Role:** Generate embeddings for column names + aliases (schema fingerprinting, Day 19). Stored in Supabase pgvector for nearest-neighbor search.

**Why we picked it:**
- Cheapest quality embedding: $0.02 per 1M tokens
- 1536 dimensions (or 512 with truncation for faster search)
- Anthropic doesn't offer embeddings yet — OpenAI is the obvious choice

**Alternatives considered:**
- **OpenAI text-embedding-3-large** — better quality, 6x cost. Overkill for column-name matching.
- **Cohere embed-english-v3** — strong alternative, slightly more expensive.
- **Voyage AI** — high-quality, used by Anthropic for some tooling.
- **Self-hosted (sentence-transformers, BGE)** — free but requires hosting.

**Cost projection:** ~$0.001 per upload (10-30 column names embedded). Negligible.

**When to reconsider:** If we move all AI to a single provider for billing simplicity, Cohere has both embeddings and LLMs.

---

## Dev Tooling

### pnpm (package manager)

**Role:** Node package manager. Faster, less disk space, stricter than npm/yarn.

**Why we picked it:**
- Uses hard links → installs are 2-3x faster than npm, takes 50% less disk
- Strict by default → prevents phantom dependency bugs
- First-class workspaces (when we add a monorepo later)

**Alternatives:** npm (slower, fine), yarn (similar to pnpm, less momentum), bun (fastest, less stable).

---

### ESLint

**Role:** Static analysis — catches bugs, enforces code style.

**Why we picked it:** Industry default. Strong React + TypeScript plugin ecosystem.

**Alternatives:** Biome (faster Rust-based, less mature plugin ecosystem). Watch for migration in 6 months.

---

### Prettier

**Role:** Code formatter — opinionated, runs on save, eliminates style debates.

**Why we picked it:** Industry default.

**Alternatives:** dprint (faster), Biome (formatter + linter combined).

---

### Husky + lint-staged

**Role:** Git hooks — run ESLint/Prettier on staged files before commit.

**Why we picked it:** Standard combo. Catches issues before they hit CI.

---

### GitHub Actions

**Role:** CI — run tests + linting on every PR.

**Why we picked it:** Free for public repos, generous free tier for private. Native GitHub integration.

**Alternatives:** CircleCI, GitLab CI (if you move off GitHub), Jenkins (don't).

---

## Cost breakdown

### Phase 1–2 (Days 1–16): Pre-launch

| Service | Cost | Notes |
| ------- | ---- | ----- |
| Supabase | $0 | Free tier covers dev + first users |
| Vercel | $0 | Free tier (hobby) |
| GitHub | $0 | Free for private repos |
| Sentry | $0 | Free tier (5k errors/mo) |
| Resend | $0 | Free tier (3k emails/mo) |
| Cloudflare DNS | $0 | Free |
| **Total** | **$0/mo** | |

### Phase 3 (Days 17–23): AI layer activated

| Service | Cost | Notes |
| ------- | ---- | ----- |
| All above | $0 | Same |
| Anthropic API | ~$5–20/mo | Dev/testing usage |
| OpenAI Embeddings | <$1/mo | Negligible |
| **Total** | **~$10/mo** | |

### Phase 4 (Days 24–30): Launch

| Service | Cost | Notes |
| ------- | ---- | ----- |
| Domain (Cloudflare) | $0.83/mo | $10/yr, one-time annual |
| Supabase Pro | $25/mo | Required for daily backups + PITR |
| Vercel Pro | $20/mo | Required for password-protected previews + larger limits |
| Sentry | $0 | Still on free tier |
| Resend | $0 | Still on free tier |
| Stripe | 2.9% + ₹3 per transaction | No fixed fee |
| Anthropic API | ~$30–100/mo | Growing with usage |
| OpenAI Embeddings | ~$5/mo | |
| **Total** | **~$80–170/mo + 3% of revenue** | |

### Post-launch month 3 (100 paid users)

| Service | Cost | Notes |
| ------- | ---- | ----- |
| Supabase Pro | $25/mo | |
| Vercel Pro | $20/mo | |
| Sentry Team | $26/mo | More events |
| Resend | $20/mo | More volume |
| Anthropic API | ~$200/mo | 100 paid × ~$2 AI cost each |
| OpenAI | ~$20/mo | |
| **Total** | **~$310/mo** | At 100 × ₹1,500/mo paid users = ₹1.5L MRR. Margin ~85%. |

---

## Bundle size budget

Production JavaScript bundle target: **< 350 KB gzipped** for initial load.

| Library | Approx gzipped size |
| ------- | ------------------- |
| React + React DOM | 45 KB |
| React Router | 15 KB |
| TanStack Query | 13 KB |
| Zustand | 1 KB |
| react-hook-form + zod | 22 KB |
| Tailwind CSS (purged) | 10 KB |
| shadcn/ui components used | ~30 KB |
| Radix primitives used | ~40 KB |
| date-fns (tree-shaken) | 5–10 KB |
| Lucide icons (tree-shaken) | 5–10 KB |
| Supabase client | 35 KB |
| **App shell subtotal** | **~225 KB** |

**Lazy-loaded per route:**
- ECharts (full): ~200 KB → lazy load only on builder/chart routes
- PapaParse: ~10 KB → lazy on upload route
- SheetJS: ~250 KB → lazy on upload route
- ExcelJS: ~250 KB → lazy on export action (load on click)
- jsPDF + html2canvas: ~200 KB → lazy on export action
- @dnd-kit: ~15 KB → lazy on builder route
- TanStack Table: ~15 KB → lazy on data-viewing routes
- react-grid-layout: ~30 KB → lazy on dashboard route

**Strategy:** Aggressive code splitting via React.lazy + Vite's automatic chunking. Initial page load only ships app shell + auth code. Heavy libs load on demand.

---

## Migration paths

What we'd do if we outgrow each layer:

| Current | Outgrowth signal | Migration path |
| ------- | ---------------- | -------------- |
| Supabase free | >50k MAU, >500 MB DB | Pro tier ($25/mo). Same data, no code change. |
| Supabase Pro | DB egress costs spike | Move DB to Neon, keep Supabase Auth + Storage. |
| Browser parsing | Files > 50 MB common | Add Supabase Edge Function (Deno) for server-side parse. Same data flow, async upload. |
| Browser PDF | Charts blurry, layout breaks | Move PDF gen to Puppeteer in an Edge Function. |
| ExcelJS browser | Need pivot tables, named ranges in output | Add Python service (Fly.io) with openpyxl. |
| Vercel free | >100 GB bandwidth | Vercel Pro ($20). At extreme scale, Cloudflare Pages. |
| Anthropic single provider | Cost spike or downtime | Vercel AI SDK abstraction → fallback to OpenAI. |
| pgvector at scale | >10M vectors, slow search | Move to Pinecone for just embeddings, keep rest on Supabase. |
| ECharts | Need 3D / WebGL effects | Add Three.js / Plotly side-by-side for specific chart types. |

---

## Documents this references

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — 30-day day-by-day build plan
- [DAY_1_PLAN.md](DAY_1_PLAN.md) — Day 1 detailed steps
- [progress.html](progress.html) — Interactive progress tracker

---

## How to update this document

When we **add** a tool mid-build:
1. Add an entry in the appropriate section
2. Update the "Stack at a glance" table
3. Update bundle size budget
4. Update cost breakdown if non-zero

When we **swap** a tool:
1. Move the old entry to a "Deprecated" footnote
2. Add the new tool entry
3. Note the swap in the Decisions log of PROJECT_PLAN.md
