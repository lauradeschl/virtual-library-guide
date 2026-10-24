// Open Library data for the starter books in data/favorite_books_2026.csv,
// keyed by the CSV's Title (must match exactly). Looked up 2026-10-24.
// pageUrl points at the edition the cover image belongs to (the work page can
// show a different edition's cover); Heft's cover is only on the work.
// "Vom Mut, frei zu sein" isn't on Open Library, so it has no entry.

type StarterCover = { cover: string; pageUrl: string; key: string; pages: number }

const ol = (coverId: number, page: string, key: string, pages: number): StarterCover => ({
  cover: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
  pageUrl: `https://openlibrary.org${page}`,
  key,
  pages,
})

export const starterCovers: Record<string, StarterCover> = {
  Heft: ol(8251335, '/works/OL16126318W', '/works/OL16126318W', 352),
  'The Midnight Library': ol(10313767, '/books/OL28401522M', '/works/OL20965973W', 304),
  'Long Bright River': ol(9247626, '/books/OL27886422M', '/works/OL20626992W', 473),
  'Real Americans': ol(14817818, '/books/OL50728902M', '/works/OL37564592W', 400),
  'Tiny Experiments': ol(14850860, '/books/OL57563029M', '/works/OL42398133W', 304),
  'Atomic Habits': ol(12539702, '/books/OL36647151M', '/works/OL17930368W', 322),
}
