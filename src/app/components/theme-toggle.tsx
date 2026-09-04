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

            document.documentElement.classList.toggle(
                'dark',
                prefersDark
            )

            setDarkMode(prefersDark)
        }
    }, [])

    const toggleTheme = () => {
        const root = document.documentElement
        const isDark = root.classList.contains('dark')

        root.classList.add('theme-transition')

        if (isDark) {
            root.classList.remove('dark')
            setDarkMode(false)
            localStorage.setItem('theme', 'light')
        } else {
            root.classList.add('dark')
            setDarkMode(true)
            localStorage.setItem('theme', 'dark')
        }

        window.setTimeout(() => {
            root.classList.remove('theme-transition')
        }, 300)
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="glass-button motion-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
            <span
                className={`inline-flex text-base transition-all duration-300 ${
                    darkMode
                        ? 'rotate-0 scale-100'
                        : 'rotate-[-20deg] scale-100'
                }`}
            >
                {darkMode ? '☀' : '☾'}
            </span>

            <span className="transition-opacity duration-200">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
        </button>
    )
}