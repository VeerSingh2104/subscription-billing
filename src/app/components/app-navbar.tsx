'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/app/components/theme-toggle'
import LogoutButton from '@/app/components/logout-button'

export default function AppNavbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/invoices') {
      return pathname.startsWith('/invoices')
    }

    return pathname === path
  }

  const linkClass = (path: string) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      isActive(path)
        ? 'bg-white text-black dark:bg-white dark:text-black'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight"
        >
          Subscription Billing
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={linkClass('/dashboard')}
          >
            Dashboard
          </Link>

          <Link
            href="/subscriptions"
            className={linkClass('/subscriptions')}
          >
            Subscriptions
          </Link>

          <Link
            href="/invoices"
            className={linkClass('/invoices')}
          >
            Invoices
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}