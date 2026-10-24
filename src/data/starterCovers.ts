// Open Library data for the starter books in data/favorite_books_2026.csv,
// keyed by the CSV's Title (must match exactly). Looked up 2026-10-24.
// pageUrl points at the edition the cover image belongs to (the work page can
// show a different edition's cover); Heft's cover is only on the work.
// "Vom Mut, frei zu sein" isn't on Open Library or Google Books, so it has no
// cover image; its spine colors and font are matched by eye to the real cover
// (butter yellow, royal blue title, light blue author).
// `font` mimics the cover's title lettering on the spine (fonts in styles.css).
// `palettes` are the spine colors lib/coverPalette.ts samples from these covers,
// baked in so first-time visitors see them before the images arrive. Re-sample
// (clear localStorage 'coverPalette:v2', reload, copy it) if a cover changes.

import type { CoverPalette } from '../lib/coverPalette'
import type { BookAppearance, SpineFont } from '../types/book'

type StarterCover = {
  cover: string // '' when the book has no cover image we can use
  pageUrl: string
  key: string
  pages: number
  font?: SpineFont
  look?: Partial<BookAppearance> // hand-picked colors for books without a cover image
}

const ol = (coverId: number, page: string, key: string, pages: number, font?: SpineFont): StarterCover => ({
  cover: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
  pageUrl: `https://openlibrary.org${page}`,
  key,
  pages,
  font,
})

export const starterCovers: Record<string, StarterCover> = {
  Heft: ol(8251335, '/works/OL16126318W', '/works/OL16126318W', 352, { family: "'Alfa Slab One', serif", weight: 400 }),
  'The Midnight Library': ol(10313767, '/books/OL28401522M', '/works/OL20965973W', 304, {
    family: "'Playfair Display', serif",
    weight: 700,
    transform: 'uppercase',
    tracking: '0.06em',
  }),
  'Long Bright River': ol(9247626, '/books/OL27886422M', '/works/OL20626992W', 473, {
    family: "'Big Shoulders Display', sans-serif",
    weight: 800,
    transform: 'uppercase',
    tracking: '0.08em',
  }),
  'Real Americans': ol(14817818, '/books/OL50728902M', '/works/OL37564592W', 400, {
    family: "'Oswald', sans-serif",
    weight: 500,
    transform: 'uppercase',
    tracking: '0.04em',
  }),
  'Tiny Experiments': ol(14850860, '/books/OL57563029M', '/works/OL42398133W', 304, {
    family: "'Poppins', sans-serif",
    weight: 500,
    transform: 'lowercase',
  }),
  'Vom Mut, frei zu sein': {
    cover: '',
    pageUrl: '',
    key: '',
    pages: 0,
    font: { family: "'Outfit', sans-serif", weight: 800, tracking: '-0.01em' },
    look: { spine: '#f2e4ac', ink: '#1e2f9c', band: '#6f9fd8' },
  },
  'Atomic Habits': ol(12539702, '/books/OL36647151M', '/works/OL17930368W', 322, {
    family: "'Jost', sans-serif",
    weight: 600,
  }),
}

export const starterPalettes: Record<string, CoverPalette> = {
  'https://covers.openlibrary.org/b/id/9247626-L.jpg': { spine: '#113341', band: '#c9a24a', ink: '#f3e7cf' },
  'https://covers.openlibrary.org/b/id/14817818-L.jpg': { spine: '#2f471d', band: '#bfae42', ink: '#f3e7cf' },
  'https://covers.openlibrary.org/b/id/14850860-L.jpg': { spine: '#e6dbc7', band: '#dc9971', ink: '#2a211b' },
  'https://covers.openlibrary.org/b/id/10313767-L.jpg': { spine: '#1b2439', band: '#d37e4d', ink: '#f3e7cf' },
  'https://covers.openlibrary.org/b/id/12539702-L.jpg': { spine: '#e6dbc7', band: '#b5825a', ink: '#2a211b' },
  'https://covers.openlibrary.org/b/id/8251335-L.jpg': { spine: '#946339', band: '#bd8655', ink: '#f3e7cf' },
}
