import { coverCredit } from '../lib/covers'
import type { BookRecord } from '../types/book'

// "Cover via Open Library ↗". Required wherever a cover is shown large
// (the detail view); renders nothing for books without a cover.
export function CoverCredit({ book }: { book: BookRecord }) {
  const credit = coverCredit(book)
  if (!credit) return null
  return (
    <a
      href={credit.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-block font-meta text-xs text-muted underline-offset-2 hover:underline"
    >
      {credit.label} ↗
    </a>
  )
}
