# Literature reading UX implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace chapter-sized literature pages with viewport pagination and a book-first library, and stop presenting catalog failures as an empty filtered shelf.

**Architecture:** Pure functions in `src/lib/literature/` turn chapter strings into blocks, pack those blocks into pages with a width-aware measure, and step an anchor by one page or one spread. The reader measures the column, calls those functions, and only then animates. Catalog routes refuse to call Supabase until the public URL and anon key exist.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Vitest, existing Supabase anon client.

## Global Constraints

- Swipes change pages or spreads, never whole chapters. Spreads advance by two consecutive pages and do not skip text.
- Reading position is `{ chapterIndex, charOffset }`, not a page index. Legacy `{ currentChapter }` or `{ chapterIndex }` restores the start of that chapter.
- `prefers-reduced-motion: reduce` forces animation `none`.
- Do not change database schema, RLS, work UUIDs, or ingest the corpus.
- Do not put the service-role key in client code or weaken auth.
- Do not show fixture books in the real catalog. Fixtures stay in `tests/fixtures` and a development-only route.
- Do not redesign the Bible reader.
- Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` returns HTTP 503 with code `SUPABASE_NOT_CONFIGURED`. The library must not say “Try adjusting filters” for that response.
- Incomplete works are never labeled complete.

Execution of this plan is inline. The requester already approved the design and said to proceed; a background run cannot wait for a second execution choice.

---

### Task 1: Pagination, gesture, and position kernel

**Files:**
- Create: `src/lib/literature/types.ts`
- Create: `src/lib/literature/blocks.ts`
- Create: `src/lib/literature/paginate.ts`
- Create: `src/lib/literature/position.ts`
- Create: `src/lib/literature/annotations.ts`
- Test: `src/lib/literature/paginate.test.ts`
- Test: `src/lib/literature/position.test.ts`

**Interfaces:**
- Produces: `blocksFromWork`, `paginateBlocks`, `findPageIndex`, `stepAnchor`, `visiblePages`, `resolveReadingLayout`, `resolvePageTurn`, `classifyDrag`, `readStoredPosition`, `writeStoredPosition`, `decorateSlice`

- [ ] Write failing Vitest tests for a long chapter, spread boundaries, anchor stability, reduced motion, selection-safe drags, and legacy positions.
- [ ] Run `npx vitest run src/lib/literature/paginate.test.ts src/lib/literature/position.test.ts` and confirm failure because the modules are missing.
- [ ] Implement the kernel until those tests pass.

### Task 2: Catalog errors and summaries

**Files:**
- Create: `src/lib/literature/catalog.ts`
- Modify: `src/lib/supabaseRouteAuth.ts`
- Modify: `src/app/api/literature/list/route.ts`
- Modify: `src/app/api/literature/load/route.ts`
- Modify: `src/lib/literatureService.ts`
- Test: `src/lib/literature/catalog.test.ts`

**Interfaces:**
- Produces: `createSupabaseAnonClient()`, `publicSupabaseConfigError()`, `summarizeListedWork()`, `normalizeWorkSummary()`, `libraryViewState()`, `LiteratureLibraryError`

- [ ] Tests cover 503 vs 500 vs empty catalog vs empty filters, nested and flat list rows, and empty-shell works marked incomplete.
- [ ] List and load return 503 before constructing a client when public env is missing.
- [ ] `loadLiteratureIndex()` throws `LiteratureLibraryError` instead of returning an empty shelf.

### Task 3: Library and reader UI

**Files:**
- Modify: `src/components/LiteratureLibrary.tsx`
- Modify: `src/components/LiteratureReader.tsx`
- Create: `src/components/literature/LiteratureReaderView.tsx`
- Create: `src/components/literature/reader.css`
- Create: `src/app/literature/fixture-preview/page.tsx` (development only)
- Create: `tests/fixtures/literature-reader-fixture.json`
- Modify: `README.md`, `.env.example`
- Modify: `package.json` scripts

- [ ] Book-first library with continue-reading, typographic covers, and distinct loading, error, empty, and filter states.
- [ ] Reader uses the kernel, three layouts, three motions, quiet chrome, contents, bookmarks, highlights, notes, and scripture blocks.
- [ ] Fixture preview is labeled and calls `notFound()` when `NODE_ENV === 'production'`.

### Task 4: Verification

- [ ] `npx vitest run`
- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] Browser screenshots of the library error state and the labeled fixture library and reader at desktop, tablet landscape, tablet portrait, and phone widths. State that these are emulated, not iPad or Android hardware.
