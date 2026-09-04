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
    `glass-button motion-button rounded-xl px-3.5 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
      isActive(href)
        ? 'border-blue-400/30 bg-blue-500/12 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-400/20 dark:bg-blue-500/12 dark:text-blue-300'
        : 'text-muted-foreground hover:text-foreground'
    }`

  const tourTarget = (href: string) => {
    if (href === '/dashboard') return 'dashboard'
    if (href === '/subscriptions') return 'subscriptions'
    if (href === '/invoices') return 'invoices'

    return undefined
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/45 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/35">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            onClick={() => setMenuOpen(false)}
          >
            <span className="glass-primary motion-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white">
              B
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-blue-500 sm:text-base">
                Subscription Billing
              </span>

              <span className="block truncate text-xs text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
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
                data-tour={tourTarget(item.href)}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}

            <AlertNavItem />
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <div data-tour="theme">
              <ThemeToggle />
            </div>

            <LogoutButton />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="glass-button motion-button inline-flex h-10 items-center rounded-xl px-4 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 md:hidden"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {/* Mobile navigation */}
        {menuOpen && (
          <div
            id="mobile-navigation"
            className="grid gap-3 border-t border-border/40 py-4 animate-fade-up md:hidden"
          >
            <div className="glass grid gap-2 rounded-2xl p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={tourTarget(item.href)}
                  onClick={() => setMenuOpen(false)}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}

              <AlertNavItem />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div data-tour="theme">
                <ThemeToggle />
              </div>

              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}