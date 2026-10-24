import type { CSSProperties } from 'react'
import type { Book, GenreFilter, SpineType } from '../types/book'

export const spineShadow =
  'inset 2px 0 0 rgba(255,255,255,0.14), inset -3px 0 0 rgba(0,0,0,0.16), inset 0 -1px 0 rgba(0,0,0,0.2)'

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

export function authorSurname(author: string): string {
  const first = author.split('&')[0].trim()
  const parts = first.split(' ')
  return parts[parts.length - 1]
}

export const genreCodes: Record<GenreFilter, string> = {
  All: '000',
  Fiction: 'FIC',
  Nonfiction: 'NF',
  'Sci-Fi': 'SF',
  'Mystery & Thriller': 'MYS',
  Fantasy: 'FAN',
  Romance: 'ROM',
}

export function callNumber(book: Book, index: number): string {
  return `${genreCodes[book.genre]}-${String(index + 1).padStart(3, '0')}`
}
