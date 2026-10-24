import { useEffect, useState } from 'react'

const SMALL = '(max-width: 639px)'
const MEDIUM = '(max-width: 1023px)'

function readScale(): number {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia(SMALL).matches) return 0.76
  if (window.matchMedia(MEDIUM).matches) return 0.88
  return 1
}

/** Scales book spines down on smaller viewports so more of the shelf fits on screen. */
export function useSpineScale(): number {
  const [scale, setScale] = useState(readScale)

  useEffect(() => {
    const queries = [window.matchMedia(SMALL), window.matchMedia(MEDIUM)]
    const update = () => setScale(readScale())
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])

  return scale
}
