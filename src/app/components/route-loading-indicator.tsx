'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function RouteLoadingIndicator() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return
            }

            const target = event.target as HTMLElement | null
            const link = target?.closest('a')

            if (!link) return

            const href = link.getAttribute('href')

            if (!href || href.startsWith('#')) return

            if (link.target === '_blank') return

            const url = new URL(link.href, window.location.href)

            if (url.origin !== window.location.origin) return

            if (url.pathname === window.location.pathname) return

            setLoading(true)
        }

        const handlePopState = () => {
            setLoading(true)
        }

        document.addEventListener('click', handleClick, true)
        window.addEventListener('popstate', handlePopState)

        return () => {
            document.removeEventListener(
                'click',
                handleClick,
                true
            )

            window.removeEventListener(
                'popstate',
                handlePopState
            )
        }
    }, [])

    useEffect(() => {
        setLoading(false)
    }, [pathname])

    if (!loading) return null

    return (
        <div
            className="fixed inset-0 z-[100] bg-background/20 backdrop-blur-[3px]"
            aria-hidden="true"
        >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                    className="h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
                />
            </div>
        </div>
    )
}