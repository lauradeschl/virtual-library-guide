import { useSyncExternalStore } from 'react'

// Phone-sized screens (below Tailwind's `sm`). Matches the `max-sm:` classes.
const QUERY = '(max-width: 639px)'

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export const useIsPhone = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
