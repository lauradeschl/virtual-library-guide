import { ArrowRightIcon } from 'lucide-react'
import { genres } from '../data/genres'
import type { GenreFilter } from '../types/book'

interface IndexHeaderProps {
  genre: GenreFilter
  onGenreChange: (genre: GenreFilter) => void
  counts: Record<GenreFilter, number>
  total: number
  onAddBook: () => void
}

export function IndexHeader({ genre, onGenreChange, counts, total, onAddBook }: IndexHeaderProps) {
  return (
    <header className="w-full px-5 pt-6 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 pt-5 md:grid-cols-12 md:gap-y-10 lg:gap-x-6">
        <div className="md:order-2 md:col-span-5 lg:col-span-3">
          <p className="hidden text-sm text-muted md:block">The best books to read in 2026</p>

          {/* Phones: one scrollable row of pills, so the shelf stays on the first screen. */}
          <nav aria-label="Filter by genre" className="-mx-5 md:hidden">
            <ul className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
              {genres.map((g) => {
                const active = g === genre
                return (
                  <li key={g} className="flex-none">
                    <button
                      type="button"
                      onClick={() => onGenreChange(g)}
                      aria-pressed={active}
                      className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-150 ${
                        active ? 'border-ink bg-ink text-canvas' : 'border-rule text-muted'
                      }`}
                    >
                      {g}
                      <span className={`tabular-nums text-xs ${active ? 'text-canvas/70' : 'text-muted/70'}`}>
                        {counts[g]}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <nav aria-label="Filter by genre" className="mt-4 hidden md:block lg:mt-10">
            <ul className="grid grid-cols-2 gap-x-6 border-t border-rule sm:grid-cols-1">
              {genres.map((g) => {
                const active = g === genre
                return (
                  <li key={g} className="border-b border-rule">
                    <button
                      type="button"
                      onClick={() => onGenreChange(g)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 py-2 text-left text-sm transition-colors duration-150 ${
                        active ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 flex-none rounded-[1.5px] transition-colors duration-150 ${active ? 'bg-accent' : 'bg-rule'}`}
                        aria-hidden="true"
                      />

                      <span className="min-w-0 flex-1 truncate">{g}</span>
                      <span className="tabular-nums text-muted">{String(counts[g]).padStart(2, '0')}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <div className="-order-1 flex flex-col items-start md:order-1 md:col-span-7 lg:col-span-9">
          <p className="mb-4 text-sm text-muted md:hidden">The best books to read in 2026</p>
          <h1
            className="font-display text-[clamp(48px,9.5vw,136px)] font-semibold leading-[0.88] tracking-[-0.035em]"
            style={{ fontStretch: '72%' }}
          >
            Digital
            <br />
            bookshelf
            <sup
              className="ml-2 align-top text-xl font-medium tracking-normal text-accent md:text-3xl"
              style={{ fontStretch: '100%' }}
            >
              {total}
            </sup>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted sm:mt-5">
            Books readers loved enough to pass on. Pull one off the shelf to read why it’s here, or add the one you’d
            recommend.
          </p>
          <button
            type="button"
            onClick={onAddBook}
            className="group mt-6 flex min-h-11 w-full items-center justify-between gap-10 rounded-[var(--field-radius)] bg-ink px-4 py-3 sm:mt-8 text-sm font-medium text-canvas transition-colors duration-150 hover:bg-ink/85 sm:w-auto"
          >
            Add your favorite book
            <ArrowRightIcon
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </header>
  )
}
