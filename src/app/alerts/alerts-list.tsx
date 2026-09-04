'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { dismissOverdueAlert } from './actions'

type Alert = {
  id: string
  invoice_id: string
  invoice: {
    id: string
    amount: number | string
    due_date: string
  }
  subscription: {
    customer_name: string
    plan_name: string
  }
}

export default function AlertsList({
  alerts,
}: {
  alerts: Alert[]
}) {
  const router = useRouter()
  const [isPending, startTransition] =
    useTransition()

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-xl">
          ✓
        </div>

        <h2 className="mt-4 text-lg font-semibold text-foreground">
          No Active Overdue Alerts
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          There are currently no overdue invoices
          requiring attention.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alerts.length} active overdue alert
          {alerts.length === 1 ? '' : 's'}
        </p>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl border border-red-200 bg-card p-4 shadow-sm dark:border-red-900/50"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  OVERDUE
                </span>

                <span className="text-xs text-muted-foreground">
                  Invoice {alert.invoice_id.slice(0, 8)}
                </span>
              </div>

              <h2 className="mt-2 text-base font-semibold text-foreground">
                {alert.subscription.customer_name}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {alert.subscription.plan_name}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    INR{' '}
                    {Number(
                      alert.invoice.amount
                    ).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {alert.invoice.due_date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={`/invoices/${alert.invoice.id}`}
                className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                View Invoice
              </a>

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await dismissOverdueAlert(
                        alert.id
                      )

                      router.refresh()
                    } catch (error) {
                      console.error(error)
                    }
                  })
                }}
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending
                  ? 'Dismissing...'
                  : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}