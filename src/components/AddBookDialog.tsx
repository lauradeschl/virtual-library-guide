import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { SpineFace } from './SpineFace'
import { bookGenres } from '../data/genres'
import { toBook, withCoverPalette } from '../lib/appearance'
import { useCoverPalettes } from '../hooks/useCoverPalettes'
import { getCoverPalette, type CoverPalette } from '../lib/coverPalette'
import { easeOut } from '../lib/motion'
import type { BookSearchResult } from '../lib/bookSearch'
import { searchOpenLibrary } from '../lib/openLibrary'
import type { Book, Genre, NewFavorite } from '../types/book'

interface AddBookDialogProps {
  shared: boolean // false when Supabase isn't configured: the book only lasts this visit
  onClose: () => void
  onAdd: (input: NewFavorite, palette: CoverPalette | null) => Promise<unknown>
  findOnShelf: (candidate: { key: string; title: string; author: string }) => Book | undefined
  onOpenExisting: (id: string) => void
}

// Results for one query: undefined = still searching, 'failed' = gave up.
type SourceResults = BookSearchResult[] | 'failed' | undefined
type SearchOutcome = { q: string; attempt: number; openLibrary?: SourceResults }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const list = (r: SourceResults) => (Array.isArray(r) ? r : [])

const NAME_MAX = 60
const NOTE_MAX = 500

export function AddBookDialog({ shared, onClose, onAdd, findOnShelf, onOpenExisting }: AddBookDialogProps) {
  const [query, setQuery] = useState('')
  // The last finished search. Results only show when it matches the current query.
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0) // bumped by "Try again"
  const [picked, setPicked] = useState<BookSearchResult | null>(null)
  const [genre, setGenre] = useState<Genre>('Fiction')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Debounced Open Library search; a newer query cancels the older request.
  // Open Library is often slow (5–10 s) and sometimes drops a request, so a
  // failed search is retried once before showing an error.
  const q = query.trim()
  const searchActive = !picked && q.length >= 2
  const current = outcome?.q === q && outcome.attempt === attempt ? outcome : null
  const openLibrary = current?.openLibrary
  const results = list(openLibrary)
  const searching = searchActive && openLibrary === undefined
  const failed = searchActive && openLibrary === 'failed'
  const empty = searchActive && Array.isArray(openLibrary) && results.length === 0

  useEffect(() => {
    if (!searchActive) return
    const controller = new AbortController()
    const record = (patch: Partial<SearchOutcome>) =>
      setOutcome((prev) =>
        prev && prev.q === q && prev.attempt === attempt ? { ...prev, ...patch } : { q, attempt, ...patch },
      )
    const withRetry = async (
      search: (signal: AbortSignal) => Promise<BookSearchResult[]>,
      maxTries: number,
    ): Promise<SourceResults> => {
      for (let tries = 1; ; tries++) {
        try {
          return await search(controller.signal)
        } catch (e) {
          if (controller.signal.aborted) throw e
          if (tries >= maxTries) return 'failed'
          await sleep(400 * tries)
        }
      }
    }
    const debounce = setTimeout(() => {
      withRetry((signal) => searchOpenLibrary(q, signal), 2).then(
        (r) => record({ openLibrary: r }),
        () => {},
      )
    }, 280)
    const slowTimer = setTimeout(() => setSlow(true), 280 + 4000)
    return () => {
      clearTimeout(debounce)
      clearTimeout(slowTimer)
      controller.abort()
      setSlow(false)
    }
  }, [q, attempt, searchActive])

  // Already on the shelf (same work, or same title + author)? Then we offer to open it instead.
  const shelfMatch = (r: BookSearchResult) => findOnShelf({ key: r.openLibraryKey, title: r.title, author: r.author })
  const existing = picked ? shelfMatch(picked) : undefined

  const draft: NewFavorite | null = picked && {
    title: picked.title,
    author: picked.author,
    genre,
    year: picked.year,
    cover: picked.cover,
    coverSource: picked.source,
    coverPageUrl: picked.pageUrl,
    openLibraryKey: picked.openLibraryKey,
    pages: picked.pages,
    publisher: picked.publisher,
    recommender: name,
    note,
  }

  // Spine preview uses the same look the shelf will use, cover colors included.
  const [previewPalette] = Object.values(useCoverPalettes(picked ? [picked.cover] : []))
  const previewBase = useMemo(
    () =>
      toBook({
        id: picked?.id ?? 'preview',
        title: picked?.title ?? 'Your book',
        author: picked?.author ?? '',
        genre,
        year: 0,
        cover: '',
        coverSource: '',
        coverPageUrl: '',
        openLibraryKey: picked?.openLibraryKey ?? '',
        pages: picked?.pages ?? 0,
        publisher: '',
        recommender: '',
        note: '',
        addedAt: '',
      }),
    [picked, genre],
  )
  const preview = withCoverPalette(previewBase, previewPalette)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft || existing) return
    const missingName = !name.trim()
    const missingNote = !note.trim()
    setNameError(missingName ? 'Add your name so people know who recommended it.' : null)
    setNoteError(missingNote ? 'Tell people why it’s worth reading.' : null)
    if (missingName || missingNote) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      // Save the cover's spine colors with the book so everyone sees them at
      // once. Usually ready from the preview; wait briefly if not.
      const palette =
        previewPalette ??
        (await Promise.race([getCoverPalette(draft.cover), new Promise<null>((r) => setTimeout(() => r(null), 2500))]))
      await onAdd(draft, palette)
    } catch (err) {
      setSubmitError((err as Error).message || 'Couldn’t place the book. Try again.')
      setSubmitting(false)
    }
  }

  const fieldClass =
    'mt-1.5 w-full rounded-[var(--field-radius)] border border-rule bg-canvas px-3 py-2.5 text-base text-ink outline-none sm:py-2 sm:text-sm transition-colors duration-150 placeholder:text-muted focus:border-ink'
  const labelClass = 'text-xs font-medium text-muted'
  const errorClass = 'mt-1 block text-xs text-[#B42318]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      <motion.div
        className="absolute inset-0 bg-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: easeOut }}
        className="relative grid h-[100dvh] w-full max-w-2xl overflow-y-auto bg-panel text-ink sm:h-auto sm:max-h-[90vh] sm:rounded-[var(--panel-radius)] sm:border sm:border-rule md:grid-cols-[200px_1fr]"
      >
        <div className="hidden flex-col items-center justify-end border-r border-rule bg-canvas px-6 pb-8 pt-10 md:flex">
          <SpineFace
            title={preview.title}
            author={preview.author}
            spine={preview.spine}
            ink={preview.ink}
            width={44}
            height={250}
            type={preview.type}
            font={preview.font}
          />
          <div className="shelf-plank mt-0 h-2.5 w-full" />
          <p className="mt-4 text-center text-xs text-muted">Preview on the shelf</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col p-6 md:p-7">
          <div className="flex items-start justify-between">
            <h2 id="add-book-title" className="font-display text-2xl leading-tight sm:text-3xl sm:leading-none">
              Add your favorite book
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 flex h-11 w-11 flex-none items-center sm:h-9 sm:w-9 justify-center rounded-full text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {!picked ? (
            <div className="mt-6">
              <label className="block">
                <span className={labelClass}>Find your book</span>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={`${fieldClass} pl-9`}
                    placeholder="Search by title or author…"
                  />
                </div>
              </label>

              <div className="mt-3 min-h-[120px]" aria-live="polite">
                {searching && (
                  <p className="py-3 text-sm text-muted">
                    Searching…{slow && ' Open Library is slow right now, hang on.'}
                  </p>
                )}
                {failed && (
                  <p className={errorClass}>
                    Open Library isn’t responding right now.{' '}
                    <button
                      type="button"
                      onClick={() => setAttempt((n) => n + 1)}
                      className="underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </p>
                )}
                {empty && <p className="py-3 text-sm text-muted">No books with a cover found. Try another spelling.</p>}
                {searchActive && results.length > 0 && (
                  <ul className="divide-y sm:max-h-[320px] divide-rule overflow-y-auto border-y border-rule">
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setPicked(r)}
                          className="flex w-full items-center gap-3 px-1 py-3 text-left sm:py-2 transition-colors duration-150 hover:bg-canvas"
                        >
                          <img
                            src={r.cover.replace('-L.jpg', '-S.jpg')}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-12 w-8 flex-none rounded-[2px] bg-rule object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{r.title}</span>
                            <span className="block truncate text-xs text-muted">
                              {r.author}
                              {r.year > 0 && ` · ${r.year}`}
                            </span>
                          </span>
                          <span className="text-xs text-muted">{shelfMatch(r) ? 'On the shelf' : 'Pick'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              <div className="flex items-center gap-3 rounded-[var(--field-radius)] border border-rule bg-canvas p-2">
                <img
                  src={picked.cover.replace('-L.jpg', '-M.jpg')}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-16 w-11 flex-none rounded-[2px] bg-rule object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{picked.title}</p>
                  <p className="truncate text-xs text-muted">
                    {picked.author}
                    {picked.year > 0 && ` · ${picked.year}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="px-2 text-xs text-muted underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline"
                >
                  Change
                </button>
              </div>

              {existing ? (
                <p className="text-sm leading-relaxed">
                  This book is already on the shelf
                  {existing.recommender && `, recommended by ${existing.recommender}`}. Open it to read why, or pick a
                  different book.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className={labelClass}>Genre</span>
                      <span className="relative block">
                        <select
                          value={genre}
                          onChange={(e) => setGenre(e.target.value as Genre)}
                          className={`${fieldClass} appearance-none pr-9`}
                        >
                          {bookGenres.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon
                          className="pointer-events-none absolute right-3 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-muted"
                          aria-hidden="true"
                        />
                      </span>
                    </label>
                    <label className="block">
                      <span className={labelClass}>First name</span>
                      <input
                        autoFocus
                        value={name}
                        maxLength={NAME_MAX}
                        onChange={(e) => setName(e.target.value)}
                        className={fieldClass}
                        aria-invalid={!!nameError}
                      />
                    </label>
                  </div>
                  {nameError && <span className={`${errorClass} -mt-2`}>{nameError}</span>}

                  <label className="block">
                    <span className="flex justify-between">
                      <span className={labelClass}>Why should others read it?</span>
                      <span className="text-xs tabular-nums text-muted">
                        {note.length}/{NOTE_MAX}
                      </span>
                    </span>
                    <textarea
                      value={note}
                      maxLength={NOTE_MAX}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className={`${fieldClass} resize-none`}
                      placeholder="One line is plenty."
                      aria-invalid={!!noteError}
                    />
                    {noteError && <span className={errorClass}>{noteError}</span>}
                  </label>

                  {!shared && (
                    <p className="text-xs text-muted">
                      Sharing isn’t set up yet, so this book stays on the shelf until you reload.
                    </p>
                  )}
                  {submitError && <p className={errorClass}>{submitError}</p>}
                </>
              )}
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t border-rule bg-panel px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--field-radius)] px-4 py-3 text-sm sm:py-2 text-muted transition-colors duration-150 hover:text-ink"
            >
              Cancel
            </button>
            {existing ? (
              <button
                type="button"
                onClick={() => onOpenExisting(existing.id)}
                className="rounded-[var(--field-radius)] bg-ink px-4 py-3 text-sm sm:py-2 font-medium text-canvas transition-colors duration-150 hover:bg-ink/85"
              >
                Open it
              </button>
            ) : (
              <button
                type="submit"
                disabled={!picked || submitting}
                className="rounded-[var(--field-radius)] bg-ink px-4 py-3 text-sm sm:py-2 font-medium text-canvas transition-colors duration-150 hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Placing…' : 'Place on shelf'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}
