# Lexicon / Word-Study Feature — Change Summary

**Date:** 2026-06-11
**Scope:** Turns OpenBible into a lexicon-driven study app: click any word in the KJV to see its
original Hebrew/Greek (Strong's) entry, find every verse using that original word (concordance),
and link out to BibleHub for deeper study. Non-KJV translations get the same capability through a
per-verse "Word Study" (interlinear) panel.

**Suggested commit message:**

```
feat: lexicon-driven word study (Strong's tagging, lexicon panel, concordance, BibleHub links)
```

---

## 1. Data pipeline (static assets, no DB required)

| File | Purpose |
|---|---|
| `scripts/build-lexicon-data.mjs` (new) | Builds all static lexicon assets. Run via `npm run build:lexicon`. |
| `public/bible-tagged-kjv/{Book}/{ch}.json` (new, generated, 1,189 files ≈15 MB) | Strong's-tagged KJV chapters as token arrays. |
| `public/lexicon/strongs-{H\|G}{block}.json` (new, generated, 144 files ≈4.3 MB) | Strong's dictionary, 100 entries per shard (14,197 entries total). |
| `data-sources/` (gitignored) | Raw downloads; re-fetched automatically by the build script if missing. |

**Sources (public domain / CC):** `github.com/kaiserlik/kjv` (KJV text with inline Strong's tags +
`<em>` italics) and `github.com/openscriptures/strongs` (Hebrew/Greek dictionaries), supplemented
with part-of-speech and KJV usage counts from kaiserlik's `lexicon.json`.

**Token model** (`public/bible-tagged-kjv/...`):
```json
{ "verse": 16, "tokens": [
  { "t": "For", "s": ["G1063"] },
  { "t": "only begotten", "s": ["G3439"] },
  { "t": "was", "i": 1 }
]}
```
`t` = English surface text (may be a phrase), `s` = one or more Strong's IDs, `i` = translator-
supplied italics, no `s` = untagged.

**Source-data quirks handled by the build script (do not "simplify" these away):**
- Several kaiserlik book files are **not valid JSON** (raw unescaped quotes in the Bulgarian
  translations; `Phm.json` contains two concatenated JSON objects). The script regex-extracts only
  the well-formed English (`en`) string literals instead of `JSON.parse`-ing whole files.
- The source **truncates trailing untagged text** on ~30% of verses (e.g. Gen 1:9 drops
  "and it was so."). The script repairs each verse against the reference KJV in `public/bible-json/`
  (complete 66 books; `public/bible-json-kjv/` lacks Song of Solomon) by appending the missing
  suffix as an untagged token.
- Build fails hard on token round-trip mismatches; after repair, 695/31,102 verses (2.2%) differ
  from the reference only by benign edition variants (em-dash vs `--`, razor/rasor, Adoni-zedek
  hyphenation, small-caps divine name).

## 2. Types and services

| File | Purpose |
|---|---|
| `src/types/lexicon.ts` (new) | `TaggedToken`, `TaggedVerse`, `StrongsEntry`, `ConcordanceResponse`, `WordSelection`, etc. |
| `src/lib/lexiconService.ts` (new) | `loadTaggedChapter()`, `getStrongsEntry()` (shard fetch + Map caches, mirrors `completeBible.ts` loader pattern), `searchOccurrences()` (calls the API route), `isValidStrongsId()`. |
| `src/lib/biblehub.ts` (new) | Pure URL builders + explicit 66-book slug map (`'Song of Solomon' → 'songs'`, `'1 Corinthians' → '1_corinthians'`). `strongsLexiconUrl('G26')` → `https://biblehub.com/greek/26.htm`; also `englishmansConcordanceUrl`, `interlinearUrl`, `lexiconPageUrl`. |

## 3. UI components

| File | Change |
|---|---|
| `src/components/TaggedVerseText.tsx` (new) | Memoized inline token renderer. Tagged tokens are focusable `role="button"` spans; click/Enter/Space call `onWordSelect` **with `stopPropagation()`** so existing verse selection is untouched. Untagged/italic tokens render plain. |
| `src/components/WordStudyPanel.tsx` (new) | Sheet (bottom on mobile, right on desktop). Two views: **entry view** (lemma, transliteration/pronunciation, Strong's badge, definitions, KJV usage, concordance occurrences, BibleHub links) and **interlinear view** (tagged KJV verse with clickable words, used via the toolbar button; "Back to verse" returns from entry to interlinear). Multiple Strong's IDs on one token render as tab buttons. |
| `src/components/VerseComponent.tsx` (modified) | New optional props `taggedTokens` / `onWordSelect` / `onWordStudy`. Renders `TaggedVerseText` instead of plain `verse.text` (both standard and continuous modes) only when tokens+handler provided; otherwise behavior is byte-identical to before. Forwards `onWordStudy` to its `VerseStudyToolbar`. |
| `src/components/VerseStudyToolbar.tsx` (modified) | New optional `onWordStudy` prop → purple "Word Study" button (Languages icon). Hidden when prop is undefined. |
| `src/components/BibleReader.tsx` (modified) | Loads tagged chapter when `lexiconEnabled && lexiconInlineWords && translation ∈ TAGGED_TRANSLATIONS` (currently `{'KJV'}`); holds `wordSelection` / `interlinearVerse` state; mounts `WordStudyPanel`; passes word-study props to both render modes and both toolbars. Panel state resets on navigation. |
| `src/app/lexicon/[strongsId]/page.tsx` (new) | Shareable concordance page: entry header, BibleHub links, paginated occurrence list with book + English-rendering filters; results navigate via `buildBibleSearchParams`. Validates the ID and handles a missing backend gracefully. |

## 4. Settings

`src/components/UserPreferencesProvider.tsx` — three new prefs (default **on**, persisted through
the existing JSONB blob automatically): `lexiconEnabled`, `lexiconInlineWords`,
`lexiconShowTransliteration`.
`src/components/Settings.tsx` — new "Word Study / Lexicon" switch group under Reading Preferences.

## 5. Concordance backend (built, NOT yet applied — see §7)

| File | Purpose |
|---|---|
| `database/migrations/003_lexicon_concordance.sql` (new) | `strongs_occurrences` table (one row per Strong's-ID × verse, with denormalized KJV verse text), indexes, RLS anon-SELECT policy, RPCs `get_strongs_occurrences` (paginated, canonical order, book/surface filters) and `get_strongs_summary` (total + per-rendering counts). |
| `scripts/import-strongs-occurrences.mjs` (new) | Populates the table (~790k rows) from `public/bible-tagged-kjv/`; idempotent (clears then batch-inserts). Needs `SUPABASE_SERVICE_ROLE_KEY`. |
| `src/app/api/lexicon/occurrences/route.ts` (new) | `GET ?strongs=G26[&book=&surface=&page=&limit=]`. Validates `^[HG]\d{1,4}$` (400 otherwise), falls back to the anon key (data is public-read), sets `Cache-Control: public, max-age=86400, s-maxage=31536000`. |

## 6. Misc

- `package.json`: new script `build:lexicon`.
- `.gitignore`: `/data-sources`.
- `../.claude/launch.json` (repo root): dev-server launch config for preview tooling.

## 7. ⚠ Pending manual step (only thing not done)

The concordance DB is **not set up**: the `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is invalid
for the app's Supabase project (`sashweqonmydtaaavxtl`), and neither the Supabase MCP nor the CLI
login has access to that project (they point at *different* projects — do not apply this migration
through them). Until fixed, `/api/lexicon/occurrences` returns 500 and the UI shows a graceful
"occurrence search unavailable" message; everything else works.

To finish:
1. Run `database/migrations/003_lexicon_concordance.sql` in the Supabase dashboard SQL editor
   (project `sashweqonmydtaaavxtl`).
2. Refresh `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (the stale key also breaks the existing
   search APIs).
3. `node scripts/import-strongs-occurrences.mjs`
4. Verify: `curl "localhost:3000/api/lexicon/occurrences?strongs=G26"` returns results and the
   panel's Occurrences section populates.

Two related pre-existing issues were spun off as separate tasks: the invalid service key, and
Song of Solomon missing from `public/bible-json-kjv/` + `public/bible-json-web/`.

## 8. Verification already performed

- `npm run build:lexicon`: 1,189 chapters / 31,102 verses, round-trip check passes, all 13,654
  referenced Strong's IDs resolve in the dictionary.
- `npx tsc --noEmit` and `npm run build` pass (new routes `/lexicon/[strongsId]` and
  `/api/lexicon/occurrences` appear in the build output).
- Browser E2E (dev server): John 3:16 KJV shows 21 clickable words; "loved" → G25 ἀγαπάω card with
  correct BibleHub links (`greek/25.htm`, `greek/strongs_25.htm`, `interlinear/john/3-16.htm`);
  phrase "only begotten" → G3439; verse click still opens the study toolbar (now with Word Study);
  toolbar → interlinear view → word → entry → "Back to verse" all work; `/lexicon/G25` renders;
  `?strongs=XSS` → 400; zero console errors.
