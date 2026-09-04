'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const ROLE_CACHE_KEY = 'billing-alerts-is-admin'

export default function AlertNavItem() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(
        null
    )
    const [count, setCount] = useState(0)

    useEffect(() => {
        let mounted = true

        /*
         * Use the cached role immediately when available.
         * This prevents the Alerts item from flashing while
         * navigating between app pages.
         */
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
                    return
                }

                const data = await response.json()

                if (!mounted) return

                const admin =
                    data.isAdmin === true

                setIsAdmin(admin)

                sessionStorage.setItem(
                    ROLE_CACHE_KEY,
                    admin ? 'true' : 'false'
                )

                setCount(
                    Number(data.count) || 0
                )
            } catch {
                /*
                 * If a cached role exists, keep using it.
                 * Otherwise remain hidden.
                 */
            }
        }

        loadAlerts()

        return () => {
            mounted = false
        }
    }, [])

    /*
     * Don't render anything until we know the role.
     *
     * This is important for a brand-new Account Manager
     * who doesn't have a cached role yet.
     */
    if (isAdmin !== true) {
        return null
    }

    return (
        <Link
            href="/alerts"
            data-tour="alerts"
            className="glass-button motion-button group relative rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
            <span className="inline-flex items-center">
                Alerts

                {count > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-700 shadow-sm shadow-red-500/10 animate-fade-scale transition-transform duration-200 group-hover:scale-105 dark:bg-red-500/15 dark:text-red-300">
                        {count > 99
                            ? '99+'
                            : count}
                    </span>
                )}
            </span>
        </Link>
    )
}