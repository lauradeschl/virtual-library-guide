-- Rename the genre "Nonfiction" to "Self-help" (2026-10-24). Existing visitor
-- books keep their genre under the new name.

ALTER TABLE public.favorite_books DROP CONSTRAINT IF EXISTS favorite_books_genre_check;

UPDATE public.favorite_books SET genre = 'Self-help' WHERE genre = 'Nonfiction';

ALTER TABLE public.favorite_books ADD CONSTRAINT favorite_books_genre_check
  CHECK (genre IN ('Fiction', 'Self-help', 'Sci-Fi', 'Mystery & Thriller', 'Fantasy', 'Romance'));
