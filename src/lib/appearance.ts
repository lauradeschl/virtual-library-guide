import type { Book, BookAppearance, BookRecord, SeedBook } from '../types/book'

// Deterministic 32-bit hash (FNV-1a), so a book looks the same on every visit.
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Returns a 0–1 value per (seed, salt) pair.
function rand(seed: string, salt: string): number {
  return hash(seed + ':' + salt) / 0xffffffff
}

// Cloth bindings you'd find in an old library. Each has an ink that reads on
// it and a foil for the head/foot bands (gilt on dark cloth, oxblood on light).
const BINDINGS = [
  { name: 'oxblood', spine: '#6e1f1a', ink: '#f1e4c8', foil: '#c9a24a' },
  { name: 'forest', spine: '#1f4a3a', ink: '#efe3c6', foil: '#c9a24a' },
  { name: 'navy', spine: '#1d2d4a', ink: '#efe3c6', foil: '#c9a24a' },
  { name: 'cognac', spine: '#8a4b23', ink: '#f6ead2', foil: '#e6c27a' },
  { name: 'mustard', spine: '#c4932f', ink: '#2b1d14', foil: '#6e1f1a' },
  { name: 'plum', spine: '#4f2a3f', ink: '#f1e4c8', foil: '#c9a24a' },
  { name: 'teal', spine: '#24555a', ink: '#efe3c6', foil: '#e6c27a' },
  { name: 'linen', spine: '#e6d6b6', ink: '#3a2a1c', foil: '#8c2f23' },
  { name: 'olive', spine: '#5b5a2a', ink: '#f1e4c8', foil: '#e6c27a' },
  { name: 'rust', spine: '#9b3f22', ink: '#f6ead2', foil: '#2b1d14' },
] as const

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

// Geometry and material roughly follow the build guide; widths are scaled up
// to suit the Index shelf's lettering. Colors are picked from BINDINGS by
// hash until cover sampling (phase 3 of the plan) replaces them.
export function deriveAppearance(book: BookRecord): BookAppearance {
  const seed = book.openLibraryKey || book.id
  const r = (salt: string) => rand(seed, salt)
  const pages = book.pages || 300

  const binding = pages > 420 ? 'hardcover' : pages < 260 ? 'mass' : 'paperback'
  const finish = binding === 'hardcover' ? 'cloth' : r('finish') < 0.5 ? 'gloss' : 'matte'
  const height =
    binding === 'hardcover' ? 236 + r('h') * 18 : binding === 'mass' ? 196 + r('h') * 14 : 214 + r('h') * 16
  const width = clamp(14 + pages * 0.06 + (r('w') - 0.5) * 4, 22, 58)

  const cloth = BINDINGS[Math.floor(r('cloth') * BINDINGS.length)]
  const types = ['serif', 'sans', 'condensed', 'mono'] as const

  return {
    binding,
    finish,
    spine: cloth.spine,
    band: r('band') < 0.6 ? cloth.foil : undefined,
    ink: cloth.ink,
    type: types[Math.floor(r('type') * types.length)],
    width: Math.round(width),
    height: Math.round(height),
    lean: -5 * r('lean'),
    depth: -7 + 14 * r('depth'),
    wear: 0.35 * r('wear'),
  }
}

// A shelf-ready book: derived look, with any pinned look from code on top.
export function toBook(record: BookRecord | SeedBook): Book {
  const { look, ...rest } = record as SeedBook
  return { ...rest, ...deriveAppearance(rest), ...look }
}
