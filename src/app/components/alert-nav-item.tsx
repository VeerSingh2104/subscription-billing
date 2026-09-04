'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AlertNavItem() {
    const pathname = usePathname()
    const [count, setCount] = useState(0)

    const isActive = pathname === '/alerts'

    useEffect(() => {
        let mounted = true

        async function loadAlertCount() {
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

                setCount(Number(data.count) || 0)
            } catch {
                // Keep the Alerts item visible even if the
                // background count request fails.
            }
        }

        loadAlertCount()

        return () => {
            mounted = false
        }
    }, [])

    return (
        <Link
            href="/alerts"
            className={`group relative inline-flex items-center px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <span className="relative inline-flex items-center gap-2">
                Alerts

                {count > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-500 transition-transform duration-200 group-hover:scale-105 dark:bg-red-400/10 dark:text-red-400">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </span>

            <span
                className={`absolute inset-x-3.5 -bottom-[19px] h-px origin-left bg-blue-400 transition-transform duration-200 ease-out ${
                    isActive
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100'
                }`}
            />
        </Link>
    )
}