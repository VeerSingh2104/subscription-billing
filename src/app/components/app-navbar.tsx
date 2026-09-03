'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from '@/app/components/theme-toggle'
import LogoutButton from '@/app/components/logout-button'
import AlertNavItem from '@/app/components/alert-nav-item'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    matcher: (pathname: string) => pathname === '/dashboard',
  },
  {
    href: '/subscriptions',
    label: 'Subscriptions',
    matcher: (pathname: string) =>
      pathname.startsWith('/subscriptions'),
  },
  {
    href: '/invoices',
    label: 'Invoices',
    matcher: (pathname: string) =>
      pathname.startsWith('/invoices'),
  },
]

export default function AppNavbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    navItems.find((item) => item.href === href)?.matcher(pathname) ??
    false

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
      isActive(href)
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-600/30">
              B
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight sm:text-base">
                Subscription Billing
              </span>

              <span className="block text-xs text-muted-foreground">
                Operations console
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}

            <AlertNavItem />
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <LogoutButton />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 md:hidden"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {/* Mobile navigation */}
        {menuOpen && (
          <div
            id="mobile-navigation"
            className="grid gap-3 border-t border-border py-4 md:hidden"
          >
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}

              <AlertNavItem />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}