import type { BookSearchResult } from './bookSearch'

type SearchDoc = {
  key: string
  title?: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  cover_edition_key?: string // the edition the cover image belongs to
  number_of_pages_median?: number
  publisher?: string[]
  isbn?: string[]
}

const FIELDS =
  'key,title,author_name,first_publish_year,cover_i,cover_edition_key,number_of_pages_median,publisher,isbn'

export const coverUrl = (coverId: number) => `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`

// Search Open Library by free text. Keeps only results with a title and cover.
// pageUrl (the credit link) is the cover's edition page when known, else the work page.
export async function searchOpenLibrary(q: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=${FIELDS}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Library search failed (${res.status})`)
  const data: { docs: SearchDoc[] } = await res.json()
  return data.docs
    .filter((d) => d.title && d.cover_i)
    .map((d) => ({
      id: d.key,
      source: 'openlibrary' as const,
      title: d.title!,
      author: d.author_name?.[0] ?? '',
      year: d.first_publish_year ?? 0,
      cover: coverUrl(d.cover_i!),
      pageUrl: d.cover_edition_key
        ? `https://openlibrary.org/books/${d.cover_edition_key}`
        : `https://openlibrary.org${d.key}`,
      pages: d.number_of_pages_median ?? 0,
      publisher: d.publisher?.[0] ?? '',
      openLibraryKey: d.key,
      isbns: (d.isbn ?? []).slice(0, 20),
    }))
}
