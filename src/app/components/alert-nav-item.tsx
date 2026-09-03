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

  /*
   * Render nothing only after we've confirmed the user
   * is not an admin.
   *
   * Until then, keep the navigation slot stable.
   */
  if (loaded && !isAdmin) {
    return null
  }

  return (
    <Link
      href="/alerts"
      className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
    >
      Alerts

      {loaded && count > 0 && (
        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}