'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import StatusBadge from '@/app/components/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'

type Invoice = {
  id: string
  amount: number | string | null
  status: string | null
  due_date: string | null
  billing_period_start: string | null
  billing_period_end: string | null
  subscriptions: {
    id: string
    customer_name: string | null
    billing_email: string | null
    plan_name: string | null
    billing_cycle: string | null
    owner_id: string | null
  }[]
}

type Owner = {
  id: string
  full_name: string | null
}

type InvoiceListProps = {
  invoices: Invoice[]
  owners: Owner[]
  query: string
  status: string
  overdue: boolean
  owner: string
  sort: string
  direction: string
  page: number
  totalMatches: number
  totalPages: number
  currentFrom: number
  currentTo: number
}

function buildQueryString(
  currentParams: URLSearchParams,
  updates: Record<string, string | null>
) {
  const params = new URLSearchParams(currentParams.toString())

  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === 'ALL') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  })

  return params
}

export default function InvoiceList({
  invoices,
  owners,
  query,
  status,
  overdue,
  owner,
  sort,
  direction,
  page,
  totalMatches,
  totalPages,
  currentFrom,
  currentTo,
}: InvoiceListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentParams = useSearchParams()

  function updateFilters(
    updates: Record<string, string | null>
  ) {
    const params = buildQueryString(currentParams, updates)

    params.delete('page')

    const queryString = params.toString()

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname
    )
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return
    }

    const params = buildQueryString(currentParams, {
      page: String(nextPage),
    })

    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="mt-6">

      {/* ====================================================== */}
      {/* FILTER WORKSPACE */}
      {/* ====================================================== */}

      <div
        className="glass motion-card rounded-3xl p-4 animate-fade-up"
        style={{ animationDelay: '140ms' }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">

          <div>
            <p className="text-xs font-semibold">
              Invoice filters
            </p>

            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Refine billing activity using the available filters.
            </p>
          </div>

          {(query ||
            status !== 'ALL' ||
            overdue ||
            owner !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
              className="glass-button motion-button shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            >
              Clear filters
            </button>
          )}

        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

          {/* Search */}

          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Search
            </span>

            <input
              defaultValue={query}
              onChange={(event) => {
                const value = event.target.value

                updateFilters({
                  q: value.trim() || null,
                })
              }}
              placeholder="Customer name or billing email"
              className="h-10 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-xs outline-none backdrop-blur-md transition focus:border-blue-500/60 focus:bg-background/65 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          {/* Status */}

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                updateFilters({
                  status: event.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-xs outline-none backdrop-blur-md transition focus:border-blue-500/60 focus:bg-background/65 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="VOID">Void</option>
            </select>
          </label>

          {/* Account Manager */}

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Account Manager
            </span>

            <select
              value={owner}
              onChange={(event) =>
                updateFilters({
                  owner: event.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-xs outline-none backdrop-blur-md transition focus:border-blue-500/60 focus:bg-background/65 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ALL">
                All account managers
              </option>

              {owners.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name || 'Unnamed manager'}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Secondary filters */}

        <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-end sm:justify-between">

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Sort */}

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(event) =>
                  updateFilters({
                    sort: event.target.value,
                  })
                }
                className="h-10 min-w-40 rounded-xl border border-border/70 bg-background/45 px-3 text-xs outline-none backdrop-blur-md transition focus:border-blue-500/60 focus:bg-background/65 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="due_date">
                  Due date
                </option>
                <option value="amount">
                  Amount
                </option>
                <option value="status">
                  Status
                </option>
              </select>
            </label>

            {/* Direction */}

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Direction
              </span>

              <select
                value={direction}
                onChange={(event) =>
                  updateFilters({
                    direction: event.target.value,
                  })
                }
                className="h-10 min-w-40 rounded-xl border border-border/70 bg-background/45 px-3 text-xs outline-none backdrop-blur-md transition focus:border-blue-500/60 focus:bg-background/65 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="asc">
                  Ascending
                </option>
                <option value="desc">
                  Descending
                </option>
              </select>
            </label>

            {/* Overdue */}

            <label className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-background/45 px-3 backdrop-blur-md transition hover:bg-background/65">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(event) =>
                  updateFilters({
                    overdue: event.target.checked
                      ? 'true'
                      : null,
                  })
                }
                className="h-3.5 w-3.5 rounded border-border"
              />

              <span className="text-xs font-medium">
                Overdue only
              </span>
            </label>

          </div>

          <div className="text-[11px] text-muted-foreground">
            {totalMatches > 0
              ? `${totalMatches} invoice${totalMatches === 1 ? '' : 's'} found`
              : 'No results'}
          </div>

        </div>
      </div>

      {/* ====================================================== */}
      {/* RESULT COUNT */}
      {/* ====================================================== */}

      <div
        className="mt-4 flex flex-col gap-1.5 px-1 text-xs text-muted-foreground animate-fade-in sm:flex-row sm:items-center sm:justify-between"
      >
        <p>
          {totalMatches === 0
            ? 'No matching invoices'
            : `Showing ${currentFrom}-${currentTo} of ${totalMatches} invoices`}
        </p>

        <p>
          Page {page} of {totalPages}
        </p>
      </div>

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {invoices.length === 0 ? (
        <div
          className="glass mt-3 rounded-3xl px-6 py-12 text-center animate-fade-scale"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
            <span className="text-lg font-semibold">
              —
            </span>
          </div>

          <p className="mt-4 text-sm font-semibold">
            No matching invoices
          </p>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* ================================================== */}
          {/* INVOICE LIST */}
          {/* ================================================== */}

          <div className="mt-3 space-y-3">

            {invoices.map((invoice, index) => {
              const subscription =
                invoice.subscriptions?.[0]

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="glass motion-card group relative block overflow-hidden rounded-2xl p-4 outline-none animate-fade-up focus-visible:ring-4 focus-visible:ring-blue-500/20"
                  style={{
                    animationDelay: `${180 + index * 45}ms`,
                  }}
                >
                  {/* Accent */}

                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">

                    {/* Invoice identity */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2.5">

                        <p className="truncate text-sm font-semibold">
                          {subscription?.customer_name ||
                            'Unknown customer'}
                        </p>

                        <StatusBadge
                          status={invoice.status}
                        />

                      </div>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {subscription?.billing_email ||
                          'No billing email'}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">

                        <span className="rounded-lg bg-background/45 px-2 py-1 backdrop-blur-sm">
                          {subscription?.plan_name ||
                            'No plan'}
                        </span>

                        <span className="text-border">
                          ·
                        </span>

                        <span>
                          {subscription?.billing_cycle ||
                            'No billing cycle'}
                        </span>

                      </div>

                    </div>

                    {/* Amount / due date */}

                    <div className="rounded-xl border border-border/50 bg-background/30 px-4 py-2.5 text-left backdrop-blur-sm md:min-w-36 md:text-right">

                      <p className="text-sm font-bold tracking-tight">
                        {formatCurrency(invoice.amount)}
                      </p>

                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Due {formatDate(invoice.due_date)}
                      </p>

                    </div>

                    {/* View */}

                    <div className="flex items-center justify-end md:pl-1">

                      <span className="glass-button motion-button inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-300">
                        View
                        <span className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </span>

                    </div>

                  </div>
                </Link>
              )
            })}

          </div>

          {/* ================================================== */}
          {/* PAGINATION */}
          {/* ================================================== */}

          <div
            className="glass mt-4 flex items-center justify-between rounded-2xl px-3 py-2.5 animate-fade-up"
            style={{ animationDelay: '260ms' }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="glass-button motion-button rounded-xl px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="text-xs text-muted-foreground">
              Page{' '}
              <span className="font-semibold text-foreground">
                {page}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-foreground">
                {totalPages}
              </span>
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="glass-button motion-button rounded-xl px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}