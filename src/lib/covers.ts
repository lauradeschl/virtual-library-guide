// Cover rules:
// - Images are shown straight from the source (hotlinked), never copied
//   into our own storage. We only store the image URL.
// - Every cover is credited with a link to its page at the source.
// - Only known sources are accepted. Keep this list in sync with the
//   CHECK constraints in supabase/migrations/0001_favorite_books.sql.

export type CoverSource = 'openlibrary' | 'googlebooks'

type SourceRule = {
  label: string
  imagePrefixes: string[]
  pagePrefixes: string[]
}

export const COVER_SOURCES: Record<CoverSource, SourceRule> = {
  openlibrary: {
    label: 'Open Library',
    imagePrefixes: ['https://covers.openlibrary.org/'],
    pagePrefixes: ['https://openlibrary.org/'],
  },
  googlebooks: {
    label: 'Google Books',
    imagePrefixes: ['https://books.google.com/books/content', 'https://books.googleusercontent.com/'],
    pagePrefixes: ['https://books.google.com/', 'https://www.google.com/books/', 'https://play.google.com/store/books/'],
  },
}

const startsWithAny = (url: string, prefixes: string[]) => prefixes.some((p) => url.startsWith(p))

// A cover is valid when there is none at all, or when the image and the
// credit page both belong to the named source.
export function isAllowedCover(cover: string, source: CoverSource | '', pageUrl: string): boolean {
  if (!cover) return source === '' && pageUrl === ''
  if (!source) return false
  const rule = COVER_SOURCES[source]
  return startsWithAny(cover, rule.imagePrefixes) && startsWithAny(pageUrl, rule.pagePrefixes)
}

// Google returns http:// thumbnail URLs; browsers block those on https pages.
export const toHttps = (url: string) => url.replace(/^http:\/\//, 'https://')

// The "Cover via Open Library ↗" credit, or null for books without a cover.
export function coverCredit(book: { cover: string; coverSource: CoverSource | ''; coverPageUrl: string }) {
  if (!book.cover || !book.coverSource) return null
  return { label: `Cover via ${COVER_SOURCES[book.coverSource].label}`, href: book.coverPageUrl }
}
