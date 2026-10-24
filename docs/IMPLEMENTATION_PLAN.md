# Implementation plan

A shared bookshelf of the best books to read in 2026. People who open the link can browse the shelf, pull a book out to read who recommended it and why, and add their own favorite for everyone to see.

The original build guide ([virtual_library_build_guide.md](../virtual_library_build_guide.md)) is the reference for interactions and motion. The layout comes from the "Index" direction of the Magic Patterns design, recolored as a warm reading room.

---

## 1. Status

**Done**
- Vite + React 19 + TypeScript + Tailwind v4 project; build and lint pass.
- "Index" UI ported from Magic Patterns: header with genre list, flat-spine shelf with hover card, side detail panel, add-book dialog.
- Data layer: one `Book` type, seven starter books from `data/favorite_books_2026.csv` (recommended by Laura), visitor books via Supabase (or in memory without it).
- "Add a book": Open Library search → pick → genre, name, note → shelved and opened. Retries once, says when Open Library is slow.
- Cover rules: hotlinked, credited ("Cover via Open Library ↗" to the cover's edition), known sources only, non-commercial.
- Covers preload in the background; hover jumps the queue.
- Warm palette: off-white paper, cloth-binding spines with gilt bands, walnut shelf, oxblood accent.

**This round** (phases A–D below)
1. Supabase: visitor books saved and shared.
2. Mobile optimization.
3. Spine colors matched to each book's cover.
4. Google Books API as a second source for search and covers.

**Not this round**
- Amazon affiliate program (decided 2026-10-24; would make the site commercial: Impressum, ad labeling, affiliate links).
- 3D shelf + pull-out animation, cover picker, moderation queue (see §5 Later).

---

## 2. Architecture

```
Browser (Vite + React SPA)
 ├─ starterBooks.ts ─────────────┐
 ├─ Supabase: favorite_books ────┼─► BookRecord[] ─► toBook() ─► Book[] ─► Bookshelf / BookDetailPanel
 │   (public read + insert)      │                   ├─ deriveAppearance(): size, lettering, fallback cloth color
 │                               │                   └─ cover palette (phase C): spine / band / ink from the cover
 ├─ Open Library ◄── AddBookDialog (search), BookCover (images), preloadCovers
 └─ Google Books ◄── AddBookDialog (search, phase D), fallback covers
```

- **No custom server.** The browser talks to Supabase with the public anon key. Row-level security allows read and insert only, with length and cover-source checks.
- **Hosting:** static build on Vercel or Netlify from GitHub; the Supabase env vars are set in the host's dashboard.
- **Store content, derive appearance.** The database holds only content (title, author, genre, cover, recommender, note…). Everything visual is computed in the browser, so design changes never need a migration.

---

## 3. This round

### Phase A: Supabase (visitor books saved for everyone) ✅

**Status 2026-10-24:** project created (EU), table + policies live, `.env` set. Verified: invalid inserts rejected (empty/long name or note, unknown genre, foreign or uncredited cover); a book added in one browser appears in another; edit/delete with the public key change 0 rows. Done since: a new book drops onto the shelf, then opens (~0.9 s); duplicates (same Open Library work, or same title + author) are marked "On the shelf" in search and picking one offers "Open it" instead of adding; load/save failures show plain messages, with a 12 s timeout. `0002_revoke_write_privileges.sql` applied: edit/delete with the public key are now refused outright (401, permission denied). **Phase A complete.**

Code is ready (`hooks/useFavoriteBooks.ts`, `lib/supabase.ts`, the SQL). What's left is setup and testing.

**Laura (~10 minutes):**
1. Create a free project at supabase.com (region: EU, e.g. Frankfurt).
2. SQL Editor → paste and run [supabase/migrations/0001_favorite_books.sql](../supabase/migrations/0001_favorite_books.sql).
3. Project Settings → API: copy the **Project URL** and the **anon public key**.
4. Copy `.env.example` to `.env` and fill in both values. Never commit `.env`.

**Claude:**
- Run the SQL checks against the real database: valid insert works; empty name, empty note, 501-char note, non-allowlisted cover, update and delete are all rejected.
- Add a book in one browser, reload in another: it appears.
- After adding: scroll the new spine into view and play a short shelve-in animation (`justAdded` is already tracked).
- Duplicates: if the same Open Library work is already on the shelf, open it instead and say "Already on the shelf". *(Decision needed, §6.)*
- Error states: Supabase down → shelf still shows starter books, the dialog shows a clear message.

**Done when:** a book added on one device shows up on another, and the SQL rejects every bad insert above.

### Phase B: Mobile optimization

Current state: the layout stacks, spines scale to 76% on phones, but hover-only details and the side panel aren't built for touch.

- **Header:** smaller heading on phones; genre list as a horizontal, scrollable row of pills instead of a two-column grid, so the shelf is visible without scrolling.
- **Shelf:** touch scrolling with momentum; tap opens a book (no hover card on touch devices); a subtle fade at the edges hints that it scrolls; the shelf sits in the lower part of the first screen.
- **Detail panel:** becomes a bottom sheet on screens under 640px (full width, rounded top, swipe down or tap outside to close); cover smaller and next to the title to save height; previous/next stay reachable with the thumb.
- **Add-book dialog:** full-screen on phones; search field first, results list fills the screen; the keyboard mustn't cover the submit button; spine preview hidden (already the case).
- **Touch targets:** at least 44×44px for close, previous/next, genre and pick buttons.
- **Performance:** fewer covers preloaded on mobile data (`navigator.connection.saveData`, or first 15 only); images sized `-M` in lists.
- **Test on:** iPhone Safari (390px), Android Chrome (360px), iPad portrait; real devices via the local network (`npm run dev -- --host`).

**Done when:** on a phone you can browse, open and step through books, and add one, all one-handed with no layout breaks.

### Phase C: Spine colors from the cover

Today spines get a cloth color from a fixed palette by hash, so The Midnight Library's spine is teal while its cover is navy. Instead:

- `lib/coverPalette.ts`: load the cover (small `-S` size is enough) with `crossOrigin="anonymous"`, draw it to a ~40px canvas, and pick:
  - `spine`: the dominant color of the cover's left edge strip (where a real spine would continue the design), falling back to the whole cover's dominant color if the edge is near-white or near-black noise;
  - `band`: the most saturated mid-tone color on the cover, or gilt if nothing stands out;
  - `ink`: dark or cream lettering depending on the spine's brightness (WCAG contrast ≥ 4.5).
- **Keep it cozy:** nudge sampled colors toward the cloth palette (slightly lower saturation, never pure white or black), so a neon cover still looks like a book on a library shelf.
- **Cache:** results stored by cover URL in memory and `localStorage`, so spines don't flash on reload. Computed once per cover, as part of preloading.
- **Same image cache:** `BookCover` and `preloadCovers` must also load with `crossOrigin="anonymous"`, otherwise the browser downloads every cover twice. Verified 2026-10-24: Open Library and archive.org send CORS headers along the whole redirect chain.
- **Fallbacks:** no cover or sampling fails → today's hash cloth color. Books without a cover (e.g. *Vom Mut, frei zu sein*) keep the palette color.
- The typeset fallback cover and the add-book preview use the same sampled colors.

**Done when:** each starter book's spine is recognisably the color of its cover, with readable lettering, and reloading shows the right colors immediately.

### Phase D: Google Books API

Open Library is often slow (5–10 s searches) and misses newer or German titles (*Vom Mut, frei zu sein* has no entry). Google Books fills both gaps.

**Laura (~5 minutes):**
1. console.cloud.google.com → create a project.
2. APIs & Services → Library → **Books API** → Enable.
3. APIs & Services → Credentials → Create credentials → **API key**.
4. Restrict the key: API restriction "Books API"; website restriction `http://localhost:5173/*` now, the live domain once published. (The key is visible in the browser by design; the restrictions are what protect it.)
5. Add `VITE_GOOGLE_BOOKS_KEY=…` to `.env`. Don't paste the key in chat.

Without a key the shared anonymous quota runs out daily (we hit HTTP 429 on 2026-10-24), so the key is required.

**Claude:**
- `lib/googleBooks.ts`: `searchBooks(q, signal)` against `https://www.googleapis.com/books/v1/volumes` with `printType=books`, `maxResults=12`, the key, and `langRestrict` left open so German titles are found. Maps to the same result shape as Open Library: title, author, year, pages, cover, credit page (`canonicalVolumeLink`), plus `source: 'googlebooks'`.
- **Covers:** use `imageLinks.thumbnail`, force `https://`, and request a larger size (`zoom=1` → drop `&edge=curl`; try `zoom=0`/`fife=w400` and fall back if it 404s). Google thumbnails are small (~128px), so prefer Open Library's cover when both sources have the book.
- **Search UX:** query both sources in parallel; show whichever answers first, then merge. De-duplicate by ISBN, else normalised title + author. Label each result's source subtly ("Open Library" / "Google Books").
- **Credit:** "Cover via Google Books ↗" linking to the volume page. `covers.ts` and the SQL already allow Google's image and page hosts; verify against real results and adjust the allowlist if Google returns another host.
- **Starter books:** look up *Vom Mut, frei zu sein* on Google Books and add its cover if one exists.
- **Errors:** if Google fails or the quota is hit, search silently continues with Open Library only.
- **Spine colors (phase C):** Google image hosts must send CORS headers for color sampling; check, and fall back to palette colors if not.

**Done when:** searching finds books Open Library doesn't have (test: *Vom Mut, frei zu sein*), results arrive faster when Open Library is slow, and Google covers show with the right credit link.

---

## 4. Data model

Defined in [src/types/book.ts](../src/types/book.ts).

- `BookRecord`: content. Starter books in [src/data/starterBooks.ts](../src/data/starterBooks.ts) (generated from [data/favorite_books_2026.csv](../data/favorite_books_2026.csv)); visitor books are rows in Supabase.
- `BookAppearance`: binding, spine/band/ink colors, lettering type, size, lean, depth, wear. Never stored.
- `Book = BookRecord & BookAppearance`: what the UI renders. `SeedBook` lets books in code pin parts of their look.

Supabase table `favorite_books`:

| Column | Rule |
|---|---|
| `recommender` | required, 1–60 chars |
| `title` | required, 1–300 chars |
| `author` | ≤ 200 chars |
| `genre` | one of Fiction, Nonfiction, Sci-Fi, Mystery & Thriller, Fantasy, Romance |
| `note` | required, 1–500 chars |
| `cover`, `cover_source`, `cover_page_url` | all empty, or image + credit page from the same known source |

### Cover rules

In [src/lib/covers.ts](../src/lib/covers.ts) and the SQL constraint `cover_from_known_source`; keep them in sync.

1. **Hotlink, don't copy.** Only the image URL is stored.
2. **Credit every cover** with "Cover via Open Library ↗", linking to the edition the image belongs to.
3. **Known sources only:** Open Library and Google Books.
4. **Non-commercial, quick removal.** No ads or affiliate links; unwanted entries are deleted in the Supabase dashboard.

---

## 5. Later (not this round)

| Item | Notes |
|---|---|
| Cover picker | Choose between editions' covers, or a designed cover. |
| 3D shelf + pull-out animation | From the build guide: curved perspective, hover pull, book slides out to face you. |
| Publish | Vercel/Netlify, `og:` tags, favicon, test the public link. |
| Moderation | `approved` column or captcha if spam appears. |
| Amazon affiliate | Explicitly out for this round. |

---

## 6. Open questions

1. **Duplicates:** if someone adds a book that's already on the shelf, open the existing one, or add a second spine with their note?
2. **Shelf order:** newest visitor books first, then starter books (current), or mixed?
3. **Moderation:** is open posting fine for launch?

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Spam or offensive entries | Length limits and cover allowlist in the database; delete via dashboard; moderation later. |
| Cover art copyright (EU has no broad fair use) | Cover rules above. Not legal advice. |
| Open Library slow or down (5–10 s searches, 3–8 s covers) | Retry + "slow" note in search; covers preloaded; typeset cover until the image arrives; Google Books as a parallel source (phase D). |
| Google Books quota or key misuse | Restrict the key to the Books API and our domains; Open Library keeps working if Google fails. |
| Supabase free project pauses after a week without traffic | Visiting the site keeps it active; otherwise resume it in the dashboard. |
| Sampled cover colors look garish | Nudge toward the cloth palette; fall back to palette colors. |

---

## 8. Running locally

```bash
npm install
npm run dev      # http://localhost:5173  (add -- --host to test on a phone)
npm run build    # type-check + production build
npm run lint
```

Without `.env`, visitor books are kept only until reload; the add-book dialog says so.
