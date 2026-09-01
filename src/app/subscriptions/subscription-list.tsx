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
  const [sortMode, setSortMode] = useState<SortMode>('recent')

  const statuses = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          subscriptions.map(
            (subscription) => subscription.status || 'ACTIVE'
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
        const currentStatus = subscription.status || 'ACTIVE'
        const matchesStatus =
          status === 'ALL' || currentStatus === status

        const searchable = [
          subscription.customer_name,
          subscription.plan_name,
          subscription.billing_cycle,
          currentStatus,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return matchesStatus && searchable.includes(search)
      })
      .sort((first, second) => {
        if (sortMode === 'customer') {
          return (first.customer_name ?? '').localeCompare(
            second.customer_name ?? ''
          )
        }

        if (sortMode === 'price') {
          return Number(second.price ?? 0) - Number(first.price ?? 0)
        }

        return (
          new Date(second.start_date ?? '').getTime() -
          new Date(first.start_date ?? '').getTime()
        )
      })
  }, [query, sortMode, status, subscriptions])

  return (
    <div className="mt-8">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_160px_180px]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Customer, plan, cycle"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'All statuses' : item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
            Sort
          </span>
          <select
            value={sortMode}
            onChange={(event) =>
              setSortMode(event.target.value as SortMode)
            }
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="recent">Newest start date</option>
            <option value="customer">Customer name</option>
            <option value="price">Highest price</option>
          </select>
        </label>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredSubscriptions.length} of {subscriptions.length}
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">No matching subscriptions</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust the search or filter to bring more records into view.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredSubscriptions.map((subscription) => (
            <Link
              key={subscription.id}
              href={`/subscriptions/${subscription.id}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-blue-500/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">
                    {subscription.customer_name}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {subscription.plan_name} ·{' '}
                    {subscription.billing_cycle}
                  </p>
                </div>

                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Price
                  </p>
                  <p className="mt-1 font-bold">
                    {formatCurrency(subscription.price)}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Started
                  </p>
                  <p className="mt-1 font-bold">
                    {formatDate(subscription.start_date)}
                  </p>
                </div>
              </div>

              <div className="mt-5 inline-flex text-sm font-semibold text-blue-600 transition group-hover:translate-x-1 dark:text-blue-300">
                Open subscription
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
