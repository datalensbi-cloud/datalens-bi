# Day 5 — Build Plan (Brief)

**Goal:** Make uploaded data *editable without going back to Excel*. From the preview screen, the user can rename columns, force a different type if auto-detect got it wrong, tag columns as Dimension or Measure (so Day 7 charts know what to do), pick a null-handling strategy, and persist every override per dataset. Reset button to undo all overrides.

**Estimated time:** 4–4.5 hours.

**Needs from you up-front:** ~3 minutes — run one SQL migration in Supabase to add a `column_overrides` JSONB column to the `datasets` table.

---

## What "good" looks like at end of Day 5

A user opens a file at `/files/{id}`:

- **Click a column header** → side panel opens (same as Day 4) **but now includes an "Edit" section below the summary stats**
- **Inline rename** — click the column name at the top of the panel → it becomes editable → typing changes the display name across the table and exports (underlying CSV column name preserved)
- **Type override** — dropdown lets user force `Number / Text / Date / Boolean` regardless of what auto-detect said. Preview re-renders immediately with new formatting.
- **Tag as Dimension or Measure** — two toggle buttons. Auto-pre-tagged based on type (numeric → Measure, else → Dimension) but user can flip.
- **Null handling** — radio group with 4 strategies:
  - **Keep** (default) — show null cells as muted "—"
  - **Drop** — hide rows where this column is null
  - **Replace with 0** — show 0 for nulls in numeric columns
  - **Replace with column average** — for numeric columns only
- **Auto-saves** to DB with 500ms debounce; small "Saving…" indicator briefly appears
- **Reset overrides** button at top of preview page → "Are you sure?" confirm → wipes overrides for this dataset
- **Refresh the page** → all overrides persist
- **Visual indicator** in column headers when an override is active (small dot or modified badge)

---

## Build sequence (8 steps)

### Step 1 — SQL migration 0003 (~10 min, you run it)
- Adds `column_overrides JSONB NOT NULL DEFAULT '{}'` to `datasets`
- I'll write the SQL — you paste it into Supabase SQL Editor

### Step 2 — Database type + datasets lib (~15 min)
- Update `Database` type to include `column_overrides`
- Define `ColumnOverride` shape: `{ display_name?, type?, role?, null_strategy? }`
- Add `updateColumnOverrides(datasetId, overrides)` helper

### Step 3 — Apply overrides at render time (`lib/apply-overrides.ts`) (~30 min)
- Pure function: takes `(detectedColumns, rows, overrides)` → returns `{ columns, rows }` with overrides applied
- Renames are pure cosmetic (table headers + display only; underlying keys unchanged)
- Type overrides change what `ColumnTypeBadge` shows + what `formatCell` does
- Null strategies actually mutate the row set (drop / replace) at render time only

### Step 4 — Side panel grows an "Edit" section (~45 min)
- Below the existing summary stats, add a card titled "Edit"
- Sub-sections: Rename, Type, Role (Dim/Measure), Null handling
- Reuses shadcn primitives — Input for rename, Select for type/null, ToggleGroup for Dim/Measure

### Step 5 — Wire individual edit widgets (~50 min)
- Rename input — controlled, fires `onChange` → debounced save
- Type override Select — `Number / Text / Date / Boolean / Auto (use detected)`
- Dim/Measure toggle group — visual selected state, toggles
- Null strategy radio — only relevant strategies shown per column type (e.g. "Replace with mean" only for numbers)

### Step 6 — Auto-save with debounce + reset button (~30 min)
- Debounce: 500ms after last edit, send a single PATCH to `datasets` row
- Toast on save failure (network/RLS); silent on success — but a tiny "Saved" indicator flashes near the panel header
- Reset button at top of preview page → AlertDialog confirm → clears `column_overrides`

### Step 7 — Visual indicator in column headers (~15 min)
- Small colored dot next to column name when that column has any override
- Hover tooltip: "Renamed", "Type changed", "Custom null handling", etc.

### Step 8 — Smoke test + commit + push + daily wrap (~30 min)
- Test all 4 override types with a real CSV
- Refresh page → overrides persist
- Reset button → back to detected types
- Build + lint clean
- Commit, push
- After your verification → daily wrap (DAY_5_REPORT.md + audit)

---

## Decision points — guide me here

> **Decision 1 — Where to store column overrides**
> - **(A) JSONB column on `datasets` row** — single table, simple update, all overrides for a dataset in one place (Recommended)
> - **(B) Separate `column_configs` table** — cleaner for cross-dataset queries (e.g. "show me all columns flagged as Measure across my workspaces") — but overkill for v1 since we have no such query yet
>
> *My pick: (A). Migrate to (B) on Day 17 if workspace-level sharing ever needs it.*

> **Decision 2 — When edits save**
> - **(A) Auto-save with 500ms debounce** — feels modern, no save button, ambient. Tiny "Saving…" → "Saved" indicator. (Recommended)
> - **(B) Explicit Save button** — analyst commits intentionally; safer if they want to experiment
> - **(C) Edit mode toggle for whole panel** — must enter edit mode → make changes → save → exit. Three clicks where one would do.
>
> *My pick: (A). Modern SaaS pattern. We can layer "undo" innovation if changes feel risky.*

> **Decision 3 — Null handling scope**
> - **(A) Apply only at render time** — underlying stored JSON untouched. Day 7 charts apply the strategy when building each chart. Safe, fully reversible. (Recommended)
> - **(B) Re-parse + re-save the JSON** — permanent change to the dataset's parsed data
> - **(C) Both options** — extra "Re-parse with this strategy" button for users who want it baked in
>
> *My pick: (A). Reversibility = trust.*

> **Decision 4 — Where edits live UX-wise**
> - **(A) Column summary panel grows an "Edit" section below the stats** — same panel, no new modes (Recommended)
> - **(B) Dedicated "Edit columns" mode overlay** — separate experience
> - **(C) Inline editing directly in the table header**
> - **(D) Separate `/files/:id/edit` route**
>
> *My pick: (A). Lowest cognitive load.*

> **Decision 5 — Default Dimension/Measure**
> - **(A) Auto-pre-tag based on type** — numeric → Measure, else → Dimension. User can flip. (Recommended)
> - **(B) Always start untagged** — user must manually classify before charts can use them
>
> *My pick: (A). Reasonable defaults remove friction; manual override is one click away.*

---

## Worth discussing — innovation candidates (you decide IN or OUT)

### 1. ⭐ "Reset to detected" per-column quick button
Inside the edit section: a small "↺ Reset to detected" link that wipes overrides for *just this column* (not the whole dataset). The big "Reset all" stays at the top of the page.
**Cost:** +10 min · **Value:** HIGH — analysts experiment column-by-column · **Risk:** None

### 2. ⭐ Visual override indicator in column headers
Small colored dot/badge in the column header when any override is active. Hover for tooltip explaining what's overridden.
**Cost:** Already in Step 7 of the build — listed here so you know it's the "innovation" tax
**Value:** HIGH — analysts see at a glance which columns they've customized · **Risk:** None

### 3. Undo/redo across the dataset
Ctrl+Z reverts the last edit; Ctrl+Y redoes. History stored in component state (lost on page refresh).
**Cost:** +30 min · **Value:** Medium — power-user nicety · **Risk:** Edge cases with debounced saves

### 4. Hide column toggle
A "Hide from charts/exports" toggle per column. Doesn't delete data, just excludes from downstream UI.
**Cost:** +15 min · **Value:** Medium — useful when datasets have junk columns · **Risk:** Day 7 charts need to respect this

### 5. Drag to reorder columns
Drag column headers in the table to reorder them. Order saved to overrides; preserved in exports.
**Cost:** +40 min · **Value:** Medium — analysts love this in Excel · **Risk:** Adds dnd-kit dependency earlier than planned (currently Day 6 for chart builder drag)

### 6. Bulk operations
Multi-select columns (Shift+click headers), then apply one change to all: type, role, or null strategy.
**Cost:** +35 min · **Value:** Medium · **Risk:** UI complexity

### 7. "Apply config from another dataset" button
Pre-Phase-3 sneak peek of the schema-fingerprinting feature — but limited: pick another dataset, copy its overrides if columns match by name.
**Cost:** +45 min · **Value:** Medium · **Risk:** Sets unrealistic expectations for Day 19's full embedding-based version

---

## What I'll NOT do on Day 5 (deferred)

- **Bulk re-parse with new null strategy** (Decision 3B) — render-only is enough
- **Column sort/search in preview** → Day 6 polish
- **Pagination toggle** → Day 6 polish
- **Cross-dataset template/config sharing** → Day 17 workspaces / Day 20 templates
- **AI-suggested column types or null strategies** → Phase 3 (Day 22)
- **Calculated columns** (e.g. `profit = revenue - cost`) → Day 13

---

## End-of-Day-5 deliverable checklist

- [ ] Migration 0003 run, `column_overrides` column exists on `datasets`
- [ ] Click a column in preview → side panel shows summary + Edit section
- [ ] Rename a column → table headers update immediately
- [ ] Override a column's type → cells re-format (text → number adds thousands separator etc.)
- [ ] Toggle Dim/Measure → toggle visibly changes state
- [ ] Pick null strategy "Replace with 0" → null cells in that column show as 0 in preview
- [ ] Pick "Drop" → rows missing that column hidden from preview; row count badge updates
- [ ] Auto-save fires within 1s of last edit; tiny "Saved" flash near panel
- [ ] Refresh page → all overrides persist
- [ ] Reset all overrides button → confirm → all columns back to detected types/names
- [ ] Override dot/badge in column header for any column with edits
- [ ] No regressions in Days 1-4
- [ ] `DAY_5_REPORT.md` written + audit pass committed per the wrap protocol

---

## How to start

**Reply with:**
1. Your 5 decision answers (e.g. `1A, 2A, 3A, 4A, 5A`)
2. Which innovations to include (e.g. `1, 2` or `1, 2, 4` or `none`)
3. Any of your own ideas — you're the analysis expert, what column-editing capabilities would make this feel made-for-analysts?
4. **"Go"**

I'll write SQL → paste for you to run → keep building while you do that → finish + smoke test → daily wrap.
