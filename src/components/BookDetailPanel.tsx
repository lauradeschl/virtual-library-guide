import { useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { BookCover } from './BookCover'
import { CoverCredit } from './CoverCredit'
import { useIsPhone } from '../hooks/useIsPhone'
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

  // Phones: a bottom sheet you can swipe down to close; the page behind
  // mustn't scroll while it's open.
  const isPhone = useIsPhone()
  const dragControls = useDragControls()
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const labelClass = 'font-meta text-[11px] uppercase tracking-[0.12em] text-muted'

  const rows: { label: string; value: string }[] = [
    { label: 'Call no.', value: callNo },
    { label: 'Genre', value: book.genre },
    { label: 'Published', value: book.year ? String(book.year) : '—' },
    { label: 'Pages', value: book.pages ? String(book.pages) : '—' },
  ]

  const iconButton =
    'flex h-11 w-11 items-center justify-center rounded-full sm:h-9 sm:w-9 text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

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
        initial={isPhone ? { y: '100%' } : { x: 40, opacity: 0 }}
        animate={isPhone ? { y: 0 } : { x: 0, opacity: 1 }}
        exit={isPhone ? { y: '100%' } : { x: 40, opacity: 0 }}
        transition={{ duration: isPhone ? 0.32 : 0.26, ease: easeOut }}
        drag={isPhone ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose()
        }}
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[16px] bg-panel text-ink shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:max-w-[440px] sm:rounded-none sm:border-l sm:border-rule sm:shadow-none"
      >
        {/* Drag handle (phones): swipe the top of the sheet down to close. */}
        <div
          onPointerDown={(e) => isPhone && dragControls.start(e)}
          className="sticky top-0 z-10 touch-none bg-panel sm:static"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-rule sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-rule px-5 py-1 sm:py-3">
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
        </div>

        <div className="flex flex-col items-center bg-canvas pt-6 pb-4 sm:pt-12 sm:pb-6">
          <BookCover book={book} size={isPhone ? 'small' : 'regular'} />
          <div className="mt-4 h-4">
            <CoverCredit book={book} />
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7 sm:py-8">
          <div className="order-first">
            <h2 id="book-detail-title" className="font-display text-[28px] leading-[1.05] sm:text-[34px]">
              {book.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{book.author}</p>
          </div>

          <dl className="order-2 mt-6 text-sm sm:order-1 sm:mt-8">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[110px_1fr] items-baseline border-t border-rule py-3">
                <dt className={labelClass}>{row.label}</dt>
                <dd className="tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="order-1 mt-6 border-t border-rule pt-6 sm:order-2 sm:mt-0">
            <p className={`text-sm ${labelClass}`}>Why it’s on the shelf</p>
            <p className="mt-3 font-display text-xl italic leading-snug">{book.note || 'No note yet.'}</p>
            {book.recommender && <p className="mt-3 text-sm text-muted">— {book.recommender}</p>}
          </div>
        </div>
      </motion.aside>
    </div>
  )
}
