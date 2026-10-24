// Warms the browser cache with cover images so the detail panel can show
// them instantly. Open Library covers redirect via archive.org and take
// seconds to arrive, so we fetch them in the background ahead of clicks.

const loaded = new Set<string>()
const started = new Map<string, Promise<void>>()

export const isCoverLoaded = (src: string) => loaded.has(src)

export const markCoverLoaded = (src: string) => loaded.add(src)

// Starts (or reuses) a download of one cover. Never rejects.
export function preloadCover(src: string): Promise<void> {
  if (!src) return Promise.resolve()
  const existing = started.get(src)
  if (existing) return existing
  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer' // same as <BookCover>, so the cached copy is reused
    img.onload = () => {
      loaded.add(src)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
  started.set(src, promise)
  return promise
}

// Preloads covers in order, a few at a time, so the first books on the
// shelf are ready first and we don't flood the network.
export async function preloadCovers(srcs: string[], concurrency = 3) {
  const queue = srcs.filter((s) => s && !started.has(s))
  const worker = async () => {
    for (let src = queue.shift(); src; src = queue.shift()) await preloadCover(src)
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
}
