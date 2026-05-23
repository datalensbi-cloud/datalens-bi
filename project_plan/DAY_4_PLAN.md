# Day 4 — Build Plan (Brief)

**Goal:** Make uploaded files *useful* — click a file card and open a polished data preview with the first 100 rows, smart column type detection (number / text / date / boolean), and a column-summary side panel with per-column stats. Today is about *seeing the data*, not yet about editing it.

**Estimated time:** 4–4.5 hours.

**Needs from you up-front:** Nothing. No DB schema changes, no new accounts, no Supabase config. Pure frontend Day.

---

## What "good" looks like at end of Day 4

A user with at least one uploaded file:

- **Clicks any file card** on `/files` → routes to `/files/{datasetId}` and sees a preview page
- **First 100 rows** render in a scrollable table with sticky headers
- **Each column header** shows: column name + a colored type badge (number / text / date / boolean)
- **Clicks a column header** → side panel slides out with summary statistics specific to that column's type
- **Numeric column summary:** min, max, average, sum, null count, unique count
- **Text column summary:** unique count, null count, top 5 most-common values with frequency bars
- **Date column summary:** earliest, latest, null count
- **Boolean column summary:** true count, false count, null count
- **Loading skeleton** while the parsed JSON downloads from Storage
- **Friendly 404** if the URL has a non-existent or non-owned dataset ID (RLS enforces this server-side; we just render the empty state)
- **Mobile-responsive** — table scrolls horizontally, column panel becomes full-screen Sheet

What today *deliberately doesn't do*: rename columns, change types, mark as Dimension/Measure, handle nulls, or save the column config. All five of those are Day 5.

---

## Build sequence (8 steps)

### Step 1 — Install TanStack Table + shadcn `table` component (~10 min)
- `npm install @tanstack/react-table`
- `npx shadcn@latest add table` — gives us a styled `<Table>` primitive
- These give us headers, sorting (Day 6), pagination (Day 6) — for now we just use them for clean rendering

### Step 2 — Type detection engine `lib/column-types.ts` (~45 min)
- Pure function: takes column values → returns `'number' | 'string' | 'date' | 'boolean'`
- Strategy: full-scan (check every value), conservative (4 types only)
- Date detection covers ISO 8601 + common locale formats (decision 2)
- Returns confidence too — a column that's 95% numbers + 5% nulls is "number", a column that's 50/50 numbers and strings is "string"

### Step 3 — Column summary calculator `lib/column-summary.ts` (~30 min)
- Different shape per type:
  - Numeric → `{ type: 'number', min, max, sum, avg, nullCount, uniqueCount }`
  - Text → `{ type: 'string', nullCount, uniqueCount, top5: [{ value, count }] }`
  - Date → `{ type: 'date', earliest, latest, nullCount }`
  - Boolean → `{ type: 'boolean', trueCount, falseCount, nullCount }`
- Pure function, easy to unit-test

### Step 4 — `PreviewTable` component (~60 min)
- `features/files/PreviewTable.tsx`
- Uses TanStack Table headless + shadcn `<Table>` markup
- Sticky header row (CSS `position: sticky`)
- Color-coded type badges in each header (Innovation #1 if approved)
- Click a header → emits an `onColumnSelect` callback
- Empty cells render as muted "—" to make nulls visually obvious

### Step 5 — `ColumnSummaryPanel` slide-out (~45 min)
- `features/files/ColumnSummaryPanel.tsx`
- Uses shadcn `Sheet` (the same drawer we already use for mobile nav)
- Renders the right summary widget based on column type
- Top-5 values for text columns render as small bars with count labels
- Side panel on desktop; full-screen on mobile

### Step 6 — `PreviewPage` with route (~30 min)
- `features/files/PreviewPage.tsx`
- Route: `/files/:datasetId`
- `useQuery` #1: fetch dataset row from DB
- `useQuery` #2: download parsed JSON from Storage at `datasets/{userId}/{fileId}.json`
- Header bar: file name + back-to-files link + row × col counts
- 404 state if dataset doesn't exist or isn't owned

### Step 7 — Wire `FilesPage` cards to open preview (~10 min)
- Click anywhere on `DatasetCard` → `navigate('/files/{id}')`
- Add a hover hint or subtle "→" affordance
- Keep the kebab menu working for delete (stops propagation)

### Step 8 — Smoke test + commit + push (~20 min)
- Test on Northwind-style CSV: mixed types, some nulls, dates
- Test on a numeric-heavy CSV
- Test on an XLSX
- Build + lint clean
- Commit, push, Vercel auto-deploys
- After your verification → daily wrap (report + audit) kicks in per protocol

---

## Decision points — guide me here

> **Decision 1 — Type detection strategy**
>
> - **(A) Conservative 4 types** — only detect `number`, `string`, `date`, `boolean`. Everything else stays as `string`. Day 5 lets you override types manually. (Recommended)
> - **(B) Aggressive 8+ types** — also auto-detect `currency`, `percentage`, `email`, `URL`, `categorical`. More info up-front but ~3× more code and more chances for mis-detection.
>
> *My pick: (A). Get the basics right first; Day 5 + Day 26 polish add the finer flavors.*

> **Decision 2 — Date format support**
>
> - **(A) ISO 8601 only** (`2024-03-15`, `2024-03-15T10:00:00Z`) — strict, fast, fewer false positives
> - **(B) ISO + common locales** (`3/15/2024`, `15/03/2024`, `Mar 15 2024`) — covers analyst exports from Excel, more useful in practice (Recommended)
> - **(C) + Excel serial numbers** (`45000` decoded as a date) — rare for CSV; XLSX files already come pre-parsed via SheetJS
>
> *My pick: (B). Excel-exported CSVs almost never use ISO format.*

> **Decision 3 — Preview row count**
>
> - **(A) First 100 rows** — matches original plan, plenty to spot data quality issues (Recommended)
> - **(B) First 1,000 rows** — more browsing room
> - **(C) Full dataset with virtualization** — TanStack Virtual library, renders only visible rows. Useful but adds a lib.
>
> *My pick: (A). Day 6 polish can switch to (C) if any pilot user complains.*

> **Decision 4 — Column summary placement**
>
> - **(A) Slide-out side panel on column click** — Tableau / Excel-pivot pattern, doesn't crowd the table (Recommended)
> - **(B) Always-on inline row above headers** — info always visible but cramped
> - **(C) Tooltip on column header hover** — minimal but only one column at a time, no scroll within summary
> - **(D) Dedicated "Inspector" tab next to data** — more space but more clicks
>
> *My pick: (A). Side panel is the analyst-tool standard.*

> **Decision 5 — How to open a file's preview**
>
> - **(A) Click anywhere on the card opens preview** — fewest clicks, kebab still handles delete (Recommended)
> - **(B) Click only on the name link; explicit "View" button**
> - **(C) Dedicated "View" button + name link, card body inert**
>
> *My pick: (A). Whole-card click is the modern SaaS pattern.*

---

## Worth discussing — innovation candidates (you decide IN or OUT)

### 1. ⭐ Color-coded column type badges in headers
Each column header gets a small icon + color indicating its detected type. Blue # for number, gray T for text, green 📅 for date, purple ✓ for boolean. An analyst can scan column types at a glance without reading anything.
**Cost:** +15 min · **Value:** HIGH — defining visual language for the rest of the build · **Risk:** None

### 2. ⭐ Primary-key column detection
If a column has 100% unique non-null values, slap a small "Key" badge next to its name. Helps analysts spot the natural join column at a glance — extremely valuable for any data analysis workflow.
**Cost:** +20 min · **Value:** HIGH — saves analyst time on every new dataset · **Risk:** None

### 3. Mini sparkline in numeric column headers
Tiny inline distribution chart (10×30px) next to the column name showing the value spread. Tableau-style polish that makes the preview feel premium.
**Cost:** +30 min · **Value:** Medium — pretty, occasionally useful · **Risk:** Header gets visually busier

### 4. Click-to-filter cells (preview of Day 10)
Clicking a value in the table applies it as a quick filter that hides other rows. Day 10 ships the full filter panel; this is a sneak peek of that capability.
**Cost:** +25 min · **Value:** Medium — analysts love this · **Risk:** Pattern might conflict with Day 10's design; we'd need to revisit

### 5. Inferred semantic types (formatted display)
Beyond raw type, detect email / URL / currency / percentage from value patterns and render accordingly. `john@x.com` becomes a `mailto:` link, `$1,234.56` displays right-aligned, `78%` displays with a tiny bar.
**Cost:** +30 min · **Value:** Medium — polishes the preview substantially · **Risk:** Risk of mis-detection (a column of "%" strings as text vs "%" as percentages)

### 6. Recently viewed wakes up
The "Recent" section in the sidebar (currently a placeholder from Day 2) starts populating as the user opens previews. Saved to localStorage. Shows last 5 files.
**Cost:** +20 min · **Value:** Medium — the sidebar finally lives up to its placeholder · **Risk:** None

---

## What I'll NOT do on Day 4 (deferred to Day 5)

- **Column rename** — click column name to edit
- **Type override** — manually force "string" column to be parsed as number
- **Tag as Dimension or Measure** — sets the column's role in charts
- **Null handling strategies** — drop / keep / replace-with-zero / replace-with-mean
- **Save column config to DB** — persisted column overrides per dataset
- **Reset column config** button

## Also explicitly deferred

- Sort by column → Day 6 polish
- Search/find within preview → Day 6 polish
- Multi-sheet XLSX support → Phase 2 (Day 16+)
- Full-dataset virtualization (TanStack Virtual) → Day 27 if needed

---

## End-of-Day-4 deliverable checklist

- [ ] Click a file card → opens `/files/{id}` cleanly
- [ ] Preview page shows first 100 rows
- [ ] Sticky column headers with type badges
- [ ] Click column header → side panel opens with type-specific summary
- [ ] Number summary: min, max, avg, sum, null count, unique count
- [ ] Text summary: unique count, null count, top 5 values with counts
- [ ] Date summary: earliest, latest, null count
- [ ] Boolean summary: true / false / null counts
- [ ] Mobile: table scrolls horizontally; summary panel goes full-screen
- [ ] Loading skeleton while JSON downloads
- [ ] 404 / empty state for non-existent or non-owned dataset
- [ ] Back-to-files link works
- [ ] No console errors anywhere
- [ ] No regressions in Days 1-3 (auth, sidebar, upload, delete)
- [ ] `DAY_4_REPORT.md` written + audit pass committed per the wrap protocol

---

## How to start

**Reply with:**
1. Your 5 decision answers (e.g. `1A, 2B, 3A, 4A, 5A`)
2. Which innovations to include (e.g. `1, 2, 6` or `1, 2` or `none`)
3. Any of your own ideas — what would make the preview screen feel uniquely *DataLens* and not generic SaaS?
4. **"Go"**

I'll execute Steps 1-8, then deliver the report + audit per the daily wrap protocol.
