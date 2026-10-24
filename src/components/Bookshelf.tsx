import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookSpine } from './BookSpine'
import { useSpineScale } from '../hooks/useSpineScale'
import type { Book } from '../types/book'

interface BookshelfProps {
  books: Book[]
  total: number
  selectedId: string | null
  onSelect: (id: string) => void
  query: string
  onClearFilters: () => void
  justAdded?: string | null
  notice?: string | null
}

const plankClass = 'shelf-plank h-[14px]'

export function Bookshelf({
  books,
  total,
  selectedId,
  onSelect,
  query,
  onClearFilters,
  justAdded = null,
  notice = null,
}: BookshelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0
      if (atStart || atEnd) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const caption = `${books.length} of ${total} books`
  const scale = useSpineScale()

  return (
    <section aria-label="Bookshelf" className="relative w-full">
      <div ref={scrollRef} className="no-scrollbar overflow-x-auto overflow-y-hidden">
        {books.length > 0 ? (
          <ul className="flex min-w-max items-end gap-[2px] px-5 pt-20 sm:gap-[3px] sm:px-8 sm:pt-24 lg:px-12">
            <AnimatePresence mode="popLayout" initial={false}>
              {books.map((book) => (
                <BookSpine
                  key={book.id}
                  arriving={book.id === justAdded}
                  book={book}
                  selected={book.id === selectedId}
                  dimmed={selectedId !== null && book.id !== selectedId}
                  onSelect={onSelect}
                  scale={scale}
                />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="flex h-[358px] flex-col items-center justify-end gap-3 px-6 pb-16 text-center">
            <p className="font-display text-2xl text-ink">
              {query ? `Nothing on the shelf matches “${query}”.` : 'This section is empty for now.'}
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm text-muted underline underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              Show all books
            </button>
          </div>
        )}
      </div>

      <div className={plankClass} />

      <div className="flex items-center justify-between px-5 pb-5 pt-4 text-xs text-muted sm:px-8 lg:px-12">
        <span className="tabular-nums">
          {caption}
          {notice && <span className="ml-3 text-accent">{notice}</span>}
        </span>
        <span className="hidden sm:inline">Scroll to browse · Click a spine to pull it out</span>
      </div>
    </section>
  )
}
