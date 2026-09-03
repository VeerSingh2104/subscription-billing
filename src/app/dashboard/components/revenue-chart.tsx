'use client'

import { useState, useTransition } from 'react'
import { getDashboardAnalytics } from '../actions/dashboard-analytics'

type WeeklyRevenue = {
  label: string
  start: string
  end: string
  amount: number
}

type Props = {
  initialRevenue?: WeeklyRevenue[]
  initialWeekOffset?: number
}

function formatAmount(amount: number) {
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function RevenueChart({
  initialRevenue = [],
  initialWeekOffset = 0,
}: Props) {
  const [revenue, setRevenue] = useState(initialRevenue)
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset)
  const [isPending, startTransition] = useTransition()

  const maxAmount = Math.max(...revenue.map((item) => item.amount), 1)

  function changeWeek(nextOffset: number) {
    setWeekOffset(nextOffset)

    startTransition(async () => {
      const analytics = await getDashboardAnalytics(nextOffset)
      setRevenue(analytics.weeklyRevenue)
    })
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })
  }

  const periodLabel =
    weekOffset === 0
      ? 'Current period'
      : weekOffset < 0
        ? `${Math.abs(weekOffset)} period${Math.abs(weekOffset) === 1 ? '' : 's'} back`
        : `${weekOffset} period${weekOffset === 1 ? '' : 's'} ahead`

  return (
    <div className="space-y-5">
      {/* Header */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Weekly performance
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {periodLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(weekOffset - 1)}
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>

          <button
            type="button"
            onClick={() => changeWeek(0)}
            disabled={isPending || weekOffset === 0}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => changeWeek(weekOffset + 1)}
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Chart */}

      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
            <div className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm">
              Loading...
            </div>
          </div>
        )}

        {revenue.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              No revenue data available
            </p>
          </div>
        ) : (
          <div className="flex min-h-[260px] items-end gap-2 overflow-x-auto rounded-xl border border-border bg-muted/10 px-4 pb-4 pt-8 sm:gap-4 sm:px-6">
            {revenue.map((item) => {
              const height =
                item.amount === 0
                  ? 4
                  : Math.max((item.amount / maxAmount) * 100, 8)

              return (
                <div
                  key={`${item.start}-${item.end}`}
                  className="flex min-w-[56px] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[72px]"
                >
                  {/* Amount */}

                  <span className="text-xs font-medium text-muted-foreground">
                    {item.amount > 0
                      ? formatAmount(item.amount)
                      : 'INR 0.00'}
                  </span>

                  {/* Bar */}

                  <div className="flex h-[170px] w-full items-end justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-lg bg-blue-500 transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        minHeight: item.amount === 0 ? '4px' : undefined,
                      }}
                    />
                  </div>

                  {/* Date */}

                  <span className="text-xs font-medium text-muted-foreground">
                    {formatDate(item.start)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {revenue.length} weeks shown
        </p>

        <p className="text-xs font-medium text-muted-foreground">
          {isPending ? 'Updating…' : 'Revenue collected'}
        </p>
      </div>
    </div>
  )
}