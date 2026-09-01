'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
    customer_name: string | null
    plan_name: string | null
    billing_cycle: string | null
  } | null
}

type InvoiceListProps = {
  invoices: Invoice[]
}

type SortMode = 'due' | 'amount' | 'customer'

export default function InvoiceList({ invoices }: InvoiceListProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [sortMode, setSortMode] = useState<SortMode>('due')

  const statuses = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          invoices.map((invoice) => invoice.status || 'DRAFT')
        )
      ).sort(),
    ],
    [invoices]
  )

  const filteredInvoices = useMemo(() => {
    const search = query.trim().toLowerCase()

    return [...invoices]
      .filter((invoice) => {
        const currentStatus = invoice.status || 'DRAFT'
        const matchesStatus =
          status === 'ALL' || currentStatus === status

        const searchable = [
          invoice.subscriptions?.customer_name,
          invoice.subscriptions?.plan_name,
          invoice.subscriptions?.billing_cycle,
          currentStatus,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return matchesStatus && searchable.includes(search)
      })
      .sort((first, second) => {
        if (sortMode === 'amount') {
          return Number(second.amount ?? 0) - Number(first.amount ?? 0)
        }

        if (sortMode === 'customer') {
          return (
            first.subscriptions?.customer_name ?? ''
          ).localeCompare(second.subscriptions?.customer_name ?? '')
        }

        return (
          new Date(first.due_date ?? '').getTime() -
          new Date(second.due_date ?? '').getTime()
        )
      })
  }, [invoices, query, sortMode, status])

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
            placeholder="Customer, plan, status"
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
            <option value="due">Earliest due date</option>
            <option value="amount">Highest amount</option>
            <option value="customer">Customer name</option>
          </select>
        </label>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredInvoices.length} of {invoices.length}
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">No matching invoices</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust the search or filter to bring more records into view.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {filteredInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="group grid gap-4 p-5 outline-none transition hover:bg-muted/40 focus-visible:ring-4 focus-visible:ring-blue-500/20 md:grid-cols-[1fr_auto_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="truncate font-bold">
                    {invoice.subscriptions?.customer_name}
                  </p>
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {invoice.subscriptions?.plan_name} ·{' '}
                  {invoice.subscriptions?.billing_cycle}
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
          ))}
        </div>
      )}
    </div>
  )
}
