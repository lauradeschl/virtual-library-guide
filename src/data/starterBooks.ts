import csvText from '../../data/favorite_books_2026.csv?raw'
import { bookGenres } from './genres'
import { starterCovers, starterPalettes } from './starterCovers'
import { seedCoverPalettes } from '../lib/coverPalette'
import { parseCsv } from '../lib/csv'
import type { Genre, SeedBook } from '../types/book'

// Starter books, read straight from data/favorite_books_2026.csv, so saving
// the CSV updates the shelf. Columns: Title, Author, Year, Genre,
// Recommender, Why I recommend it. Cover data comes from starterCovers.ts;
// rows without an entry there show the typeset cover.

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const toGenre = (value: string, title: string): Genre => {
  const genre = bookGenres.find((g) => g.toLowerCase() === value.toLowerCase())
  if (!genre) console.warn(`favorite_books_2026.csv: unknown genre "${value}" for "${title}", using Fiction`)
  return genre ?? 'Fiction'
}

seedCoverPalettes(starterPalettes)

// A stray quote in the CSV makes a description swallow the following rows,
// which then show up as one long text with line breaks. Flag it loudly.
const rows = parseCsv(csvText)
for (const row of rows) {
  if (Object.values(row).some((value) => value.includes('\n'))) {
    console.warn(
      `favorite_books_2026.csv: the row "${row['Title']}" spans several lines. Check its quotes: a quote inside a text must be doubled (""), and the text must end with exactly one ".`,
    )
  }
}

export const starterBooks: SeedBook[] = rows
  .filter((row) => row['Title'])
  .map((row) => {
    const title = row['Title']
    const cover = starterCovers[title]
    return {
      id: `starter-${slug(title)}`,
      title,
      author: row['Author'] ?? '',
      genre: toGenre(row['Genre'] ?? '', title),
      year: Number(row['Year']) || 0,
      cover: cover?.cover ?? '',
      coverSource: cover?.cover ? 'openlibrary' : '',
      coverPageUrl: cover?.pageUrl ?? '',
      openLibraryKey: cover?.key ?? '',
      pages: cover?.pages ?? 0,
      publisher: '',
      recommender: row['Recommender'] ?? '',
      note: row['Why I recommend it'] ?? '',
      addedAt: '',
      look: cover ? { ...(cover.font && { font: cover.font }), ...cover.look } : undefined,
    }
  })
