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

  const maxAmount = Math.max(
    ...revenue.map((item) => item.amount),
    1
  )

  function changeWeek(nextOffset: number) {
    setWeekOffset(nextOffset)

    startTransition(async () => {
      const analytics = await getDashboardAnalytics(nextOffset)
      setRevenue(analytics.weeklyRevenue)
    })
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
      }
    )
  }

  const periodLabel =
    weekOffset === 0
      ? 'Current period'
      : weekOffset < 0
        ? `${Math.abs(weekOffset)} period${
            Math.abs(weekOffset) === 1 ? '' : 's'
          } back`
        : `${weekOffset} period${
            weekOffset === 1 ? '' : 's'
          } ahead`

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

        <div className="glass rounded-xl p-1.5">
          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={() => changeWeek(weekOffset - 1)}
              disabled={isPending}
              className="glass-button motion-button rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => changeWeek(0)}
              disabled={isPending || weekOffset === 0}
              className="glass-button motion-button rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => changeWeek(weekOffset + 1)}
              disabled={isPending}
              className="glass-button motion-button rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>

          </div>
        </div>

      </div>

      {/* Chart */}

      <div className="relative">

        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/45 backdrop-blur-md">
            <div className="glass rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground shadow-lg">
              Loading...
            </div>
          </div>
        )}

        {revenue.length === 0 ? (
          <div className="glass flex min-h-[240px] items-center justify-center rounded-2xl border-dashed bg-background/20">
            <p className="text-sm text-muted-foreground">
              No revenue data available
            </p>
          </div>
        ) : (
          <div className="glass relative flex min-h-[280px] items-end gap-2 overflow-x-auto rounded-2xl bg-background/20 px-4 pb-5 pt-8 sm:gap-4 sm:px-6">

            {/* Chart grid */}

            <div className="pointer-events-none absolute inset-x-4 top-8 bottom-12 flex flex-col justify-between sm:inset-x-6">
              <div className="border-t border-border/40" />
              <div className="border-t border-border/30" />
              <div className="border-t border-border/30" />
              <div className="border-t border-border/30" />
            </div>

            {revenue.map((item, index) => {
              const height =
                item.amount === 0
                  ? 4
                  : Math.max(
                      (item.amount / maxAmount) * 100,
                      8
                    )

              return (
                <div
                  key={`${item.start}-${item.end}`}
                  className="group relative z-10 flex min-w-[56px] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[72px]"
                  style={{
                    animationDelay: `${Math.min(
                      450,
                      index * 55
                    )}ms`,
                  }}
                >

                  {/* Amount */}

                  <span className="rounded-lg border border-border/40 bg-background/40 px-2 py-1 text-[10px] font-semibold text-muted-foreground opacity-80 backdrop-blur transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-foreground">
                    {item.amount > 0
                      ? formatAmount(item.amount)
                      : 'INR 0.00'}
                  </span>

                  {/* Bar */}

                  <div className="flex h-[170px] w-full items-end justify-center">

                    <div
                      className={`relative w-full max-w-12 overflow-hidden rounded-t-xl transition-all duration-500 ease-out group-hover:scale-x-105 ${
                        item.amount === 0
                          ? 'bg-blue-500/25'
                          : 'bg-gradient-to-t from-blue-600/80 via-blue-500/80 to-indigo-400/80 shadow-lg shadow-blue-500/10'
                      }`}
                      style={{
                        height: `${height}%`,
                        minHeight:
                          item.amount === 0
                            ? '4px'
                            : undefined,
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
                    </div>

                  </div>

                  {/* Date */}

                  <span className="text-xs font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                    {formatDate(item.start)}
                  </span>

                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* Footer */}

      <div className="flex items-center justify-between border-t border-border/50 pt-4">

        <p className="text-xs text-muted-foreground">
          {revenue.length} weeks shown
        </p>

        <p className="text-xs font-medium text-muted-foreground">
          {isPending
            ? 'Updating…'
            : 'Revenue collected'}
        </p>

      </div>

    </div>
  )
}