-- Visitor-added favorite books. Content only: shelf appearance is derived
-- in the client from open_library_key, so design changes need no migration.
-- Public can read and insert; nobody can update or delete through the API.
-- Remove unwanted rows from the Supabase dashboard (service role).
--
-- Cover rules (mirrored in src/lib/covers.ts):
-- - Covers are hotlinked from the source; only the URL is stored.
-- - Every cover names its source and links to the book's page there.
-- - Only Open Library and Google Books are accepted.

CREATE TABLE public.favorite_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  genre text NOT NULL CHECK (genre IN ('Fiction', 'Nonfiction', 'Sci-Fi', 'Mystery & Thriller', 'Fantasy', 'Romance')),
  year int NOT NULL DEFAULT 0,
  cover text NOT NULL DEFAULT '',
  cover_source text NOT NULL DEFAULT '',
  cover_page_url text NOT NULL DEFAULT '',
  open_library_key text NOT NULL DEFAULT '',
  pages int NOT NULL DEFAULT 0,
  publisher text NOT NULL DEFAULT '',
  recommender text NOT NULL,
  note text NOT NULL DEFAULT '',

  -- No cover at all, or an image + credit page that both belong to a known source.
  CONSTRAINT cover_from_known_source CHECK (
    (cover = '' AND cover_source = '' AND cover_page_url = '')
    OR (
      cover_source = 'openlibrary'
      AND cover LIKE 'https://covers.openlibrary.org/%'
      AND cover_page_url LIKE 'https://openlibrary.org/%'
    )
    OR (
      cover_source = 'googlebooks'
      AND (cover LIKE 'https://books.google.com/books/content%'
        OR cover LIKE 'https://books.googleusercontent.com/%')
      AND (cover_page_url LIKE 'https://books.google.com/%'
        OR cover_page_url LIKE 'https://www.google.com/books/%'
        OR cover_page_url LIKE 'https://play.google.com/store/books/%')
    )
  )
);

GRANT SELECT, INSERT ON public.favorite_books TO anon, authenticated;
-- Supabase's default privileges grant more than this; 0002 revokes the rest.
GRANT ALL ON public.favorite_books TO service_role;

ALTER TABLE public.favorite_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favorite books are publicly readable"
  ON public.favorite_books FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can add a favorite book"
  ON public.favorite_books FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(recommender)) BETWEEN 1 AND 60
    AND length(trim(title)) BETWEEN 1 AND 300
    AND length(author) <= 200
    AND length(trim(note)) BETWEEN 1 AND 500
    AND length(cover) <= 500
    AND length(cover_page_url) <= 500
  );
