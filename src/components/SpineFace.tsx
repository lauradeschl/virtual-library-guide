import { authorSurname, spineShadow, spineTypography } from '../lib/spine'
import type { SpineType } from '../types/book'

interface SpineFaceProps {
  title: string
  author: string
  spine: string
  ink: string
  width: number
  height: number
  type: SpineType
  band?: string
}

export function SpineFace({ title, author, spine, ink, width, height, type, band }: SpineFaceProps) {
  const typography = spineTypography[type]
  const titleSize = Math.max(10, Math.min(15, Math.round(width * 0.34)))
  const showAuthor = width >= 32 && author.length > 0

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-[2px] py-3"
      style={{ width, height, background: spine, color: ink, boxShadow: spineShadow }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(255,240,215,0.10) 28%, rgba(255,240,215,0.04) 55%, rgba(0,0,0,0.18) 100%)',
        }}
        aria-hidden="true"
      />
      {band && (
        <>
          <span className="absolute inset-x-0 top-[10px] h-[3px]" style={{ background: band }} />
          <span className="absolute inset-x-0 bottom-[10px] h-[3px]" style={{ background: band }} />
        </>
      )}
      <span
        className="min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap pt-2 leading-none"
        style={{ writingMode: 'vertical-rl', fontSize: titleSize, ...typography.title }}
      >
        {title}
      </span>
      {showAuthor && (
        <span
          className="mt-2 max-h-[38%] overflow-hidden text-ellipsis whitespace-nowrap pb-2 leading-none"
          style={{
            writingMode: 'vertical-rl',
            fontSize: Math.max(8, titleSize - 4),
            opacity: 0.72,
            ...typography.author,
          }}
        >
          {authorSurname(author)}
        </span>
      )}
    </div>
  )
}
