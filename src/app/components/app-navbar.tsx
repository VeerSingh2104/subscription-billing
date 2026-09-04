'use client'

import Image from 'next/image'
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
        matcher: (pathname: string) =>
            pathname === '/dashboard',
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
        navItems.find((item) => item.href === href)?.matcher(
            pathname
        ) ?? false

    const tourTarget = (href: string) => {
        if (href === '/dashboard') return 'dashboard'
        if (href === '/subscriptions') return 'subscriptions'
        if (href === '/invoices') return 'invoices'

        return undefined
    }

    const linkClass = (href: string) => {
        const active = isActive(href)

        return `group relative inline-flex items-center px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
            active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
        }`
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
                        <span className="glass-primary motion-button flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                            <Image
                                src="/icon.png"
                                alt="Subscription Billing"
                                width={40}
                                height={40}
                                priority
                                className="h-full w-full object-cover"
                            />
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

                    <div className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => {
                            const active = isActive(item.href)

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    data-tour={tourTarget(
                                        item.href
                                    )}
                                    className={linkClass(item.href)}
                                >
                                    <span>
                                        {item.label}
                                    </span>

                                    <span
                                        className={`absolute inset-x-3.5 -bottom-[19px] h-px origin-left bg-blue-400 transition-transform duration-200 ease-out ${
                                            active
                                                ? 'scale-x-100'
                                                : 'scale-x-0 group-hover:scale-x-100'
                                        }`}
                                    />
                                </Link>
                            )
                        })}

                        <div data-tour="alerts">
                            <AlertNavItem />
                        </div>
                    </div>

                    {/* Desktop actions */}

                    <div className="hidden items-center gap-3 md:flex">
                        <div data-tour="theme">
                            <ThemeToggle />
                        </div>

                        <span className="h-5 w-px bg-border/70" />

                        <LogoutButton />
                    </div>

                    {/* Mobile menu button */}

                    <button
                        type="button"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        onClick={() =>
                            setMenuOpen((open) => !open)
                        }
                        className="motion-button inline-flex h-10 items-center border border-border/70 bg-card/40 px-4 text-xs font-semibold text-foreground backdrop-blur-md transition-colors duration-200 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 md:hidden"
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
                        <div className="grid gap-1">
                            {navItems.map((item) => {
                                const active = isActive(
                                    item.href
                                )

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        data-tour={tourTarget(
                                            item.href
                                        )}
                                        onClick={() =>
                                            setMenuOpen(false)
                                        }
                                        className={`group relative flex items-center px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
                                            active
                                                ? 'text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span>
                                            {item.label}
                                        </span>

                                        <span
                                            className={`absolute bottom-0 left-3 h-px w-10 origin-left bg-blue-400 transition-transform duration-200 ease-out ${
                                                active
                                                    ? 'scale-x-100'
                                                    : 'scale-x-0 group-hover:scale-x-100'
                                            }`}
                                        />
                                    </Link>
                                )
                            })}

                            <div data-tour="alerts">
                                <AlertNavItem />
                            </div>
                        </div>

                        <div className="grid gap-2 border-t border-border/40 pt-3 sm:grid-cols-2">
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