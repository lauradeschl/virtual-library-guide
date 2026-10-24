import type { CoverSource } from '../lib/covers'

export type Genre = 'Fiction' | 'Self-help' | 'Business' | 'Sci-Fi' | 'Mystery & Thriller' | 'Fantasy' | 'Romance'

export type GenreFilter = Genre | 'All'

export type SpineType = 'serif' | 'sans' | 'condensed' | 'mono'

// Lettering that mimics a specific cover's typeface (set by hand for starter
// books in starterCovers.ts). Overrides the generic SpineType title style.
export type SpineFont = {
  family: string // CSS font-family, loaded in styles.css
  weight: number
  transform?: 'uppercase' | 'lowercase'
  tracking?: string // letter-spacing
}

// What a book *is*. Stored for starter books in code and for visitor
// books in Supabase. Contains no visual decisions, so the design can
// change without migrating data.
export type BookRecord = {
  id: string
  title: string
  author: string
  genre: Genre
  year: number // first publish year, 0 if unknown
  cover: string // hotlinked image URL from coverSource, '' if none
  coverSource: CoverSource | ''
  coverPageUrl: string // the book's page at coverSource, for the credit link
  openLibraryKey: string // e.g. '/works/OL82563W', seeds deterministic appearance
  pages: number // 0 if unknown
  publisher: string
  recommender: string // '' when unknown (mock books)
  note: string // why they recommend it
  addedAt: string // ISO timestamp, '' for books defined in code
}

// How a book *looks* on the shelf. Derived from a BookRecord at render
// time (see lib/appearance.ts), never stored.
export type BookAppearance = {
  binding: 'hardcover' | 'paperback' | 'mass'
  finish: 'cloth' | 'gloss' | 'matte'
  spine: string // base color
  band?: string // accent color
  ink: string // lettering color
  type: SpineType // lettering style
  font?: SpineFont // cover-matched lettering, overrides `type` for the title
  width: number // spine width, px
  height: number // spine height, px
  lean: number // degrees
  depth: number // px forward/back on the shelf
  wear: number // 0–1
}

export type Book = BookRecord & BookAppearance

// Books defined in code (starter and mock books) may pin parts of their
// look, e.g. hand-picked spine colors. Visitor books never do.
export type SeedBook = BookRecord & { look?: Partial<BookAppearance> }

// What a visitor submits from the "Add a book" dialog.
export type NewFavorite = Omit<BookRecord, 'id' | 'addedAt'>
