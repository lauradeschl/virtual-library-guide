import type { CoverSource } from './covers'

// One search hit, in the shape the add-book dialog uses.
export type BookSearchResult = {
  id: string // e.g. '/works/OL1W'
  source: CoverSource
  title: string
  author: string
  year: number
  cover: string // https image URL from `source`
  pageUrl: string // credit link at `source`
  pages: number
  publisher: string
  openLibraryKey: string
  isbns: string[]
}
