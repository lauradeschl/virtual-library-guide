-- Add the genre "Business" (2026-10-24). Also includes 0003's rename
-- (Nonfiction → Self-help), so running this file alone brings the table up to
-- date whether or not 0003 was run.

ALTER TABLE public.favorite_books DROP CONSTRAINT IF EXISTS favorite_books_genre_check;

UPDATE public.favorite_books SET genre = 'Self-help' WHERE genre = 'Nonfiction';

ALTER TABLE public.favorite_books ADD CONSTRAINT favorite_books_genre_check
  CHECK (genre IN ('Fiction', 'Self-help', 'Business', 'Sci-Fi', 'Mystery & Thriller', 'Fantasy', 'Romance'));
