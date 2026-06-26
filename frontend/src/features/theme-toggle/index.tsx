import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@shared/ui'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? 'light' : 'dark'

    if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
      setTheme(nextTheme)
      return
    }

    const rect = btnRef.current?.getBoundingClientRect()
    const x = e.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2)
    const y = e.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2)
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const root = document.documentElement
    root.style.setProperty('--vt-origin-x', `${x}px`)
    root.style.setProperty('--vt-origin-y', `${y}px`)
    root.style.setProperty('--vt-radius', `${maxRadius}px`)
    // Direction flag — lets CSS pick the right entrance (light vs dark)
    root.dataset.vtTo = nextTheme

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme)
    })

    transition.finished.finally(() => {
      root.style.removeProperty('--vt-origin-x')
      root.style.removeProperty('--vt-origin-y')
      root.style.removeProperty('--vt-radius')
      delete root.dataset.vtTo
    })
  }

  return (
    <Button
      ref={btnRef}
      variant="secondary"
      size="sm"
      onClick={handleClick}
      leftIcon={mounted ? (isDark ? <Sun size={14} /> : <Moon size={14} />) : null}
      aria-label="Toggle color mode"
    >
      {mounted ? (isDark ? 'Light' : 'Dark') : 'Theme'}
    </Button>
  )
}
