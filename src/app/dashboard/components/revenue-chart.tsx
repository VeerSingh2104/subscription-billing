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
  initialRevenue: WeeklyRevenue[]
  initialWeekOffset: number
}

function formatAmount(amount: number) {
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function RevenueChart({
  initialRevenue,
  initialWeekOffset,
}: Props) {
  const [weeklyRevenue, setWeeklyRevenue] =
    useState<WeeklyRevenue[]>(initialRevenue)

  const [weekOffset, setWeekOffset] =
    useState(initialWeekOffset)

  const [isPending, startTransition] = useTransition()

  const maxWeeklyRevenue = Math.max(
    ...weeklyRevenue.map((week) => week.amount),
    1
  )

  function changeTimeline(nextOffset: number) {
    startTransition(async () => {
      const analytics = await getDashboardAnalytics(nextOffset)

      setWeeklyRevenue(analytics.weeklyRevenue)
      setWeekOffset(nextOffset)
    })
  }

  return (
    <div className="space-y-5">
      {/* Timeline navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {weekOffset === 0
            ? 'Current timeline'
            : weekOffset < 0
              ? `${Math.abs(weekOffset)} period${
                  Math.abs(weekOffset) === 1 ? '' : 's'
                } back`
              : `${weekOffset} period${
                  weekOffset === 1 ? '' : 's'
                } ahead`}
        </p>

        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => changeTimeline(0)}
              disabled={isPending}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={() => changeTimeline(weekOffset - 1)}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Previous
          </button>

          <button
            type="button"
            onClick={() => changeTimeline(weekOffset + 1)}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <p className="text-xs text-slate-500">
          Updating timeline...
        </p>
      )}

      {/* Chart */}
      <div className="flex h-64 items-end gap-2 sm:gap-4">
        {weeklyRevenue.map((week) => {
          const height =
            week.amount === 0
              ? 4
              : Math.max(
                  8,
                  (week.amount / maxWeeklyRevenue) * 100
                )

          return (
            <div
              key={week.start}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="text-center text-[10px] font-medium text-slate-500">
                {week.amount > 0
                  ? formatAmount(week.amount)
                  : 'INR 0'}
              </div>

              <div className="flex h-44 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-slate-900 transition-all duration-300 dark:bg-white"
                  style={{ height: `${height}%` }}
                  title={`${week.start} - ${week.end}: ${formatAmount(
                    week.amount
                  )}`}
                />
              </div>

              <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                {week.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}