import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { BookCover } from './BookCover'
import { CoverCredit } from './CoverCredit'
import { easeOut } from '../lib/motion'
import type { Book } from '../types/book'

interface BookDetailPanelProps {
  book: Book
  position: number
  total: number
  callNo: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function BookDetailPanel({ book, position, total, callNo, onClose, onPrev, onNext }: BookDetailPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, onPrev])

  const labelClass = 'font-meta text-[11px] uppercase tracking-[0.12em] text-muted'

  const rows: { label: string; value: string }[] = [
    { label: 'Call no.', value: callNo },
    { label: 'Genre', value: book.genre },
    { label: 'Published', value: book.year ? String(book.year) : '—' },
    { label: 'Pages', value: book.pages ? String(book.pages) : '—' },
  ]

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

  return (
    <div className="fixed inset-0 z-40">
      <motion.div
        className="absolute inset-0 bg-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-detail-title"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.26, ease: easeOut }}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col overflow-y-auto border-l border-rule bg-panel text-ink"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className={`text-xs tabular-nums ${labelClass}`}>
            {position} / {total}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrev} aria-label="Previous book" className={iconButton}>
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={onNext} aria-label="Next book" className={iconButton}>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className={iconButton} autoFocus>
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center bg-canvas pt-12 pb-6">
          <BookCover book={book} />
          <div className="mt-4 h-4">
            <CoverCredit book={book} />
          </div>
        </div>

        <div className="flex-1 px-7 py-8">
          <h2 id="book-detail-title" className="font-display text-[34px] leading-[1.05]">
            {book.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{book.author}</p>

          <dl className="mt-8 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[110px_1fr] items-baseline border-t border-rule py-3">
                <dt className={labelClass}>{row.label}</dt>
                <dd className="tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-rule pt-6">
            <p className={`text-sm ${labelClass}`}>Why it’s on the shelf</p>
            <p className="mt-3 font-display text-xl italic leading-snug">{book.note || 'No note yet.'}</p>
            {book.recommender && <p className="mt-3 text-sm text-muted">— {book.recommender}</p>}
          </div>
        </div>
      </motion.aside>
    </div>
  )
}
