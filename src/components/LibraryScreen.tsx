import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Bookshelf } from './Bookshelf'
import { BookDetailPanel } from './BookDetailPanel'
import { AddBookDialog } from './AddBookDialog'
import { IndexHeader } from './IndexHeader'
import { mockBooks } from '../data/mockBooks'
import { starterBooks } from '../data/starterBooks'
import { useCoverPalettes } from '../hooks/useCoverPalettes'
import { useFavoriteBooks } from '../hooks/useFavoriteBooks'
import { useIsPhone } from '../hooks/useIsPhone'
import { useLibrary } from '../hooks/useLibrary'
import { toBook, withCoverPalette } from '../lib/appearance'
import { preloadCovers } from '../lib/preloadCovers'
import { callNumber } from '../lib/spine'
import type { Book, NewFavorite } from '../types/book'

// Mock books fill the shelf until the real starter list exists.
const seedBooks = starterBooks.length > 0 ? starterBooks : mockBooks

export function LibraryScreen() {
  const favorites = useFavoriteBooks()
  const shelved = useMemo(() => [...favorites.books, ...seedBooks].map(toBook), [favorites.books])
  // Spine colors from the covers. Sampling downloads each cover, so it's
  // capped like preloading (lower on phones and data saver); books past the
  // cap keep their palette color.
  const isPhone = useIsPhone()
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  const coverCap = saveData ? 12 : isPhone ? 24 : 60
  const palettes = useCoverPalettes(shelved.slice(0, coverCap).map((b) => b.cover))
  const books = useMemo(() => shelved.map((b) => withCoverPalette(b, palettes[b.cover])), [shelved, palettes])
  const library = useLibrary(books)
  const [adding, setAdding] = useState(false)

  // Fetch covers in the background so the detail panel opens with the cover
  // already there. Capped so a large shelf doesn't download hundreds of images.
  useEffect(() => {
    const covers = books.slice(0, coverCap).map((b) => b.cover)
    // Safari lacks requestIdleCallback; a short timeout is close enough there.
    if (typeof requestIdleCallback !== 'function') {
      const id = setTimeout(() => void preloadCovers(covers), 500)
      return () => clearTimeout(id)
    }
    const id = requestIdleCallback(() => void preloadCovers(covers), { timeout: 2000 })
    return () => cancelIdleCallback(id)
  }, [books, coverCap])

  // Let the new book drop onto the shelf first, then open it.
  const handleAdd = async (input: NewFavorite) => {
    const book = await favorites.addFavorite(input)
    setAdding(false)
    library.clearFilters()
    setTimeout(() => library.setSelectedId(book.id), 900)
  }

  // A book counts as already shelved if it's the same Open Library work, or
  // has the same title and author (starter books may have no key).
  const findOnShelf = (candidate: { key: string; title: string; author: string }): Book | undefined => {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
    return books.find(
      (b) =>
        (candidate.key && b.openLibraryKey === candidate.key) ||
        (norm(b.title) === norm(candidate.title) && norm(b.author) === norm(candidate.author)),
    )
  }

  const openExisting = (id: string) => {
    setAdding(false)
    library.clearFilters()
    library.setSelectedId(id)
  }

  return (
    <div className="lamp-glow flex min-h-screen w-full flex-col font-ui text-ink antialiased">
      <IndexHeader
        genre={library.genre}
        onGenreChange={library.setGenre}
        counts={library.counts}
        total={library.books.length}
        onAddBook={() => setAdding(true)}
      />

      <main className="flex flex-1 flex-col justify-end pt-6 pb-8">
        <Bookshelf
          books={library.visibleBooks}
          total={library.books.length}
          selectedId={library.selectedId}
          onSelect={(id) => library.setSelectedId(id === library.selectedId ? null : id)}
          query={library.query}
          onClearFilters={library.clearFilters}
          justAdded={favorites.justAdded}
          notice={favorites.error}
        />
      </main>

      <AnimatePresence>
        {library.selectedBook && (
          <BookDetailPanel
            key="detail"
            book={library.selectedBook}
            position={Math.max(1, library.selectedVisibleIndex + 1)}
            total={library.visibleBooks.length}
            callNo={callNumber(library.selectedBook, library.selectedCatalogueIndex)}
            onClose={() => library.setSelectedId(null)}
            onPrev={() => library.selectRelative(-1)}
            onNext={() => library.selectRelative(1)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adding && (
          <AddBookDialog
            key="add"
            shared={favorites.shared}
            onClose={() => setAdding(false)}
            onAdd={handleAdd}
            findOnShelf={findOnShelf}
            onOpenExisting={openExisting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
