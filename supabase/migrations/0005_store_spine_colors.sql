-- Spine colors sampled from each visitor book's cover (2026-10-24).
-- The visitor's browser already samples the cover for the spine preview when
-- adding a book; saving the result means everyone sees the right spine color
-- straight away instead of a placeholder that changes once the cover loads.
-- Optional and display-only: lowercase #rrggbb or empty.

ALTER TABLE public.favorite_books
  ADD COLUMN IF NOT EXISTS spine_color text,
  ADD COLUMN IF NOT EXISTS band_color text,
  ADD COLUMN IF NOT EXISTS ink_color text;

ALTER TABLE public.favorite_books
  ADD CONSTRAINT palette_is_hex CHECK (
    (spine_color IS NULL OR spine_color ~ '^#[0-9a-f]{6}$')
    AND (band_color IS NULL OR band_color ~ '^#[0-9a-f]{6}$')
    AND (ink_color IS NULL OR ink_color ~ '^#[0-9a-f]{6}$')
  );

-- Books added before this change.
UPDATE public.favorite_books SET spine_color = '#31331f', band_color = '#52562c', ink_color = '#f3e7cf' WHERE id = '0f2018ed-1b0e-451b-a33f-27fccbd1dc45'; -- The God of the Woods
UPDATE public.favorite_books SET spine_color = '#a1d5e8', band_color = '#cf4650', ink_color = '#2a211b' WHERE id = 'f6533962-07cf-47cd-ba91-7b76c58b7ac2'; -- Traction
