'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const ROLE_CACHE_KEY = 'billing-alerts-is-admin'

export default function AlertNavItem() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [count, setCount] = useState(0)

    useEffect(() => {
        let mounted = true

        const cachedRole = sessionStorage.getItem(
            ROLE_CACHE_KEY
        )

        if (cachedRole === 'true') {
            setIsAdmin(true)
        } else if (cachedRole === 'false') {
            setIsAdmin(false)
        }

        async function loadAlerts() {
            try {
                const response = await fetch(
                    '/api/alerts/summary',
                    {
                        cache: 'no-store',
                    }
                )

                if (!response.ok) {
                    if (mounted && cachedRole === null) {
                        setIsAdmin(false)
                    }

                    return
                }

                const data = await response.json()

                if (!mounted) return

                const admin = data.isAdmin === true

                setIsAdmin(admin)

                sessionStorage.setItem(
                    ROLE_CACHE_KEY,
                    admin ? 'true' : 'false'
                )

                setCount(Number(data.count) || 0)
            } catch {
                if (mounted && cachedRole === null) {
                    setIsAdmin(false)
                }
            }
        }

        loadAlerts()

        return () => {
            mounted = false
        }
    }, [])

    if (isAdmin !== true) {
        return null
    }

    return (
        <Link
            href="/alerts"
            data-tour="alerts"
            className="group relative inline-flex items-center px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
            <span className="relative inline-flex items-center gap-2">
                Alerts

                {count > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-500 transition-transform duration-200 group-hover:scale-105 dark:bg-red-400/10 dark:text-red-400">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </span>

            <span className="absolute inset-x-3.5 -bottom-[19px] h-px origin-left scale-x-0 bg-blue-400 transition-transform duration-200 group-hover:scale-x-100" />
        </Link>
    )
}