# DataLens BI — 30-Day Build Plan

**Owner:** Viswajeet Ray
**Build partner:** Claude
**Start date:** 2026-05-21
**Target launch:** 2026-06-19 (Day 30)
**Goal:** Public SaaS launch — landing page, Stripe-ready, custom domain, first 5 pilot users onboarded.

---

## Status legend

Use these markers next to each task. Update as you go.

| Marker | Meaning |
| ------ | ------- |
| `[ ]`  | Not started |
| `[~]`  | In progress |
| `[x]`  | Done |
| `[!]`  | Blocked (add a one-liner why) |
| `[-]`  | Skipped / deferred (add a one-liner why) |

Each day has a **Status** line at the top — overwrite it with one of: `Not started`, `In progress`, `Done`, `Blocked`, `Deferred`.

---

## Overall progress

- **Phase 1 — Foundation** (Days 1–8): Not started
- **Phase 2 — Analysis power** (Days 9–16): Not started
- **Phase 3 — Differentiators** (Days 17–23): Not started
- **Phase 4 — Launch prep** (Days 24–30): Not started

**Days complete:** 0 / 30

---

## Tech stack — committed

### Frontend
- **React 18 + TypeScript + Vite** — fastest dev loop, modern, well-supported
- **TailwindCSS + shadcn/ui** — copy-paste accessible components, looks professional out of the box
- **Apache ECharts** — 20+ chart types, canvas renderer scales to 100k+ rows, industry standard for BI tools
- **TanStack Query** — server state (caching, retries, optimistic updates)
- **Zustand** — UI state (no Redux ceremony)
- **React Router v6** — routing
- **react-hook-form + zod** — forms with validation
- **PapaParse** — CSV parsing (in-browser)
- **SheetJS (xlsx)** — Excel parsing (in-browser)
- **ExcelJS** — Excel export with formulas, formatting, styles
- **jsPDF + html2canvas** — PDF export
- **date-fns** — date handling

### Backend / Infra
- **Supabase** — Postgres (with Row-Level Security), Auth (email + Google OAuth), Storage (S3-compatible). One SDK, one auth model.
- **Vercel** — auto SSL, edge network, preview deploys per branch
- **Sentry** — error tracking (Day 27)
- **Resend** — transactional email (Day 25 onwards, for invites + Stripe receipts)
- **Stripe** — subscription billing (Day 25)
- **Cloudflare Registrar** — domain (Day 29, ~$10/yr, no markup)

### AI integration (Phase 3 only — Phase 1 stays deterministic per your call)
- **Anthropic Claude API** — chart suggestions on upload + AI-generated executive summary in PDFs
- **OpenAI embeddings** (text-embedding-3-small) — schema fingerprinting for column auto-match

### Why this stack vs alternatives
- **Supabase, not Cloudflare R2 + separate Postgres** — R2 needs presigned URLs or a Worker proxy and a separate auth model. Supabase ties storage to auth with RLS-style policies. Migrate later if cost demands.
- **ECharts, not Recharts/Chart.js** — Recharts is React-y but slow past 5k points. ECharts has canvas + WebGL renderers and the chart type coverage we need (heatmap, sankey, treemap available for Phase 5).
- **Browser-side parsing, not a Python backend** — PapaParse + SheetJS handle 50MB files comfortably. A backend adds 3 days of setup we don't need yet. If we hit limits in Phase 2, add a Supabase Edge Function.
- **shadcn/ui, not MUI/Chakra** — shadcn copies components into your repo (no version-locked dep), built on Radix primitives (accessibility done right), Tailwind for styling.

---

## Innovations baked into this plan (not in the original 21-day plan)

1. **Schema fingerprinting via embeddings (Day 19)** — column configs auto-apply when columns are *semantically* similar (`Sales Amount` ↔ `Revenue`), not just exact-match. This is the feature that makes "configuration persistence" actually work.
2. **"Show me the math" audit trail (Day 21)** — every chart/KPI has a toggle that shows the exact filters + aggregation in plain English. Massive trust feature for finance/ops; no incumbent does this well.
3. **AI chart suggestions on upload (Day 22)** — Claude looks at column types + sample rows and proposes 3-5 charts that tell the most interesting story. First-impression moment.
4. **AI exec summary in PDF exports (Day 22)** — PDF reports include a Claude-generated executive summary paragraph alongside charts. Turns analyst output into stakeholder-ready narrative.
5. **Public embed/share links (Day 23)** — one-click embeddable read-only chart URLs. Free growth lever (blog posts, internal wikis link back).
6. **Comparison mode (deferred to post-launch)** — upload two files, auto-diff. Logged in backlog.

---

## Phase 1 — Foundation (Days 1–8)
**Goal:** A user can sign up, upload a CSV/XLSX, see a clean data preview, and build + save a working bar/line/pie/scatter chart.

### Day 1 — Project skeleton & auth
**Target date:** 2026-05-21
**Status:** Not started

**What we build:**
- [ ] Init Vite + React + TypeScript + Tailwind
- [ ] Install shadcn/ui, set up base components (Button, Input, Card, Dialog)
- [ ] Create Supabase project, save URL + anon key to `.env.local`
- [ ] Supabase client wrapper in `src/lib/supabase.ts`
- [ ] Schema migration: `profiles` table with RLS
- [ ] Login + Signup pages (email/password)
- [ ] Protected route wrapper (redirect to `/login` if no session)
- [ ] GitHub repo created, first commit
- [ ] Connect to Vercel, first deploy lands

**Verification:**
- [ ] Signup creates a row in `profiles` automatically (trigger)
- [ ] Login persists across refresh
- [ ] Logged-out user hitting `/` redirects to `/login`
- [ ] Live Vercel preview URL works

**Deliverable:** Live URL with working signup/login.

---

### Day 2 — App shell & navigation
**Status:** Not started

**What we build:**
- [ ] Top-bar navigation (logo left, profile menu right)
- [ ] Sidebar with sections: Files, Workspaces, Charts, Templates, Settings
- [ ] Dashboard landing page (empty state with CTA "Upload your first file")
- [ ] Profile menu: name, email, logout
- [ ] Dark mode toggle (Tailwind `dark:` classes)
- [ ] Toast/notification system (shadcn `sonner`)
- [ ] 404 and error pages

**Verification:**
- [ ] Navigation works across all routes
- [ ] Dark mode preference persists (localStorage)
- [ ] Logout clears session and redirects

**Deliverable:** Polished app shell — looks like a real product even with no features yet.

---

### Day 3 — File upload & storage
**Status:** Not started

**What we build:**
- [ ] Upload component: drag-drop zone + click-to-browse fallback
- [ ] Accept `.csv` and `.xlsx` (50MB cap)
- [ ] Parse CSV with PapaParse (worker mode for big files)
- [ ] Parse XLSX with SheetJS
- [ ] Upload raw file to Supabase Storage (`uploads/{user_id}/{file_id}.{ext}`)
- [ ] Store parsed JSON to `datasets` table (compressed if >1MB)
- [ ] Upload progress indicator (bytes + parse stage)
- [ ] File history list with timestamps + row count

**Verification:**
- [ ] CSV with 50k rows uploads without freezing UI
- [ ] XLSX with multiple sheets — first sheet imported, others listed
- [ ] Upload history persists across sessions
- [ ] Storage RLS policy: users only see their own files

**Deliverable:** Upload → parsed data stored → reload sees the file in history.

---

### Day 4 — Data preview & column engine
**Status:** Not started

**What we build:**
- [ ] Data preview table: first 100 rows, virtualized (TanStack Table)
- [ ] Auto-detect column types: number, integer, decimal, string, date, boolean
- [ ] Column header shows: name, type icon, null %, unique count
- [ ] Click column header → side panel with min/max/avg, top 5 values, null count
- [ ] "Show all rows" toggle (paginated, 1000/page)
- [ ] Search/filter rows by keyword (client-side)

**Verification:**
- [ ] Type detection on mixed sample datasets (Northwind, Titanic, sales data)
- [ ] Date column with mixed formats (`2024-01-15`, `15/01/2024`) handled
- [ ] Empty cells shown as `—` placeholder, not crash

**Deliverable:** Data preview screen with smart column inspection.

---

### Day 5 — Column rename, tagging & data cleaning
**Status:** Not started

**What we build:**
- [ ] Inline column rename (click column header → edit)
- [ ] Tag column as Dimension or Measure
- [ ] Override detected type (number ↔ string ↔ date)
- [ ] Null handling options: keep / drop row / replace with 0 / replace with mean
- [ ] Save column config to `dataset_configs` table (per-dataset)
- [ ] Reset column config button

**Verification:**
- [ ] Rename persists on reload
- [ ] Override from string → number works on numeric-looking strings
- [ ] Null strategy changes are reflected in preview live

**Deliverable:** Column engine — analyst can fix bad data without touching Excel.

---

### Day 6 — Chart builder UI shell
**Status:** Not started

**What we build:**
- [ ] Builder screen: 3-pane layout (column list / chart canvas / properties)
- [ ] Column list: search + filter by type, drag handle
- [ ] Axis drop zones: X-axis, Y-axis, Group-by (color), Filter
- [ ] Drag-drop with `@dnd-kit/core` (works on touch too)
- [ ] Chart type picker (bar, line, pie, scatter — visual icons)
- [ ] Chart title input + axis label inputs
- [ ] Empty state: "Drop a column onto the X-axis to start"

**Verification:**
- [ ] Drag from column list to axis works smoothly
- [ ] Drop on wrong type (e.g. text on Y-axis of a number chart) shows clear error
- [ ] Switching chart type preserves compatible axis selections

**Deliverable:** Interactive chart builder shell — drag-drop works, no chart rendering yet.

---

### Day 7 — Chart rendering (all 4 types)
**Status:** Not started

**What we build:**
- [ ] ECharts React wrapper component (`<Chart config={...} />`)
- [ ] Bar chart: grouped + stacked mode toggle
- [ ] Line chart: multi-series (multiple Y columns)
- [ ] Pie chart: auto-group small slices into "Other" when >10 categories
- [ ] Scatter: color-by-category support
- [ ] Color palette picker (6 presets: default, vibrant, pastel, monochrome, dark, colorblind-safe)
- [ ] Legend show/hide toggle
- [ ] Tooltip on hover with formatted numbers

**Verification:**
- [ ] All 4 chart types render with a real 5k-row sales dataset
- [ ] Multi-series line works with 3+ Y columns
- [ ] Pie with 50 categories auto-groups correctly
- [ ] Colorblind-safe palette passes contrast check

**Deliverable:** All 4 chart types working with real data.

---

### Day 8 — Save, workspace & Phase 1 polish
**Status:** Not started

**What we build:**
- [ ] Save chart config to `charts` table (JSON blob: source dataset, axes, type, filters, formatting)
- [ ] Workspace grid: cards showing chart thumbnail + title + last edited
- [ ] Rename and delete charts (with confirm dialog)
- [ ] Open a saved chart → rehydrates builder with all selections
- [ ] Loading skeletons on every screen
- [ ] Empty states with friendly copy
- [ ] Mobile responsive check (375px width — at least readable)
- [ ] **Phase 1 demo video recorded** (2 min Loom: signup → upload → chart → save)

**Verification:**
- [ ] Saved chart reloads pixel-identical
- [ ] Delete works without page refresh (optimistic update)
- [ ] No console errors on any screen
- [ ] Demo video plays on shared link

**Deliverable:** Phase 1 demo — full flow from signup to saved chart.

---

## Phase 2 — Analysis power (Days 9–16)
**Goal:** Real analysis platform. Pivot tables, filters, aggregations, KPIs, production-quality exports, multi-chart dashboards.

### Day 9 — Pivot table builder
**Status:** Not started

**What we build:**
- [ ] New chart type: Pivot Table
- [ ] Config panel: Rows (multi), Columns (multi), Values (multi with aggregation)
- [ ] Render pivot with dynamic column headers
- [ ] Row totals + column totals toggle
- [ ] Sticky headers on scroll (wide tables)
- [ ] Conditional formatting: color scale on numeric cells (red-yellow-green or single hue)

**Verification:**
- [ ] Pivot with 3 row dimensions × 2 column dimensions renders correctly
- [ ] Totals match a manual Excel pivot on same data
- [ ] 20-column-wide pivot scrolls horizontally without layout break

**Deliverable:** Working pivot table builder.

---

### Day 10 — Aggregation engine
**Status:** Not started

**What we build:**
- [ ] Aggregation selector per value column: SUM, AVG, COUNT, COUNT DISTINCT, MIN, MAX, MEDIAN
- [ ] "% of row" / "% of column" / "% of grand total" options
- [ ] Date grouping: by Day / Week / Month / Quarter / Year
- [ ] Custom number formats: currency (₹/$/€), percentage, thousands separator, decimal places
- [ ] Number formats apply in pivot + charts + exports

**Verification:**
- [ ] SUM matches Excel pivot on same data (sanity check)
- [ ] Date grouping correctly buckets `2024-03-15` into "Q1 2024", "Mar 2024", "2024"
- [ ] Currency format shows ₹1,23,456 vs $123,456 based on locale setting

**Deliverable:** Full aggregation engine.

---

### Day 11 — Filter panel
**Status:** Not started

**What we build:**
- [ ] Right-side filter panel (slide-out)
- [ ] Category filter: searchable multi-select checkbox list (handles 1000+ values)
- [ ] Number filter: min/max inputs + histogram preview
- [ ] Date filter: from/to picker + presets (Today, MTD, QTD, YTD, Last 7d, Last 30d)
- [ ] Active filters shown as chips below toolbar
- [ ] Clear-all-filters button
- [ ] Filter state persists in chart config (saved with chart)

**Verification:**
- [ ] Filter applies to chart + pivot simultaneously
- [ ] Removing a filter chip restores data
- [ ] 0-result filter shows "No data matches" empty state, not crash

**Deliverable:** Live filter panel.

---

### Day 12 — Group, sort, Top-N & KPI card
**Status:** Not started

**What we build:**
- [ ] Sort column toggle in pivot (asc/desc arrows on header)
- [ ] Top-N filter: "show top 10 by [Revenue]"
- [ ] **KPI card chart type:** big number + label + comparison
- [ ] KPI period-over-period: vs same period last year/month (if date column present)
- [ ] Trend arrow + color (↑ green / ↓ red)
- [ ] Sparkline mini-chart inside KPI card

**Verification:**
- [ ] Top-10 filter matches manual sort
- [ ] KPI shows correct trend direction
- [ ] KPI handles missing prior-period data gracefully ("—")

**Deliverable:** KPI card chart type + Top-N controls.

---

### Day 13 — Calculated fields & conditional formatting
**Status:** Not started

**What we build:**
- [ ] Calculated field builder: name + formula
- [ ] Formula syntax: `[Sales] / [Units]`, `IF([Profit] > 0, "Yes", "No")`, basic math + IF
- [ ] Formula validation with helpful error messages
- [ ] Calculated fields appear in column list as derived columns
- [ ] Conditional cell rules: "color cells red if < 0", "bold if > 1M"

**Verification:**
- [ ] Calculated field updates when underlying data changes
- [ ] Invalid formula shows error inline, doesn't crash
- [ ] Conditional formatting renders correctly in PDF/Excel export

**Deliverable:** Calculated fields + cell rules.

---

### Day 14 — Excel export
**Status:** Not started

**What we build:**
- [ ] Integrate ExcelJS (bundled, browser-side)
- [ ] Export current chart: data sheet + chart-as-image sheet
- [ ] Export current pivot: data with headers + totals
- [ ] Auto-fit column widths based on content
- [ ] Style header row: bold, fill color, border
- [ ] Numbers exported as numbers (not text), dates as dates
- [ ] Multi-sheet export: each saved chart/pivot as one sheet
- [ ] Filename: `{workspace}_{chart_name}_{YYYY-MM-DD}.xlsx`

**Verification:**
- [ ] Exported XLSX opens correctly in Microsoft Excel, Google Sheets, LibreOffice
- [ ] Numbers can be summed in Excel (proven number type)
- [ ] Conditional formatting from app appears in Excel

**Deliverable:** One-click Excel export, single + multi-sheet.

---

### Day 15 — PDF export
**Status:** Not started

**What we build:**
- [ ] html2canvas captures chart/pivot div at 2x resolution (retina-quality)
- [ ] jsPDF assembles A4 landscape PDF
- [ ] Header: workspace logo + chart title
- [ ] Footer: generated-on timestamp + page number
- [ ] Multi-chart PDF: one chart per page, table of contents page
- [ ] Filter chips shown in PDF (so reader sees what's filtered)

**Verification:**
- [ ] PDF opens correctly in Chrome PDF viewer + Adobe Acrobat
- [ ] Charts render sharp at 2x (not blurry)
- [ ] Multi-chart PDF paginates correctly

**Deliverable:** Branded PDF export.

---

### Day 16 — Multi-chart dashboard
**Status:** Not started

**What we build:**
- [ ] New artifact type: Dashboard
- [ ] Grid layout (react-grid-layout): drag, resize, save layout
- [ ] Add saved chart to dashboard via picker
- [ ] Dashboard-level filter that cascades to all charts
- [ ] Export entire dashboard to PDF (multi-page)
- [ ] Dashboard URL is shareable within workspace
- [ ] **Phase 2 demo video recorded**

**Verification:**
- [ ] Layout saves and reloads identically
- [ ] Dashboard filter updates all charts on dashboard
- [ ] PDF of dashboard is one-page-per-chart or fit-to-page (user toggle)

**Deliverable:** Multi-chart dashboard + Phase 2 demo.

---

## Phase 3 — Differentiators (Days 17–23)
**Goal:** The features that make this not "another BI tool." Company workspaces, smart config persistence, AI assistance, public embeds, audit trails.

### Day 17 — Company workspace & members
**Status:** Not started

**What we build:**
- [ ] `workspaces` table + `workspace_members` join table (with roles: owner, editor, viewer)
- [ ] Create workspace on first login (default: `{user_name}'s workspace`)
- [ ] Workspace switcher in top nav
- [ ] Settings page: workspace name, logo upload, brand primary color
- [ ] Logo applied to PDF exports + top nav
- [ ] Brand color applied to default chart palette + UI accents
- [ ] Invite by email link (7-day expiry, role-scoped)

**Verification:**
- [ ] Logo appears in PDF header
- [ ] Invite link creates correctly-scoped account
- [ ] Color change updates chart palette live (no refresh)
- [ ] RLS: workspace data only visible to members

**Deliverable:** Company workspace live with branding + invites.

---

### Day 18 — Column config presets
**Status:** Not started

**What we build:**
- [ ] `column_configs` table (workspace-scoped): canonical name, aliases[], type, format, KPI formula
- [ ] Settings UI: define column "Revenue" with aliases ["Sales Amount", "Total Sales", "Net Revenue"]
- [ ] Default format per column (currency, percent, etc)
- [ ] KPI formula library: `Profit Margin = [Profit] / [Revenue]`
- [ ] On new upload: exact-match column names against config library → auto-apply

**Verification:**
- [ ] Upload same-schema file twice → second time configs auto-apply
- [ ] KPI formula calculates correctly in pivots
- [ ] Format applies to table + Excel cells

**Deliverable:** Column config presets — auto-apply on exact-match.

---

### Day 19 — Schema fingerprinting (semantic auto-match) ★ INNOVATION
**Status:** Not started

**What we build:**
- [ ] On column config creation: embed canonical name + aliases via OpenAI `text-embedding-3-small`
- [ ] Store embeddings in Supabase `pgvector` extension
- [ ] On new file upload: embed each new column name, find nearest neighbor (cosine similarity) in workspace's config library
- [ ] Match confidence badge per column: **Exact** (string match) / **Fuzzy** (similarity > 0.85) / **Suggested** (>0.70) / **No match**
- [ ] User approves/rejects each suggested match
- [ ] Approved matches strengthen the alias list (active learning)

**Verification:**
- [ ] `Sales Amount` ↔ `Revenue` matches with high confidence
- [ ] `Customer ID` ↔ `client_id` matches
- [ ] Unrelated columns (`Region` ↔ `Revenue`) do NOT match
- [ ] Embedding cost stays under $0.001 per upload (10 columns avg)

**Deliverable:** Semantic config auto-apply — the feature that makes "configuration persistence" actually work.

---

### Day 20 — Saved analysis templates
**Status:** Not started

**What we build:**
- [ ] "Save as template" button on any chart/pivot/dashboard
- [ ] Template stores: chart type, axis bindings (by canonical column name), filters, format, calc fields
- [ ] Template library screen: grid of templates with preview thumbnail
- [ ] Apply template to a new dataset → uses schema fingerprinting to map columns
- [ ] Graceful warning when template column has no match in new dataset
- [ ] Templates can be private (creator only) or shared (workspace-wide)

**Verification:**
- [ ] Apply "Monthly Sales Report" template to a different but structurally similar CSV
- [ ] Shared template visible to other workspace members
- [ ] Template with missing columns shows actionable warning, not crash

**Deliverable:** Full template system.

---

### Day 21 — "Show me the math" audit trail ★ INNOVATION
**Status:** Not started

**What we build:**
- [ ] Every chart/KPI has an info icon → opens "Math" drawer
- [ ] Drawer shows in plain English: source dataset, filters applied, aggregation, calculation, row count before/after
- [ ] Example output: *"This KPI shows the SUM of [Revenue] for rows where [Region] is 'APAC' AND [Date] is between 2024-01-01 and 2024-03-31. 1,247 rows match out of 50,000."*
- [ ] "Copy as text" button (for sharing in Slack/email)
- [ ] "Show source rows" button → opens filtered raw data view

**Verification:**
- [ ] Numbers in the drawer match the chart exactly
- [ ] Drawer updates live as filters change
- [ ] Plain English is readable to non-analysts (test with 2 non-technical people)

**Deliverable:** Audit trail — the trust feature that finance/ops users will love.

---

### Day 22 — AI chart suggestions + AI exec summary ★ INNOVATION
**Status:** Not started

**What we build:**
- [ ] On dataset upload: send column metadata + first 20 rows to Claude (`claude-sonnet-4-6`)
- [ ] Prompt asks for 3-5 chart suggestions with: chart type, axes, brief reason
- [ ] Suggestions render as clickable cards → click to open in builder pre-configured
- [ ] On PDF export: optional toggle "Include AI executive summary"
- [ ] Claude generates 2-3 paragraph narrative based on visible chart data + filters
- [ ] Cache AI responses (don't re-call for unchanged data)
- [ ] Cost guardrails: hard limit per user per day (free: 5, pro: 100)

**Verification:**
- [ ] Suggestions are actually useful (not generic) on 3 different datasets
- [ ] Exec summary references real numbers from the chart (no hallucination)
- [ ] Cost stays under $0.05 per upload
- [ ] Hitting daily limit shows clear upgrade prompt

**Deliverable:** AI-assisted setup + AI-generated narratives.

---

### Day 23 — Public embed & share links ★ INNOVATION
**Status:** Not started

**What we build:**
- [ ] "Share" button on any chart/dashboard → modal with public link + iframe embed code
- [ ] Public link is read-only, no auth needed, slug like `share.datalens.app/c/abc123`
- [ ] Watermark "Built with DataLens" on public charts (removable on Team plan)
- [ ] Embed iframe is responsive, theme matches host site (light/dark via query param)
- [ ] Public chart link uses Vercel ISR (fast, cached, low DB load)
- [ ] Toggle to revoke link or password-protect

**Verification:**
- [ ] Embedded chart renders in CodePen sandbox
- [ ] Revoking link shows "This chart is no longer available"
- [ ] Public chart doesn't leak workspace name or other charts

**Deliverable:** Public embed/share — built-in growth lever.

---

## Phase 4 — Launch prep (Days 24–30)
**Goal:** Production-grade SaaS. Landing page, Stripe, onboarding, hardening, custom domain, soft launch.

### Day 24 — Marketing landing page
**Status:** Not started

**What we build:**
- [ ] `/` route is now landing page (app moves to `/app/*`)
- [ ] Hero: headline + subhead + "Try free" CTA + demo video embed
- [ ] Feature grid (4-6 features with screenshots)
- [ ] Pricing section (Starter / Pro / Team — match the pitch deck)
- [ ] Logo wall placeholder (real once pilot users approve)
- [ ] FAQ section
- [ ] Footer with privacy + terms links

**Verification:**
- [ ] Lighthouse score > 90 on landing page
- [ ] Mobile-responsive at 375px
- [ ] CTA button click → signup flow

**Deliverable:** Public-facing landing page.

---

### Day 25 — Stripe billing
**Status:** Not started

**What we build:**
- [ ] Stripe account setup + products created (Starter Free, Pro $19/mo, Team $99/mo)
- [ ] Stripe Checkout integration (hosted page — no PCI scope)
- [ ] Webhook handler for `customer.subscription.created/updated/deleted`
- [ ] `subscriptions` table tied to workspace
- [ ] Plan gates: free tier limited to 3 uploads/month, 5 charts, no PDF export
- [ ] Upgrade prompts on gated features
- [ ] Billing page: current plan, invoices, manage via Stripe Customer Portal
- [ ] Resend integration for receipt emails

**Verification:**
- [ ] End-to-end paid signup works (use Stripe test mode)
- [ ] Webhook updates `subscriptions` table correctly
- [ ] Free user hits "Export to PDF" → upgrade modal
- [ ] Downgrade re-applies free limits

**Deliverable:** Stripe billing live (test mode → switch to live on Day 29).

---

### Day 26 — Onboarding & empty states
**Status:** Not started

**What we build:**
- [ ] First-login: 3-step checklist (Upload data → Build a chart → Export)
- [ ] Sample dataset link: "Don't have data? Try our sample sales CSV"
- [ ] First-visit tooltips on key UI elements (axis drop zones, filter panel)
- [ ] Empty state illustrations + helpful copy on workspace/template screens
- [ ] Keyboard shortcuts: `E` export, `F` filters, `S` save, `?` show shortcuts
- [ ] Cmd+K command palette (search across files, charts, templates)

**Verification:**
- [ ] Checklist marks complete correctly as user progresses
- [ ] Tooltips appear only once per user
- [ ] Sample dataset loads + auto-generates a starter chart

**Deliverable:** First-impression-ready UI.

---

### Day 27 — Production hardening
**Status:** Not started

**What we build:**
- [ ] React error boundaries on every route — friendly error screen + Sentry capture
- [ ] Sentry SDK frontend + Supabase function errors
- [ ] Supabase RLS audit: write tests confirming user A cannot access user B's data
- [ ] File size cap enforced (50MB) with clear message
- [ ] Rate limiting on upload endpoint (10/min/user)
- [ ] HTTP security headers via Vercel config: CSP, HSTS, X-Frame-Options
- [ ] CSRF protection on Stripe webhook (verify signature)
- [ ] Privacy policy + Terms of Service pages (generated from template, lawyer review post-launch)

**Verification:**
- [ ] Trigger deliberate error → Sentry captures it with stack trace
- [ ] User A logs out + tries User B's workspace URL → blocked by RLS
- [ ] Upload 60MB file → clear size error, no crash
- [ ] securityheaders.com scan grade: A or higher

**Deliverable:** Production-hardened app.

---

### Day 28 — QA pass on 5 sample datasets
**Status:** Not started

**What we build:**
- [ ] QA checklist: 5 real-world datasets (sales, HR, marketing, finance, ops)
- [ ] For each: full flow signup → upload → chart → pivot → filter → export → template
- [ ] Verify Excel + PDF outputs open cleanly
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iPhone Safari + Android Chrome (responsive)
- [ ] Fix any regressions found
- [ ] Update Sentry alert rules

**Verification:**
- [ ] All 5 datasets complete the full flow with no errors
- [ ] No console errors on any browser
- [ ] Mobile: at least the dashboard view is usable

**Deliverable:** QA-passed product.

---

### Day 29 — Custom domain & production deploy
**Status:** Not started

**What we build:**
- [ ] Buy domain (Cloudflare Registrar — suggest `datalens.bi` / `getdatalens.com` / `trydatalens.com`)
- [ ] Connect to Vercel — auto SSL provisioning
- [ ] Stripe: switch from test mode → live mode (re-create products in live)
- [ ] Env variables audit: no secrets in code, all in Vercel env (prod scope)
- [ ] Supabase: enable daily backups (paid tier — $25/mo, worth it)
- [ ] Supabase: enable PITR (Point-In-Time Recovery)
- [ ] Smoke test on production URL: signup → upload → chart → export → upgrade → invite

**Verification:**
- [ ] Custom domain loads over HTTPS
- [ ] Stripe live mode accepts a real $1 test charge (refunded immediately)
- [ ] All Sentry errors during smoke test are zero
- [ ] Database backup confirmed in Supabase dashboard

**Deliverable:** Live production app on custom domain.

---

### Day 30 — Soft launch
**Status:** Not started

**What we build:**
- [ ] Record 3-minute product demo (Loom)
- [ ] Write LinkedIn launch post: problem → solution → demo link → invite to try
- [ ] DM 5 analysts you know — ask them to try and give feedback
- [ ] Embed Tally feedback form in-app (`/app/feedback`)
- [ ] Post to ProductHunt scheduled launch (next Tuesday at 12:01 AM PT)
- [ ] Tag `v1.0` in GitHub
- [ ] Celebrate

**Verification:**
- [ ] Demo video plays on shared link
- [ ] App handles 5 concurrent users without issues (load test with k6 if time)
- [ ] First feedback form submissions land in inbox

**Deliverable:** 🎉 **DataLens BI v1.0 — live, launched, paying-customer-ready**

---

## Backlog (post-launch, not in 30 days)

- Comparison mode (upload two files, auto-diff)
- Scheduled email reports
- REST API data source
- SQL / BigQuery / Snowflake direct connectors
- White-label mode (Team+)
- SSO / SAML (Enterprise)
- Mobile app
- Template marketplace (community-contributed)
- Natural-language query → chart ("show me revenue by region for Q3")
- Anomaly detection on KPIs
- Slack/Teams integration for sharing
- Audit logs export (SOC 2 prep)

---

## Decisions log

Record decisions here as we go — useful when you come back in 3 months and wonder "why did we pick X?"

| Date | Decision | Why |
| ---- | -------- | --- |
| 2026-05-21 | Supabase over R2 + custom Postgres | One auth model, faster Day 1, RLS bundled |
| 2026-05-21 | ECharts over Recharts | Performance past 5k rows + chart type coverage |
| 2026-05-21 | 30 days, not 21 | Original plan missed landing page + Stripe + onboarding — required for paid SaaS launch |
| 2026-05-21 | AI features in Phase 3 only | Per your call: keep Phase 1 deterministic |

---

## Risks & active mitigations

| Risk | Likelihood | Mitigation |
| ---- | ---------- | ---------- |
| Scope creep | High | Anything new goes to Backlog. Hard freeze after Day 23. |
| Supabase free tier limits hit | Medium | Monitor row counts + storage. Upgrade to Pro ($25/mo) on Day 29 anyway. |
| Stripe approval delays | Medium | Start Stripe account verification on Day 24, not Day 25. |
| AI cost overrun | Low | Per-user daily caps + Anthropic prompt caching. |
| Pilot users churn after signup | Medium | Day 26 onboarding + sample dataset reduces time-to-first-value. |
| Performance on 100k+ row files | Medium | Defer to Phase 5 — Polars-in-WASM or Supabase Edge Function. Cap at 50MB for v1. |

---

## How to use this file

- Update the **Status** line at the top of each day as you work it.
- Tick off `[ ]` checkboxes as tasks complete.
- Add a one-line note when you mark something `[!]` blocked or `[-]` deferred — future you will thank you.
- Update the **Overall progress** counters at the top whenever a day is fully done.
- Append to **Decisions log** when we deviate from the plan (we will — every project does).
- Append to **Backlog** when a "nice to have" idea comes up mid-build, instead of stuffing it into the current day.
