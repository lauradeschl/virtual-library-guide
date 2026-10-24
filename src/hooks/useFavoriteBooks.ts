import { useCallback, useEffect, useState } from 'react'
import { isAllowedCover, toHttps, type CoverSource } from '../lib/covers'
import { supabase } from '../lib/supabase'
import type { BookRecord, Genre, NewFavorite } from '../types/book'

type Row = {
  id: string
  created_at: string
  title: string
  author: string
  genre: Genre
  year: number
  cover: string
  cover_source: CoverSource | ''
  cover_page_url: string
  open_library_key: string
  pages: number
  publisher: string
  recommender: string
  note: string
}

const toRecord = (r: Row): BookRecord => ({
  id: r.id,
  title: r.title,
  author: r.author,
  genre: r.genre,
  year: r.year,
  cover: r.cover,
  coverSource: r.cover_source,
  coverPageUrl: r.cover_page_url,
  openLibraryKey: r.open_library_key,
  pages: r.pages,
  publisher: r.publisher,
  recommender: r.recommender,
  note: r.note,
  addedAt: r.created_at,
})

const TIMEOUT_MS = 12_000

// Supabase/Postgres errors → something a visitor can act on.
function friendlySaveError(error: { code?: string; message?: string }): string {
  const message = error.message ?? ''
  if (message.includes('genre_check')) {
    return 'The shelf doesn’t accept this genre yet. Pick another genre, or try again later.'
  }
  if (message.includes('cover_from_known_source')) {
    return 'This cover comes from a source we can’t credit. Pick another result.'
  }
  if (error.code === '23514' || error.code === '42501') {
    return 'The shelf didn’t accept this entry. Check your name and note, then try again.'
  }
  return 'Couldn’t save your book right now. Check your connection and try again.'
}

// Visitor-added books, newest first. With Supabase configured they're shared
// with everyone; without it (local dev) they live in memory for this visit.
// `justAdded` holds the id of a book the current visitor just added.
export function useFavoriteBooks() {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('favorite_books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
      .then(({ data, error }) => {
        if (error) {
          console.error('Loading visitor books failed:', error)
          setError('Visitors’ books couldn’t be loaded right now.')
        } else setBooks((data as Row[]).map(toRecord))
      })
  }, [])

  const addFavorite = useCallback(async (input: NewFavorite) => {
    const cover = toHttps(input.cover)
    if (!isAllowedCover(cover, input.coverSource, input.coverPageUrl)) {
      throw new Error('This cover comes from a source we can’t credit. Pick another result.')
    }
    const clean = { ...input, cover, recommender: input.recommender.trim(), note: input.note.trim() }

    let book: BookRecord
    if (supabase) {
      const { data, error } = await supabase
        .from('favorite_books')
        .insert({
          title: clean.title,
          author: clean.author,
          genre: clean.genre,
          year: clean.year,
          cover: clean.cover,
          cover_source: clean.coverSource,
          cover_page_url: clean.coverPageUrl,
          open_library_key: clean.openLibraryKey,
          pages: clean.pages,
          publisher: clean.publisher,
          recommender: clean.recommender,
          note: clean.note,
        })
        .select()
        .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
        .single()
      if (error) {
        console.error('Saving visitor book failed:', error)
        throw new Error(friendlySaveError(error))
      }
      book = toRecord(data as Row)
    } else {
      book = { ...clean, id: `local-${Date.now().toString(36)}`, addedAt: new Date().toISOString() }
    }

    setBooks((prev) => [book, ...prev])
    setJustAdded(book.id)
    setTimeout(() => setJustAdded(null), 1400)
    return book
  }, [])

  return { books, error, justAdded, addFavorite, shared: supabase !== null }
}
