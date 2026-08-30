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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
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