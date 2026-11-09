# Literature reading UX — approved design

Date: 2026-11-08
Status: Approved. Jacques de Wet approved the calm literary direction with optional paper-like page turns and said to proceed. This record matches the current OpenBible repo, not an earlier frontend audit taken on its own.

## Current repo (verified)

- Literature lives at `src/app/literature/page.tsx`, `src/components/LiteratureLibrary.tsx`, and `src/components/LiteratureReader.tsx`.
- Catalog reads go to `GET /api/literature/list` and `POST /api/literature/load`. Both construct a Supabase client from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with non-null assertions. `src/lib/supabaseRouteAuth.ts` already knows how to detect a missing URL or anon key, but the literature routes do not use it.
- `LiteratureService.loadLiteratureIndex()` turns any failed list response into `{ works: [] }`. The library then renders “No works found / Try adjusting your search terms or filters”. A signed-out `GET /api/user/preferences` 401 is already swallowed by `userPreferencesService` and must stay unrelated to the catalog error.
- The reader shows one chapter at a time. Previous and Next change `currentChapter`. There is no viewport pagination, no saved literature anchor, and the bookmark control does not persist.
- Works stay in `public.works.content` as JSON (`title`, `author`, `chapters[]` with `content` text). This design does not change schema, RLS, UUIDs, or the corpus.
- `public/literature/*.json` is a separate static shape and is not what the list API serves. Do not treat those files as the live catalog.
- A November 8 live check of the deployed site saw HTTP 500 on the library and an empty shelf. September logs once tied a list failure to a missing Supabase URL. That is historical evidence only. This change makes a missing public config explicit in code; it does not claim that is the current production cause, and it does not edit production environment variables.

## Direction

Calm reading room. Warm paper, ink, and a real book serif (Source Serif 4 by default; Libre Baskerville, EB Garamond, and Lora available). Playfair Display is limited to titles and generated covers. Quiet controls. No statistics dashboard, no purple gradient, no invented cover art.

## Reader

Three modes:

- Scroll: the work flows in one column. The anchor is the block nearest the top.
- Single page: one viewport page. A horizontal swipe or the Next control moves one page.
- Spread: two pages when the viewport can hold two readable columns at the chosen font size (about 34 characters each, plus gutter). Otherwise the active mode falls back to single and says so. A swipe moves to the next or previous spread. Both pages of a spread are real consecutive pages, so no text is skipped.

Pages are packed from measured text, not from chapters. Chapter changes only when the reader reaches the final page of that chapter. The contents list remains a separate control and jumps to the start of a chapter.

Each location is `{ chapterIndex, charOffset }` into the chapter source string. Font, spacing, theme, layout, and orientation changes rebuild pages and reopen the page that contains that anchor. A saved page index is never the source of truth.

Legacy values still open:

- `{ chapterIndex, charOffset }`
- `{ chapterIndex }` or `{ currentChapter }` with offset 0 (the old reader’s chapter index)
- a newer `updatedAt` wins when local storage and account preferences both have a position

Positions are stored locally under `openbible-literature-positions`. When a session exists they are also written into the existing `user_preferences.preferences` JSON as `literatureReadingPositions`. No new table. A 401 while signed out stays silent.

Page turns:

- `none`: instant
- `slide`: horizontal move
- `paper`: a short `rotateY` leaf after the gesture commits. This is one CSS turn, not a curl simulation.
- `prefers-reduced-motion: reduce` forces `none`

A horizontal drag follows the finger. Releasing before the threshold settles back. Vertical movement and an active text selection do not start a page turn. Previous and Next stay available as at least 44px controls, with Arrow keys, PageUp, and PageDown. Chrome may dim, but those controls remain focusable.

Start and end of the work do not wrap. Long paragraphs, headings, scripture quotations (quote plus an em dash), links, and footnote lines split on whitespace so every source character appears once. A heading is not left alone at the bottom of a page when the next line can travel with it. Empty chapters still produce a title page so the contents list has a destination.

Bookmarks, highlights, and notes attach to character ranges in local storage (and the same preferences object when signed in). They are not a new backend. Scripture quotations stay visually distinct. Selecting text still works.

Surfaces: light, warm, sepia, and dark, with ink and muted text chosen for body contrast. Font size and line height remain adjustable. The Bible reader is unchanged.

## Library

Books first. Continue Reading appears only for works in the loaded catalog that have a real saved position. Covers are typographic cloth panels derived from the title (color, rule, title, author). No image assets are invented.

Search, difficulty, author, and sort (title, author, year, reading time, recently added) run on the loaded list. They are session controls, not saved settings. Difficulty groups are the only shelves, because difficulty is real metadata. No themed collections are invented.

Loading uses skeletons. These states stay distinct:

- Catalog request failed, including not configured (503 `SUPABASE_NOT_CONFIGURED`) and server error (500). Copy must not tell the reader to adjust filters.
- Catalog loaded and empty.
- Catalog loaded, but the current search or filters match nothing.
- A work whose chapters have no text, or whose title, description, or metadata says it is incomplete, is labeled “Incomplete text” and is never badged complete.

Delete stays available only while signed in, because the delete route requires the caller’s JWT and RLS. Signed-out reading of the public catalog stays allowed. Service-role keys stay off the client.

## Out of scope

- Production deployment, production env edits, merging, schema changes, RLS changes, and re-ingesting works.
- Redesign of the Bible reader, notes, or search.
- Shipping fixture books inside the real catalog. Fixtures live under `tests/fixtures` and a development-only preview route that returns 404 in production.
