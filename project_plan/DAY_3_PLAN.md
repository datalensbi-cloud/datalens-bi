# Day 3 — Build Plan (Brief)

**Goal:** Replace the `/files` placeholder with the real thing — a user can drag a CSV or Excel file in, watch it parse with a progress indicator, and see it land in their personal file library. Raw file goes to Supabase Storage, metadata + parsed data go to the database, RLS-locked to the owning user.

**Estimated time:** 3–4 hours.

**Needs from you up-front:** ~5 minutes — run one SQL migration in the Supabase dashboard to create the `datasets` table + storage bucket + RLS policies. I'll write the SQL.

---

## What "good" looks like at end of Day 3

A logged-in user:
- **Drops a CSV or XLSX file** onto the upload zone (or clicks to browse)
- **Sees real-time progress** — "Parsing… 60%" → "Uploading… 30%" → "Saved ✓"
- **File card appears in the list** with name, row count × column count, file size, uploaded date
- Can **delete a file** with a confirm dialog
- Can't upload files **over the size cap** (clear error)
- Can't upload **non-spreadsheet files** like images (clear error)
- The **dashboard "Upload your first file" button** is finally alive — clicks route to `/files`
- All file data is **RLS-locked** — even if you grab another user's file ID, the request fails

The actual preview table (showing the data) lands **Day 4**. Today is just upload → list → metadata.

---

## Build sequence (8 steps)

### Step 1 — Install parser libs (~5 min)
- `papaparse` + `@types/papaparse` (CSV)
- `xlsx` (SheetJS, for Excel files)
- Both are browser-side, no backend needed

### Step 2 — Schema migration: `datasets` table + storage bucket (~15 min)
- New SQL file: `supabase/migrations/0002_datasets.sql`
- Creates `datasets` table (id, user_id, name, original_filename, file_path, row_count, column_count, file_size_bytes, mime_type, status, created_at)
- Enables RLS, adds policies (users CRUD own datasets only)
- Creates `datasets` storage bucket
- Adds storage policies (users can read/write only files under `userId/...` path)
- **You paste it into Supabase SQL Editor and click Run**

### Step 3 — Storage + dataset client helpers (~20 min)
- `src/lib/storage.ts` — upload, download, delete helpers wrapping Supabase Storage
- `src/lib/datasets.ts` — CRUD on the `datasets` table
- All hashing/scoping logic in one place so future days reuse it

### Step 4 — Parser utilities (~40 min)
- `src/lib/parsers/csv.ts` — PapaParse wrapper (streaming, worker mode if Innovation #4 picked)
- `src/lib/parsers/xlsx.ts` — SheetJS wrapper (first sheet only for v1)
- `src/lib/parsers/index.ts` — dispatch by file extension/MIME, returns `{ rows, columns, rowCount }`

### Step 5 — Upload component (~60 min)
- `src/features/files/UploadDropzone.tsx`
- Drag-drop visual feedback (highlight on drag over, reject on wrong type)
- Click-to-browse fallback (hidden `<input type="file">`)
- Validation: size cap, MIME type, extension fallback
- Multi-stage progress indicator (parsing %, uploading %, saving)
- Error handling with user-friendly toasts (per decision 5)

### Step 6 — Files list page (~50 min)
- `src/features/files/FilesPage.tsx` — replace the ComingSoonPage placeholder
- TanStack Query to fetch user's datasets (sorted by recent)
- File card layout (per decision 4): icon, name, rows × cols badge, size, date, delete action
- Empty state when no files yet (with embedded upload zone)
- Delete with shadcn AlertDialog confirm

### Step 7 — Wire dashboard CTA (~10 min)
- Enable the disabled "Upload your first file" button on `/dashboard`
- Route to `/files`
- Update copy slightly to reflect new state

### Step 8 — Smoke test + commit + push (~20 min)
- Test all happy paths (CSV, XLSX, drag, click)
- Test all error paths (too big, wrong type, empty file, corrupt CSV)
- Test RLS by trying to fetch another user's file via direct API call
- Lint + build clean
- Commit, push, verify on Vercel
- Smoke-test the live URL

After Step 8 → daily wrap protocol kicks in: I write `DAY_3_REPORT.md`, audit the day's files, commit fixes separately.

---

## Decision points — guide me here

> **Decision 1 — Where to store the parsed data**
>
> Once we parse a CSV, we have JSON rows. Where do they live so Day 4's preview screen can read them back fast?
> - **(A) Inline in a JSONB column** on the `datasets` table — simplest. Breaks past ~1 MB of parsed JSON (Postgres has a hard row size limit).
> - **(B) Separate JSON file in Storage** at `datasets/{user_id}/{file_id}.json` — Recommended. Scales to any file size, kept alongside the raw file.
> - **(C) Don't store parsed data, re-parse from raw file every time** — simplest schema, but every preview/chart re-downloads + re-parses (slow on big files).
>
> *My pick: (B). Same pattern Looker, Tableau, etc. use.*

> **Decision 2 — File size cap**
> - **(A) 10 MB** — safe, fast to parse, limits abuse on free tier
> - **(B) 25 MB** — Recommended balance. Covers 95% of analyst CSVs without straining the browser.
> - **(C) 50 MB** — what the original plan said. Risky without Web Workers (Innovation #4) — could freeze the UI on a slower laptop.
>
> *My pick: (B). We can raise to 50 MB on Day 27 (production hardening) once we have Web Worker parsing locked in.*

> **Decision 3 — What happens immediately after upload completes**
> - **(A) Toast + stay on Files page** — Recommended for today. Preview screen doesn't exist until Day 4, so redirecting would confuse.
> - **(B) Auto-redirect to a preview** — needs the preview screen, which is Day 4's work. Premature.
> - **(C) Show inline preview right in the upload card** — heavy for Day 3, duplicates Day 4 work.
>
> *My pick: (A). Tomorrow's Day 4 wrap-up will switch behavior to redirect-to-preview.*

> **Decision 4 — Files list display**
> - **(A) Card grid** — Recommended. Visual, modern, leaves room for thumbnail previews later (Day 6 polish).
> - **(B) Table view** — denser, more spreadsheet-feeling for analysts. Adds a row per file with sortable columns.
>
> *My pick: (A) for v1, with a toggle to (B) as a Day 6 polish task. Best of both.*

> **Decision 5 — Failed / partial upload handling**
> - **(A) Strict** — any parse error during upload → abort, delete uploaded raw file from storage, show error toast. Clean state, no orphans (Recommended).
> - **(B) Lenient** — save raw file with `status='parse_failed'`, let user retry parsing later from the list. Useful for recovery from transient errors.
>
> *My pick: (A) for Day 3 simplicity. We can layer (B) as a "Retry parse" action in Day 6+ if we see real-world parse failures.*

---

## Worth discussing — innovation candidates (you decide IN or OUT)

Each is small, optional, and tagged with cost/value/risk. Mix and match.

### 1. ⭐ Auto-name suggestion from filename
"q3_sales_data.csv" → defaults the dataset name to "Q3 Sales Data" (strip extension, replace underscores/dashes with spaces, title case). User can still edit before saving.
**Cost:** +10 min · **Value:** Medium — makes the file list feel curated, not "raw filename junk" · **Risk:** None

### 2. ⭐ Hash-based duplicate detection
Compute SHA-256 of the file in the browser before upload. If the same user already uploaded a file with this hash, show: *"You uploaded this same file on March 15. Open existing or replace?"* Saves storage, avoids duplicate dataset pollution.
**Cost:** +25 min · **Value:** HIGH — analysts re-upload the same file 5x while iterating · **Risk:** Low — hashing adds ~2s on 25MB files (one-time, before upload)

### 3. CSV delimiter auto-detect
PapaParse can sniff the delimiter (comma vs semicolon vs tab vs pipe). Useful for European CSVs (Excel France exports use semicolons by default).
**Cost:** +5 min — just a flag · **Value:** Medium — silent fail-safe for non-US data · **Risk:** None

### 4. Web Worker for parsing
PapaParse has built-in worker mode. Parses in a background thread → UI stays responsive even on 50 MB files. Required if you pick **2C (50 MB cap)**; nice-to-have if you pick **2B (25 MB)**.
**Cost:** +20 min (worker setup + bundler config) · **Value:** Medium-High at 50 MB, Medium at 25 MB · **Risk:** Slight bundle increase

### 5. Sample CSV button on the dropzone
*"Don't have a file handy? Try our Northwind sample →"* loads a built-in 5,000-row sales CSV. Onboarding gold — lets users feel the product immediately. (Originally I deferred this to Day 26 onboarding; re-raising since this is the actual upload feature day.)
**Cost:** +30 min · **Value:** HIGH — first-impression conversion driver · **Risk:** Adds ~200 KB CSV to `public/` (not a big deal)

### 6. Multi-file drop with upload queue
Drop 5 files at once → uploads them sequentially with a queue UI showing progress per file. More polish, more code.
**Cost:** +40 min · **Value:** Medium — analysts often upload month-by-month data · **Risk:** Concurrency edge cases

---

## What I'll NOT do on Day 3 (deferred)

- **Column type auto-detection** (number/text/date/boolean) → Day 4
- **Data preview table** (first 100 rows shown) → Day 4
- **Column rename + tag as Dimension/Measure** → Day 5
- **File rename** in the list → Day 6 polish
- **Search / filter** files in history → Day 6 polish
- **Table view toggle** for the files list → Day 6 polish
- **File sharing across users** → never per-user; workspace sharing comes Day 17

---

## End-of-Day-3 deliverable checklist

- [ ] Drag a CSV onto the dropzone → parses → uploads → appears in Files list
- [ ] Click-to-browse fallback works
- [ ] XLSX upload works (same flow)
- [ ] Progress indicator shows during parse + upload
- [ ] Files list shows: name, rows × cols, file size, upload date
- [ ] Delete file works with confirm dialog (removes both DB row AND storage file)
- [ ] Oversize file → clear error message, no upload starts
- [ ] Wrong type file (e.g. PNG) → clear error message
- [ ] Corrupt CSV → clean error, no orphan storage entries (per decision 5)
- [ ] Dashboard "Upload your first file" button is enabled, routes to `/files`
- [ ] RLS verified: try to fetch another user's dataset via curl → 403
- [ ] Storage RLS verified: try to download another user's file path → 403
- [ ] No console errors anywhere
- [ ] Live Vercel deploy works
- [ ] No regressions in Day 1 or Day 2 features
- [ ] `DAY_3_REPORT.md` written + audit pass committed (per the wrap protocol)

---

## How to start

**Reply with:**
1. Your 5 decision answers (e.g. `1B, 2B, 3A, 4A, 5A`)
2. Which innovations to include (e.g. `1, 2, 3, 5` or `none`)
3. Any of your own ideas — what would make file upload feel uniquely *DataLens* and not generic "drag a file here" SaaS?
4. **"Go"**

I'll execute Steps 1-8 then deliver the report + audit per the daily wrap protocol.
