# Project log: Digital Bookshelf

**Live:** https://digital-bookshelf-ten.vercel.app
**Built:** Saturday 24 October 2026, one afternoon (15:30–18:15, under three hours), Laura + Claude Code.

## What we built

A shared virtual bookshelf of the best books to read in 2026. Seven starter books sit on a walnut shelf, each spine coloured from its real cover and lettered in a font that echoes the cover. Click a spine to read who recommended the book and why. Anyone with the link can add their favourite book: search Open Library, pick it, choose a genre, add a first name and a reason, and it drops onto the shelf for everyone. It works on phones (genre pills, swipe-to-close book sheet) and runs on React + Vite, Supabase and Vercel.

## How it went

1. **Start:** the GitHub fork turned out to hold no code, only a build guide written for vibe-coding tools. We used it as a spec and scoped down: shelf, pull-out, recommendations, visitor uploads. AI search and Goodreads import were left out.
2. **Scaffolding + plan:** Vite/React/Tailwind project, data model, Supabase schema, phased implementation plan.
3. **Design:** brought in the "Index" direction from a Magic Patterns prototype, then recoloured it over several rounds: grey (dull) → beige (too nude) → dark library (no) → warm off-white with walnut ink and a burnt orange accent.
4. **Real data:** starter books read live from a CSV; covers and credits from Open Library; visitor books stored in Supabase with row-level security.
5. **Polish:** spine colours sampled from covers, cover-matched fonts, mobile layout, new genres (Self-help, Business).
6. **Ship:** pushed to GitHub, deployed to Vercel.

## Unexpected turns and learnings

- **Cover rights shaped the architecture.** Instead of copying images, covers are hotlinked from the source and every one is credited and linked. The idea of using Amazon images via the affiliate program was dropped: it would have made the site commercial, which in Germany means an Impressum with a home address.
- **Open Library is free but slow** (5–10 s searches, covers via archive.org redirects). That led to background preloading, retries, a "slow" note, and a quiet placeholder instead of a stand-in cover that looked "wrong, then changed".
- **The cover link didn't match the cover:** Open Library's book page can show a different edition's cover, so credits now point to the exact edition.
- **Google Books was tried and dropped:** its results were mostly study guides and academic books *about* the title, its covers were small and couldn't be colour-sampled, and the API failed most of the time.
- **Supabase defaults are generous:** new tables let the public key update and delete. Row-level security blocked it anyway, but we revoked the rights explicitly as a second lock. And the "Project URL" pasted with `/rest/v1/` on the end broke everything until trimmed.
- **One stray quote mark in the CSV** merged two books into one description. The app now warns when that happens.
- **Spine colours from covers** worked because Open Library sends the right CORS headers. The first version picked a white table over Heft's textured wallpaper until colours were grouped more coarsely.
- **Design by reaction works:** most visual decisions came from seeing a screenshot and saying "not that". It was fast because colours live in a single tokens file.

## Still open

Connect Vercel to GitHub for automatic deploys, a link-preview image, a custom domain, moderation if spam appears, and the 3D shelf with the pull-out animation from the original guide.
