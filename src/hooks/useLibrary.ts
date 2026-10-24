import { useCallback, useMemo, useState } from 'react'
import { genres } from '../data/genres'
import type { Book, GenreFilter } from '../types/book'

// Filtering and selection over the shelf. The books themselves come from
// the caller (starter/mock books + visitor books).
export function useLibrary(books: Book[]) {
  const [genre, setGenre] = useState<GenreFilter>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const normalized = query.trim().toLowerCase()

  const matchesQuery = useCallback(
    (book: Book) =>
      !normalized || book.title.toLowerCase().includes(normalized) || book.author.toLowerCase().includes(normalized),
    [normalized],
  )

  const counts = useMemo(() => {
    const result = Object.fromEntries(genres.map((g) => [g, 0])) as Record<GenreFilter, number>
    books.forEach((book) => {
      if (!matchesQuery(book)) return
      result.All += 1
      result[book.genre] += 1
    })
    return result
  }, [books, matchesQuery])

  const visibleBooks = useMemo(
    () => books.filter((b) => (genre === 'All' || b.genre === genre) && matchesQuery(b)),
    [books, genre, matchesQuery],
  )

  const selectedBook = books.find((b) => b.id === selectedId) ?? null
  const selectedVisibleIndex = visibleBooks.findIndex((b) => b.id === selectedId)
  const selectedCatalogueIndex = books.findIndex((b) => b.id === selectedId)

  const selectRelative = (step: 1 | -1) => {
    if (!visibleBooks.length) return
    const base = selectedVisibleIndex < 0 ? 0 : selectedVisibleIndex
    const next = (base + step + visibleBooks.length) % visibleBooks.length
    setSelectedId(visibleBooks[next].id)
  }

  const clearFilters = () => {
    setGenre('All')
    setQuery('')
  }

  return {
    books,
    visibleBooks,
    counts,
    genre,
    setGenre,
    query,
    setQuery,
    selectedId,
    setSelectedId,
    selectedBook,
    selectedVisibleIndex,
    selectedCatalogueIndex,
    selectRelative,
    clearFilters,
  }
}
