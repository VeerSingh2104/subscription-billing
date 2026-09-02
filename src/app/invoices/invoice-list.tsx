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

    /*
     * Any filter/sort change starts from page 1.
     */
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
    <div className="mt-8">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Search
            </span>

            <input
              defaultValue={query}
              onChange={(event) => {
                const value = event.target.value

                /*
                 * We intentionally update on change here.
                 * For a large production dataset this could be debounced,
                 * but the actual filtering remains server-side.
                 */
                updateFilters({
                  q: value.trim() || null,
                })
              }}
              placeholder="Customer name or billing email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                updateFilters({
                  status: event.target.value,
                })
              }
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="VOID">Void</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Account Manager
            </span>

            <select
              value={owner}
              onChange={(event) =>
                updateFilters({
                  owner: event.target.value,
                })
              }
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(event) =>
                  updateFilters({
                    sort: event.target.value,
                  })
                }
                className="h-11 min-w-44 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Direction
              </span>

              <select
                value={direction}
                onChange={(event) =>
                  updateFilters({
                    direction: event.target.value,
                  })
                }
                className="h-11 min-w-44 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="asc">
                  Ascending
                </option>
                <option value="desc">
                  Descending
                </option>
              </select>
            </label>

            <label className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
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
                className="h-4 w-4 rounded border-border"
              />

              <span className="text-sm font-medium">
                Overdue only
              </span>
            </label>
          </div>

          {(query ||
            status !== 'ALL' ||
            overdue ||
            owner !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-lg border border-border px-4 text-sm font-semibold transition hover:bg-muted"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalMatches === 0
            ? 'No matching invoices'
            : `Showing ${currentFrom}-${currentTo} of ${totalMatches} invoices`}
        </p>

        <p>
          Page {page} of {totalPages}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">
            No matching invoices
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {invoices.map((invoice) => {
              const subscription = invoice.subscriptions?.[0]

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="group grid gap-4 p-5 outline-none transition hover:bg-muted/40 focus-visible:ring-4 focus-visible:ring-blue-500/20 md:grid-cols-[1fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="truncate font-bold">
                        {subscription?.customer_name ||
                          'Unknown customer'}
                      </p>

                      <StatusBadge
                        status={invoice.status}
                      />
                    </div>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {subscription?.billing_email ||
                        'No billing email'}
                    </p>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {subscription?.plan_name} ·{' '}
                      {subscription?.billing_cycle}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
  Owner:{' '}
  {owners.find(
    (item) => item.id === subscription?.owner_id
  )?.full_name || 'Unassigned'}
</p>
                  </div>

                  <div className="text-sm md:text-right">
                    <p className="font-bold">
                      {formatCurrency(invoice.amount)}
                    </p>

                    <p className="mt-1 text-muted-foreground">
                      Due {formatDate(invoice.due_date)}
                    </p>
                  </div>

                  <div className="self-center text-sm font-semibold text-blue-600 transition group-hover:translate-x-1 dark:text-blue-300">
                    Open
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="text-sm text-muted-foreground">
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
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}