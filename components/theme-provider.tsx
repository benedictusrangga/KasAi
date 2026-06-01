'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
  isDark: boolean
}>({ theme: 'dark', toggle: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('kasai-theme') as Theme | null
    // Juga cek key lama dari landing page
    const storedLanding = localStorage.getItem('landing-theme') as Theme | null
    const resolved = stored ?? storedLanding ?? 'dark'
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    setMounted(true)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('kasai-theme', next)
      localStorage.setItem('landing-theme', next) // sync dengan landing
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  // Hindari flash — render dengan dark default sampai mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'dark', toggle, isDark: true }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme() {
  return useContext(ThemeContext)
}
