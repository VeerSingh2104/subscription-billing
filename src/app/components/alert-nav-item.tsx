'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AlertNavItem() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [count, setCount] = useState(0)

    useEffect(() => {
        let mounted = true

        async function loadAlerts() {
            try {
                const response = await fetch(
                    '/api/alerts/summary',
                    {
                        cache: 'no-store',
                    }
                )

                if (!response.ok) return

                const data = await response.json()

                if (!mounted) return

                setIsAdmin(data.isAdmin === true)
                setCount(Number(data.count) || 0)
            } catch {
                // Keep the initial UI stable if the request fails.
            }
        }

        loadAlerts()

        return () => {
            mounted = false
        }
    }, [])

    /*
     * Once the API confirms this is not an admin,
     * remove Alerts completely.
     */
    if (isAdmin === false) {
        return null
    }

    /*
     * While the role is being checked, render the button
     * immediately so Billing Admins don't experience a
     * visible delay.
     *
     * data-tour is intentionally added only after we know
     * the user is an admin.
     */
    return (
        <Link
            href="/alerts"
            {...(isAdmin === true
                ? { 'data-tour': 'alerts' }
                : {})}
            className="glass-button motion-button group relative rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
            <span className="inline-flex items-center">
                Alerts

                {isAdmin === true && count > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-700 shadow-sm shadow-red-500/10 animate-fade-scale transition-transform duration-200 group-hover:scale-105 dark:bg-red-500/15 dark:text-red-300">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </span>
        </Link>
    )
}