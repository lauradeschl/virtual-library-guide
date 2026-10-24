import { useEffect, useState } from 'react'
import { cachedCoverPalette, getCoverPalette, type CoverPalette } from '../lib/coverPalette'

// Cover palettes for a list of cover URLs. Cached ones are there on the first
// render (no color flash); the rest fill in as their covers finish loading.
export function useCoverPalettes(srcs: string[]): Record<string, CoverPalette> {
  const [palettes, setPalettes] = useState<Record<string, CoverPalette>>({})
  const key = srcs.join('\n')

  useEffect(() => {
    let cancelled = false
    for (const src of key.split('\n')) {
      if (!src || cachedCoverPalette(src)) continue
      getCoverPalette(src).then((palette) => {
        if (palette && !cancelled) setPalettes((prev) => ({ ...prev, [src]: palette }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [key])

  const result: Record<string, CoverPalette> = { ...palettes }
  for (const src of srcs) {
    const cached = cachedCoverPalette(src)
    if (cached) result[src] = cached
  }
  return result
}
