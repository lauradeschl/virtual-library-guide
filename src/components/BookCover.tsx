import { useState } from 'react'
import { coverCrossOrigin, isCoverLoaded, markCoverLoaded } from '../lib/preloadCovers'
import { spineStyles } from '../lib/spine'
import type { Book } from '../types/book'

interface BookCoverProps {
  book: Book
  size?: 'regular' | 'small' // small: phone bottom sheet
}

// The typeset cover in the spine's colors is always rendered. The real cover,
// hotlinked from its source, fades in over it once loaded, or shows at once
// if lib/preloadCovers already fetched it.
export function BookCover({ book, size = 'regular' }: BookCoverProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const typography = spineStyles(book.type, book.font)
  const showImage = book.cover !== '' && failedSrc !== book.cover
  const ready = loadedSrc === book.cover || isCoverLoaded(book.cover)

  return (
    <div
      className={`relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-[3px] ${
        size === 'small' ? 'w-32 p-4' : 'w-44 p-5'
      }`}
      style={{
        background: book.spine,
        color: book.ink,
        boxShadow: '0 22px 32px -18px rgba(0,0,0,0.5)',
      }}
    >
      <p className="mt-4 pl-2 text-[22px] leading-[1.1]" style={typography.title}>
        {book.title}
      </p>
      <p className="pl-2 text-xs" style={{ ...typography.author, opacity: 0.8 }}>
        {book.author}
      </p>

      {showImage && (
        <>
          <img
            src={book.cover}
            alt={`Cover of ${book.title}`}
            crossOrigin={coverCrossOrigin(book.cover)}
            referrerPolicy="no-referrer"
            onLoad={() => {
              markCoverLoaded(book.cover)
              setLoadedSrc(book.cover)
            }}
            onError={() => setFailedSrc(book.cover)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      )}
    </div>
  )
}
