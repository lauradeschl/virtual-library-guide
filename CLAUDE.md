# CLAUDE.md

## Project context

A personal virtual library: a 3D, infinitely scrolling bookshelf of real books, with hover cards, a pull-out detail view, AI natural-language search, and an optional visitor "Recommend a book" shelf.

- Repo: https://github.com/lauradeschl/virtual-library-guide (a fork of the original project).
- Reference build of the original: https://carollia-library.lovable.app/
- Goal: develop the experience further and change the books shown on the shelf.

## Current state of the repo

- `docs/IMPLEMENTATION_PLAN.md`: phased plan, file map with build status, open questions. Keep its status markers current.
- `virtual_library_build_guide.md`: the original build brief. Reference for interactions and motion values; its visual design is not adopted.
- Stack: Vite + React 19 + TS + Tailwind v4 + framer-motion + lucide-react.
- UI: the "Index" direction ported from the Magic Patterns export `Digital-Bookshelf-Library` (deleted 2026-10-24; it had four directions, only Index was kept). `LibraryScreen` → `IndexHeader`, `Bookshelf` → `BookSpine` → `SpineFace`, `BookDetailPanel` (real cover + `CoverCredit` + recommender), `AddBookDialog` (Open Library search → genre, name, note).
- Data flow: `LibraryScreen` merges visitor books (`useFavoriteBooks`) with seed books (`starterBooks`, or `mockBooks` while that's empty), maps them through `toBook` (`lib/appearance.ts`), and hands them to `useLibrary` for filtering/selection.
- One book type in `types/book.ts`: `BookRecord` (content) + `BookAppearance` (derived look) = `Book`. `SeedBook` lets books in code pin parts of their look (mock books keep hand-picked colors).
- Without Supabase env vars, added books live in memory for the visit; the dialog says so.
- Open Library is slow: covers redirect through archive.org (~3–8 s) and search takes 5–10 s and sometimes fails. `lib/preloadCovers.ts` fetches shelf covers in the background (first 60, 3 at a time, hover jumps the queue); `BookCover` shows preloaded covers instantly, else the typeset cover until the image fades in. Search retries once and shows a "slow" note after 4 s.

Commands: `npm run dev`, `npm run build` (tsc + vite), `npm run lint` (oxlint).

## Conventions

- Design direction: "Index" layout, recolored warm: neutral off-white paper, cloth-binding spine palette (`BINDINGS` in `lib/appearance.ts`), walnut shelf, oxblood accent, soft lamp glow. Laura rejected grey (dull), beige (too nude) and dark backgrounds. Colors, fonts and radii live in `src/theme/tokens.css` and are mapped to utilities (`bg-canvas`, `text-ink`, `border-rule`, `font-ui`…) in `src/styles.css`. Spine lettering faces live in `lib/spine.ts`.
- Store content, derive appearance: `BookRecord` holds content only; visuals come from `lib/appearance.ts` (hash of Open Library key) and cover sampling. Don't add visual columns to Supabase.
- Cover rules (see `src/lib/covers.ts` and the SQL constraint; keep them in sync): hotlink covers from the source and store only the URL; credit every shown cover with "Cover via {source} ↗" linking to the book's page there; accept only Open Library and Google Books; non-commercial, no ads or affiliate links; unwanted entries are removed in the Supabase dashboard.
- Code style: single quotes, no semicolons, 120 columns (ported files were run through Prettier with those settings).

## Scope (agreed 2026-10-24)

In scope:
- The 3D shelf display (scroll, curved perspective, hover pull and card).
- Pulling a book out into the detail view.
- Every book shows who recommended it and why ("Why should I read it?" note) in the detail view.
- A small set of starter books, each with a recommender and note.
- Anyone with the link can add their favorite book (Open Library search, name, note). It appears on the shelf for everyone.

Decisions:
- One shared shelf: starter and visitor books mixed, each with recommender + note (not the guide's two shelves).
- Starter books come from a list Laura provides (titles + why she recommends each); covers from Open Library or Google Books.
- Visitors pick books via search (Open Library + Google Books) and choose a cover, or a generated one; no image upload. Shared storage: Supabase (public read/insert, no update/delete).

Current round (see docs/IMPLEMENTATION_PLAN.md §3): Supabase, mobile optimization, spine colors from covers, Google Books API.

Out of scope for now: AI natural-language search, Goodreads import, Amazon affiliate program (decided 2026-10-24).

## Still relevant from the original guide

- Interaction and motion values (hover pull 96 / lift -26, 900ms pull-out with cubic-bezier(0.16, 1, 0.3, 1), shelf perspective) are the starting point.
- Don't invent placeholder books; starter books come from Laura's list.
