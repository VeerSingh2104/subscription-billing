'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/app/components/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'

type Subscription = {
  id: string
  customer_name: string | null
  plan_name: string | null
  billing_cycle: string | null
  price: number | string | null
  start_date: string | null
  end_date?: string | null
  status?: string | null
}

type SubscriptionListProps = {
  subscriptions: Subscription[]
}

type SortMode = 'recent' | 'customer' | 'price'

export default function SubscriptionList({
  subscriptions,
}: SubscriptionListProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [sortMode, setSortMode] =
    useState<SortMode>('recent')

  const statuses = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          subscriptions.map(
            (subscription) =>
              subscription.status || 'ACTIVE'
          )
        )
      ).sort(),
    ],
    [subscriptions]
  )

  const filteredSubscriptions = useMemo(() => {
    const search = query.trim().toLowerCase()

    return [...subscriptions]
      .filter((subscription) => {
        const currentStatus =
          subscription.status || 'ACTIVE'

        const matchesStatus =
          status === 'ALL' ||
          currentStatus === status

        const searchable = [
          subscription.customer_name,
          subscription.plan_name,
          subscription.billing_cycle,
          currentStatus,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          matchesStatus &&
          searchable.includes(search)
        )
      })
      .sort((first, second) => {
        if (sortMode === 'customer') {
          return (
            first.customer_name ?? ''
          ).localeCompare(
            second.customer_name ?? ''
          )
        }

        if (sortMode === 'price') {
          return (
            Number(second.price ?? 0) -
            Number(first.price ?? 0)
          )
        }

        return (
          new Date(
            second.start_date ?? ''
          ).getTime() -
          new Date(
            first.start_date ?? ''
          ).getTime()
        )
      })
  }, [
    query,
    sortMode,
    status,
    subscriptions,
  ])

  return (
    <div className="mt-8">

      {/* ====================================================== */}
      {/* FILTER WORKSPACE */}
      {/* ====================================================== */}

      <div className="glass motion-card overflow-hidden rounded-3xl animate-fade-up">

        <div className="border-b border-border/50 bg-background/15 px-5 py-5 sm:px-6">

          <div className="flex items-center justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

                <p className="text-sm font-semibold text-foreground">
                  Subscription workspace
                </p>

              </div>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Search and organize your subscription records.
              </p>
            </div>

            <div className="hidden rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur sm:block">
              {filteredSubscriptions.length} visible
            </div>

          </div>

        </div>

        <div className="grid gap-4 p-5 md:grid-cols-[1fr_180px_200px] sm:p-6">

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Search
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Customer, plan, cycle"
              className="h-11 w-full rounded-xl border border-border/60 bg-background/35 px-4 text-sm text-foreground outline-none backdrop-blur transition-all duration-200 placeholder:text-muted-foreground focus:border-blue-500/60 focus:bg-background/50 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border/60 bg-background/35 px-4 text-sm text-foreground outline-none backdrop-blur transition-all duration-200 focus:border-blue-500/60 focus:bg-background/50 focus:ring-4 focus:ring-blue-500/10"
            >
              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === 'ALL'
                    ? 'All statuses'
                    : item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </span>

            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(
                  event.target.value as SortMode
                )
              }
              className="h-11 w-full rounded-xl border border-border/60 bg-background/35 px-4 text-sm text-foreground outline-none backdrop-blur transition-all duration-200 focus:border-blue-500/60 focus:bg-background/50 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="recent">
                Newest start date
              </option>

              <option value="customer">
                Customer name
              </option>

              <option value="price">
                Highest price
              </option>
            </select>
          </label>

        </div>
      </div>

      {/* ====================================================== */}
      {/* RESULT COUNT */}
      {/* ====================================================== */}

      <div className="mt-7 flex items-center justify-between animate-fade-up">

        <div>
          <p className="text-sm font-semibold text-foreground">
            Subscriptions
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Showing {filteredSubscriptions.length} of{' '}
            {subscriptions.length} records
          </p>
        </div>

      </div>

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {filteredSubscriptions.length === 0 ? (
        <div className="glass mt-4 rounded-3xl border-dashed px-6 py-14 text-center animate-fade-scale">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/30 text-lg text-muted-foreground backdrop-blur">
            —
          </div>

          <p className="mt-5 text-sm font-semibold text-foreground">
            No matching subscriptions
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Adjust the search or filter to bring more
            records into view.
          </p>

        </div>
      ) : (

        /* ====================================================== */
        /* SUBSCRIPTION CARDS */
        /* ====================================================== */

        <div className="mt-4 grid gap-5 lg:grid-cols-2">

          {filteredSubscriptions.map(
            (subscription, index) => {

              const currentStatus =
                subscription.status || 'ACTIVE'

              return (
                <Link
                  key={subscription.id}
                  href={`/subscriptions/${subscription.id}`}
                  className="glass motion-card group relative overflow-hidden rounded-3xl p-6 outline-none animate-fade-up focus-visible:ring-4 focus-visible:ring-blue-500/20"
                  style={{
                    animationDelay: `${Math.min(
                      500,
                      120 + index * 70
                    )}ms`,
                  }}
                >

                  {/* Accent */}

                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/70 via-indigo-500/70 to-blue-400/40 transition-all duration-300 group-hover:h-1.5 group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-blue-400" />

                  {/* Subtle hover glow */}

                  <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-opacity duration-300 group-hover:bg-blue-500/10" />

                  {/* Header */}

                  <div className="relative flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                        {subscription.customer_name}
                      </p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {subscription.plan_name}
                      </p>

                    </div>

                    <div className="shrink-0">
                      <StatusBadge
                        status={subscription.status}
                      />
                    </div>

                  </div>

                  {/* Primary details */}

                  <div className="relative mt-6 grid grid-cols-2 gap-3">

                    <div className="glass-button rounded-2xl bg-background/20 p-4">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Price
                      </p>

                      <p className="mt-1.5 text-sm font-semibold text-foreground">
                        {formatCurrency(
                          subscription.price
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {subscription.billing_cycle}
                      </p>

                    </div>

                    <div className="glass-button rounded-2xl bg-background/20 p-4">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Started
                      </p>

                      <p className="mt-1.5 text-sm font-semibold text-foreground">
                        {formatDate(
                          subscription.start_date
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Subscription start
                      </p>

                    </div>

                  </div>

                  {/* Footer */}

                  <div className="relative mt-6 flex items-center justify-between border-t border-border/50 pt-4">

                    <span className="text-xs text-muted-foreground">
                      {currentStatus === 'ACTIVE'
                        ? 'Currently active'
                        : 'Subscription record'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-all duration-200 group-hover:translate-x-1 dark:text-blue-300">
                      View

                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>

                  </div>

                </Link>
              )
            }
          )}

        </div>
      )}

    </div>
  )
}