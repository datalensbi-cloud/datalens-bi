# Day 3 — Change Report

**Date completed:** 2026-05-23
**Goal:** Working file upload — drag CSV/XLSX → parse → store in Supabase Storage + metadata in DB → file appears in personal library. Replace the Day 2 `/files` placeholder.
**Status:** ✅ Shipped to production. 22/22 library smoke tests pass. Manual end-to-end verified by Piyush.
**Commits:** `86875a2` (build) → `<audit commit>` (audit fixes) → `<report commit>`

---

## What shipped (high level)

- Full upload pipeline: drag-drop → validate → hash → dedup-check → parse → upload-raw → upload-parsed-JSON → DB insert → list refresh
- 25 MB file size cap, CSV/TSV/XLSX/XLS supported
- Per-user duplicate detection via SHA-256 (Innovation #2) with three-option dialog
- Auto-generated dataset names from filenames (Innovation #1)
- Files list with card grid, delete-with-confirm, TanStack Query cache invalidation
- All storage RLS-locked: users can read/write only files under their own user-id folder
- Strict-mode error handling — any failure rolls back uploaded files
- Dashboard "Upload your first file" CTA now active (was disabled placeholder on Day 2)

---

## Files added (16 new)

### Database + storage (`supabase/migrations/`)

| File | Purpose |
| ---- | ------- |
| `0002_datasets.sql` | Creates `datasets` table (15 columns) with RLS policies, indexes, updated-at trigger, plus the `datasets` storage bucket with 25 MB cap and MIME whitelist, plus storage RLS for per-user folder isolation |

### Core utilities (`src/lib/`)

| File | Purpose |
| ---- | ------- |
| `hash.ts` | `computeFileHash()` — SHA-256 via WebCrypto, returns 64-char hex |
| `name-from-filename.ts` | `nameFromFilename()` — strips ext, replaces `_-` with space, title cases ("q3_sales.csv" → "Q3 Sales") |
| `parsers/types.ts` | `ParsedDataset` interface + `ParseError` class |
| `parsers/csv.ts` | PapaParse wrapper — Web Worker mode, auto-delimiter, header-mode |
| `parsers/xlsx.ts` | SheetJS wrapper — first sheet only, null for empty cells, cellDates: true |
| `parsers/index.ts` | `parseFile()` dispatcher, `isSupportedFile()`, `getFileExtension()` |
| `storage.ts` | `uploadRawFile`, `uploadParsedJSON`, `deleteFiles`, `downloadParsedJSON`. 25 MB cap constant. Path convention `{userId}/{fileId}.{ext}` |
| `datasets.ts` | `listDatasets`, `findDuplicateByHash`, `insertDataset`, `deleteDataset` (deletes storage + DB row in correct order) |
| `query-client.ts` | TanStack QueryClient with sensible defaults (30s staleTime, no refetch-on-focus) |

### Feature components (`src/features/files/`)

| File | Purpose |
| ---- | ------- |
| `UploadDropzone.tsx` | The orchestrator — state machine (idle/hashing/parsing/uploading/error), drag-drop handlers, validation, dedup, parse, upload, rollback. Renders dropzone OR progress card based on stage. |
| `DuplicateDialog.tsx` | AlertDialog shown when SHA-256 match found — three actions: Cancel, Upload as copy, Use existing |
| `DatasetCard.tsx` | One card per dataset — name, original filename, row × col badge, size badge, date, hover-revealed kebab menu with delete confirm |
| `FilesPage.tsx` | Replaces Day 2 placeholder — UploadDropzone + responsive card grid + loading skeletons + empty state |

### Test (`scripts/`)

| File | Purpose |
| ---- | ------- |
| `smoke-test-day3.mjs` | Stand-alone Node script — 22 library-level assertions on Papa, SheetJS, WebCrypto, name-from-filename. Run with `node scripts/smoke-test-day3.mjs` |

---

## Files modified (5)

| File | What changed | Why |
| ---- | ------------ | --- |
| `src/types/supabase.ts` | Added `datasets` table type with Row/Insert/Update/Relationships. Added `Relationships: []` to both `profiles` and `datasets` (supabase-js v2 requires this or tables infer as `never`). Exported `Dataset` type alias and `DatasetStatus` union. | Schema growth + type-system fix |
| `src/lib/utils.ts` | Added `formatBytes()` and `formatNumber()` helpers | Reused across DatasetCard and elsewhere |
| `src/features/dashboard/DashboardPage.tsx` | Removed `disabled` attribute from CTA button, removed "lands Day 3" footnote, label changed to "Go to Files" | Day 3 enables what Day 2 placed as placeholder |
| `src/App.tsx` | Mounted `<QueryClientProvider client={queryClient}>` at the top of the provider stack | TanStack Query was in deps but provider was never mounted |
| `src/features/files/FilesPage.tsx` | Full rewrite — replaces the Day 2 ComingSoonPage placeholder with the real implementation | Day 3 ships the feature |

### Shadcn components added (3)

`alert-dialog`, `dialog`, `progress`

### Dependencies pulled in by Day 3

`papaparse@^5.5.3`, `xlsx@^0.18.5`, `@types/papaparse@^5.5.2`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-progress`

---

## Decisions implemented (from DAY_3_PLAN.md)

| # | Decision | Status |
| - | -------- | ------ |
| 1 | Parsed data storage → separate JSON file in Storage at `{userId}/{fileId}.json` | ✅ |
| 2 | File size cap → 25 MB | ✅ (enforced both client-side and at the storage bucket level) |
| 3 | After upload → toast + stay on Files page | ✅ |
| 4 | Files list display → card grid | ✅ (3-column at lg, 2 at sm, 1 mobile) |
| 5 | Failed/partial uploads → strict abort + storage rollback | ✅ |

## Innovations implemented

| # | Feature | Status |
| - | ------- | ------ |
| 1 | Auto-name from filename ("q3_sales.csv" → "Q3 Sales") | ✅ — pure function in `lib/name-from-filename.ts` |
| 2 | SHA-256 duplicate detection with dialog | ✅ — `lib/hash.ts` + `DuplicateDialog.tsx` |

## Innovations deferred per Piyush's call

| # | Feature | Deferred to |
| - | ------- | ----------- |
| 3 | CSV delimiter auto-detect | Active by default (PapaParse without explicit delimiter auto-detects — verified in smoke test #2) |
| 4 | Web Worker for parsing | Active by default (set `worker: true` on Papa.parse) |
| 5 | Sample CSV button | Day 26 (onboarding) |
| 6 | Multi-file upload queue | Day 6 polish or later |

---

## 🔍 Audit findings

### Fixed in audit pass

| # | Severity | File | Issue | Fix |
| - | -------- | ---- | ----- | --- |
| 1 | **MEDIUM** | `DatasetCard.tsx` | Kebab menu (⋮) used `opacity-0 group-hover:opacity-100` — invisible on touch devices where there's no hover, and unreachable by keyboard. | Now: `lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100`. Always visible on mobile/touch; fade-on-hover only on desktop; reachable via Tab focus on desktop. |
| 2 | LOW | `UploadDropzone.tsx` | `handleDragLeave` cleared the highlight state any time the user dragged over a child element of the dropzone — classic flicker bug. | Guard: only clear highlight if the next target (`relatedTarget`) isn't a descendant of the dropzone. |
| 3 | LOW | `DuplicateDialog.tsx` | "Use existing" `<AlertDialogAction>` had a redundant `className="bg-primary"` overriding the default styling | Removed — shadcn's `AlertDialogAction` already uses primary styling |

### Deferred (flagged, not changed)

| # | Topic | Why deferred |
| - | ----- | ------------ |
| A | JS bundle is 351 KB gzipped (1 KB over the 350 KB target) | XLSX (full SheetJS) + Papa account for ~140 KB. Both are needed everywhere upload exists. Real fix is route-level `React.lazy` code splitting on Day 27 (production hardening). Acceptable margin for now. |
| B | SHA-256 loads entire file into memory before hashing | At 25 MB cap, this peaks at ~100 MB RAM during digest (single buffer). Fine for v1. If we raise to 50 MB+ on Day 27, we'd stream via `Blob.stream()` + `crypto.subtle.digest()` chunk-by-chunk. |
| C | CSV parser silently accepts files with non-fatal errors (e.g., "row 5 had 3 fields, expected 4") | PapaParse degrades gracefully; we return partial data. Acceptable for v1; surfacing these warnings to users is a Day 4 preview-screen task (where they can SEE the bad row). |
| D | FilesPage error fallback shows raw `error.message` from supabase-js | Day 27 hardening will route these through a friendly error message dictionary keyed off Postgres error codes. |
| E | Storage delete happens before DB delete in `deleteDataset` | Documented in-code: storage-first is the recoverable failure mode (orphan files easier to clean than phantom DB rows pointing to deleted files). Acceptable. |
| F | Hash computed on every upload, even when user explicitly chose "Upload as copy" | Could be skipped on the second attempt. Minor perf optimization. Day 27 candidate. |

### Things explicitly verified (no issues)

- **Library smoke test**: 22/22 assertions passed (`scripts/smoke-test-day3.mjs`) — covers CSV (with semicolon auto-detect), XLSX, SHA-256 determinism, auto-name edge cases
- **Production routes**: 9/9 returning HTTP 200
- **Build**: tsc + Vite both clean
- **Lint**: 0 warnings, 0 errors
- **RLS**: SQL migration includes 4 dataset policies + 4 storage policies. Path convention `{userId}/...` means policy `auth.uid()::text = (storage.foldername(name))[1]` correctly enforces ownership.
- **Manual E2E**: Piyush confirmed upload + delete + duplicate detection all work on the live URL.

---

## Metrics

| Metric | Day 2 | Day 3 | Δ |
| ------ | ----- | ----- | - |
| Files in `src/` | 42 | 58 | +16 |
| Production JS (gzipped) | 211 KB | 351 KB | +140 KB (XLSX + Papa) |
| Production CSS (gzipped) | 5.9 KB | 6.3 KB | +0.4 KB |
| Modules in build | 1789 | 1857 | +68 |
| Build time | 6 s | 7 s | +1 s |
| Lint warnings | 0 | 0 | – |
| Routes serving 200 | 10 | 10 | – |
| New DB tables | – | 1 (`datasets`) | – |
| New storage buckets | – | 1 (`datasets`) | – |
| New shadcn components | 7 | 3 | – |
| Smoke test assertions | – | 22/22 ✓ | – |

---

## Commits in this day

| Commit | Description |
| ------ | ----------- |
| `86875a2` | Day 3: file upload, parsing, storage, files library |
| (audit)  | Day 3 audit: touch a11y on kebab menu + drag-leave flicker + redundant className |
| (report) | Day 3 report |

---

## Sign-off

**Built and verified by:** Claude (build + library smoke test) + Piyush (manual end-to-end on live URL)
**Production URL:** https://datalens-bi.vercel.app/files
**Next step:** Day 4 — data preview screen + column type auto-detection (number / string / date / boolean)

When you're ready, say **"start Day 4"** and I'll draft the plan.
