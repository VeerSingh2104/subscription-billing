'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AlertNavItem() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [count, setCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

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
        setLoaded(true)
      } catch {
        // Keep navigation usable if alert loading fails.
      }
    }

    loadAlerts()

    return () => {
      mounted = false
    }
  }, [])

  if (loaded && !isAdmin) {
    return null
  }

  return (
    <Link
      href="/alerts"
      className="glass-button motion-button group relative rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
    >
      <span className="inline-flex items-center">
        Alerts

        {loaded && count > 0 && (
          <span
            className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-700 shadow-sm shadow-red-500/10 animate-fade-scale transition-transform duration-200 group-hover:scale-105 dark:bg-red-500/15 dark:text-red-300"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </Link>
  )
}