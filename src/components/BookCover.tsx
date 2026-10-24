import { useState } from 'react'
import { isCoverLoaded, markCoverLoaded } from '../lib/preloadCovers'
import { spineTypography } from '../lib/spine'
import type { Book } from '../types/book'

interface BookCoverProps {
  book: Book
}

// The typeset cover in the spine's colors is always rendered. The real cover,
// hotlinked from its source, fades in over it once loaded, or shows at once
// if lib/preloadCovers already fetched it.
export function BookCover({ book }: BookCoverProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const typography = spineTypography[book.type]
  const showImage = book.cover !== '' && failedSrc !== book.cover
  const ready = loadedSrc === book.cover || isCoverLoaded(book.cover)

  return (
    <div
      className="relative flex aspect-[2/3] w-44 flex-col justify-between overflow-hidden rounded-[3px] p-5"
      style={{
        background: book.spine,
        color: book.ink,
        boxShadow: 'inset 7px 0 0 rgba(0,0,0,0.14), 0 22px 32px -18px rgba(0,0,0,0.5)',
      }}
    >
      {book.band && <span className="absolute inset-x-0 top-4 h-1" style={{ background: book.band }} />}
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
          <span className="pointer-events-none absolute inset-y-0 left-0 w-[7px] bg-black/15" aria-hidden="true" />
        </>
      )}
    </div>
  )
}
