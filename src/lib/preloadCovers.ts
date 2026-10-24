// Fetches cover images in the background so the detail panel can show them
// instantly and spines can take their colors from them (lib/coverPalette.ts).
// Open Library covers redirect via archive.org and take seconds to arrive,
// so downloads run through a small queue (3 at a time); hovering a spine
// puts its cover at the front.

const MAX_PARALLEL = 3

const loaded = new Set<string>()
const started = new Map<string, Promise<HTMLImageElement | null>>()
const queue: Array<() => void> = []
let active = 0

export const isCoverLoaded = (src: string) => loaded.has(src)

export const markCoverLoaded = (src: string) => loaded.add(src)

// Covers we can read pixels from: the host sends CORS headers along the whole
// redirect chain (checked 2026-10-24). They must be requested in CORS mode
// everywhere (here and in <BookCover>) so the browser reuses one download.
export const canSampleCover = (src: string) => src.startsWith('https://covers.openlibrary.org/')

export const coverCrossOrigin = (src: string) => (canSampleCover(src) ? 'anonymous' : undefined)

function pump() {
  while (active < MAX_PARALLEL && queue.length) {
    active++
    queue.shift()!()
  }
}

// Downloads one cover (or reuses a download already queued). Resolves with
// the loaded image, or null if it failed. Never rejects.
export function preloadCover(src: string, { priority = false } = {}): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  const existing = started.get(src)
  if (existing) return existing

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const start = () => {
      const img = new Image()
      const finish = (result: HTMLImageElement | null) => {
        active--
        resolve(result)
        pump()
      }
      img.crossOrigin = coverCrossOrigin(src) ?? null
      img.referrerPolicy = 'no-referrer' // same as <BookCover>, so the cached copy is reused
      img.onload = () => {
        loaded.add(src)
        finish(img)
      }
      img.onerror = () => finish(null)
      img.src = src
    }
    if (priority) queue.unshift(start)
    else queue.push(start)
    pump()
  })
  started.set(src, promise)
  return promise
}

export const preloadCovers = (srcs: string[]) => Promise.all(srcs.map((src) => preloadCover(src)))
