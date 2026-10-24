import type { CSSProperties } from 'react'
import type { Book, GenreFilter, SpineFont, SpineType } from '../types/book'

export const spineTypography: Record<SpineType, { title: CSSProperties; author: CSSProperties }> = {
  serif: {
    title: { fontFamily: "'EB Garamond', serif", fontWeight: 500, letterSpacing: '0.01em' },
    author: { fontFamily: "'EB Garamond', serif", fontStyle: 'italic' },
  },
  sans: {
    title: { fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '-0.01em' },
    author: { fontFamily: "'Inter', sans-serif", fontWeight: 500 },
  },
  condensed: {
    title: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
    author: {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
  mono: {
    title: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    author: { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 400, textTransform: 'uppercase' },
  },
}

// Title and author styles for a spine or typeset cover. A cover-matched font
// replaces the generic style; the author keeps its weight but follows the font.
export function spineStyles(type: SpineType, font?: SpineFont): { title: CSSProperties; author: CSSProperties } {
  const base = spineTypography[type]
  if (!font) return base
  return {
    title: {
      fontFamily: font.family,
      fontWeight: font.weight,
      textTransform: font.transform ?? 'none',
      letterSpacing: font.tracking ?? '0.01em',
    },
    author: {
      fontFamily: font.family,
      fontWeight: 400,
      textTransform: font.transform === 'lowercase' ? 'none' : font.transform,
    },
  }
}

export function authorSurname(author: string): string {
  const first = author.split('&')[0].trim()
  const parts = first.split(' ')
  return parts[parts.length - 1]
}

export const genreCodes: Record<GenreFilter, string> = {
  All: '000',
  Fiction: 'FIC',
  'Self-help': 'SH',
  Business: 'BUS',
  'Sci-Fi': 'SF',
  'Mystery & Thriller': 'MYS',
  Fantasy: 'FAN',
  Romance: 'ROM',
}

export function callNumber(book: Book, index: number): string {
  return `${genreCodes[book.genre]}-${String(index + 1).padStart(3, '0')}`
}
