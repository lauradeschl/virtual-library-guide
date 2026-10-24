import { canSampleCover, preloadCover } from './preloadCovers'

// Spine colors taken from a book's cover:
// - spine: dominant color of the cover's left edge, where a real spine
//   would continue the design;
// - band: the most vivid mid-tone on the cover (for head/foot bands);
// - ink: cream or espresso lettering, whichever contrasts more.
// Colors are toned toward the shelf's cozy palette so a neon or stark white
// cover still looks like a cloth book on a library shelf.

export type CoverPalette = { spine: string; band: string; ink: string }

const CACHE_KEY = 'coverPalette:v2'
const SAMPLE_WIDTH = 40
const EDGE_FRACTION = 0.08
const INK_LIGHT = '#f3e7cf'
const INK_DARK = '#2a211b'
const GILT = '#c9a24a'
const OXBLOOD = '#8c2f23'

type Rgb = [number, number, number]

// --- color math -------------------------------------------------------------

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// Cloth-like: cap saturation, keep away from pure white/black. Whites become
// warm linen, blacks become espresso.
function cozy(rgb: Rgb): string {
  const [h, s, l] = rgbToHsl(rgb)
  if (l > 0.86) return hslToHex(40, 0.38, 0.84)
  if (l < 0.1) return hslToHex(h, Math.min(s, 0.25), 0.13)
  return hslToHex(h, Math.min(s * 0.85, 0.6), Math.min(Math.max(l, 0.16), 0.8))
}

// --- sampling ---------------------------------------------------------------

type Bucket = { r: number; g: number; b: number; n: number }

// Groups similar pixels and averages each group. `bits` per channel sets how
// coarse: fewer bits merge textured areas (e.g. patterned wallpaper) into one.
function buckets(data: Uint8ClampedArray, w: number, h: number, x0: number, x1: number, bits = 4): Bucket[] {
  const map = new Map<number, Bucket>()
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4
      if (data[i + 3] < 128) continue
      const shift = 8 - bits
      const key = ((data[i] >> shift) << (2 * bits)) | ((data[i + 1] >> shift) << bits) | (data[i + 2] >> shift)
      const bucket = map.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
      bucket.r += data[i]
      bucket.g += data[i + 1]
      bucket.b += data[i + 2]
      bucket.n++
      map.set(key, bucket)
    }
  }
  return [...map.values()]
}

const avg = (b: Bucket): Rgb => [b.r / b.n, b.g / b.n, b.b / b.n]

export function paletteFromImage(img: HTMLImageElement): CoverPalette | null {
  const w = SAMPLE_WIDTH
  const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return null // canvas tainted: the image wasn't served with CORS
  }

  const edge = buckets(data, w, h, 0, Math.max(2, Math.round(w * EDGE_FRACTION)), 2)
  if (!edge.length) return null
  const spine = cozy(avg(edge.reduce((a, b) => (b.n > a.n ? b : a))))

  // Most vivid mid-tone on the whole cover, weighted by how much of it there is,
  // and clearly different from the spine.
  let band: string | null = null
  let best = 0
  for (const bucket of buckets(data, w, h, 0, w)) {
    const [, s, l] = rgbToHsl(avg(bucket))
    if (s < 0.35 || l < 0.25 || l > 0.75) continue
    const candidate = cozy(avg(bucket))
    if (contrast(candidate, spine) < 1.6) continue
    const score = s * Math.sqrt(bucket.n)
    if (score > best) {
      best = score
      band = candidate
    }
  }

  const ink = contrast(INK_LIGHT, spine) >= contrast(INK_DARK, spine) ? INK_LIGHT : INK_DARK
  return { spine, band: band ?? (ink === INK_LIGHT ? GILT : OXBLOOD), ink }
}

// --- cache --------------------------------------------------------------------

const memory = new Map<string, CoverPalette>()
const pending = new Map<string, Promise<CoverPalette | null>>()

function readStorage(): Record<string, CoverPalette> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeStorage(src: string, palette: CoverPalette) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readStorage(), [src]: palette }))
  } catch {
    // Private mode or storage full: colors are just recomputed next visit.
  }
}

for (const [src, palette] of Object.entries(readStorage())) memory.set(src, palette)

// Palettes known up front (e.g. baked into starterCovers.ts), so first-time
// visitors see the right spine colors without waiting for the image.
export function seedCoverPalettes(palettes: Record<string, CoverPalette>) {
  for (const [src, palette] of Object.entries(palettes)) if (!memory.has(src)) memory.set(src, palette)
}

export const cachedCoverPalette = (src: string) => memory.get(src)

// The palette for a cover, sampling it once if needed. Null when the cover
// can't be sampled (no CORS) or failed to load.
export function getCoverPalette(src: string): Promise<CoverPalette | null> {
  const known = memory.get(src)
  if (known) return Promise.resolve(known)
  if (!canSampleCover(src)) return Promise.resolve(null)
  const existing = pending.get(src)
  if (existing) return existing
  const promise = preloadCover(src).then((img) => {
    const palette = img ? paletteFromImage(img) : null
    if (palette) {
      memory.set(src, palette)
      writeStorage(src, palette)
    }
    return palette
  })
  pending.set(src, promise)
  return promise
}
