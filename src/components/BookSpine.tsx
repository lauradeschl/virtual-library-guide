import { forwardRef, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SpineFace } from './SpineFace'
import { preloadCover } from '../lib/preloadCovers'
import { easeOut } from '../lib/motion'
import type { Book } from '../types/book'

interface BookSpineProps {
  book: Book
  selected: boolean
  dimmed: boolean
  onSelect: (id: string) => void
  scale?: number
  arriving?: boolean // just added by this visitor: drop it onto the shelf
}

export const BookSpine = forwardRef<HTMLLIElement, BookSpineProps>(function BookSpine(
  { book, selected, dimmed, onSelect, scale = 1, arriving = false },
  ref,
) {
  const [hovered, setHovered] = useState(false)
  const reduceMotion = useReducedMotion()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const lift = reduceMotion ? 0 : selected ? -28 : hovered ? -12 : 0

  useEffect(() => {
    if (selected) {
      buttonRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [selected, reduceMotion])

  useEffect(() => {
    if (arriving) buttonRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [arriving])

  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={arriving && !reduceMotion ? { opacity: 0, y: -160, rotate: -10 } : { opacity: 0, y: 12 }}
      animate={{ opacity: dimmed ? 0.5 : 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: arriving ? 0.75 : 0.22, ease: easeOut }}
      className="relative flex-none list-none"
    >
      <AnimatePresence>
        {hovered && !selected && (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-5 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: easeOut }}
              className="whitespace-nowrap border border-rule bg-panel px-3 py-2 font-ui text-xs text-ink"
              style={{ borderRadius: 'var(--tooltip-radius)' }}
            >
              <span className="block font-medium">{book.title}</span>
              <span className="block text-muted">{book.author}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => onSelect(book.id)}
        onMouseEnter={() => {
          setHovered(true)
          preloadCover(book.cover)
        }}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${book.title} by ${book.author}`}
        aria-pressed={selected}
        animate={{ y: lift }}
        transition={{ duration: 0.18, ease: easeOut }}
        className="block rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <SpineFace
          title={book.title}
          author={book.author}
          spine={book.spine}
          ink={book.ink}
          width={Math.round(book.width * scale)}
          height={Math.round(book.height * scale)}
          type={book.type}
          band={book.band}
        />
      </motion.button>
    </motion.li>
  )
})
