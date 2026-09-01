'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')

        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
            setDarkMode(true)
        } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark')
            setDarkMode(false)
        } else {
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches

            if (prefersDark) {
                document.documentElement.classList.add('dark')
                setDarkMode(true)
            }
        }
    }, [])

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')

        setDarkMode(isDark)
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
            {darkMode ? (
                <>
                    <span className="text-base">☀</span>
                    Light Mode
                </>
            ) : (
                <>
                    <span className="text-base">☾</span>
                    Dark Mode
                </>
            )}
        </button>
    )
}
