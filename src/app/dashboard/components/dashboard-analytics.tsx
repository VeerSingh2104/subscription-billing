import { getDashboardAnalytics } from '../actions/dashboard-analytics'
import RevenueChart from './revenue-chart'

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

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function statusStyles(status: string) {
  switch (status) {
    case 'PAID':
      return {
        dot: 'bg-emerald-500',
        badge:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      }

    case 'ISSUED':
      return {
        dot: 'bg-blue-500',
        badge:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      }

    case 'DRAFT':
      return {
        dot: 'bg-amber-500',
        badge:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      }

    case 'VOID':
      return {
        dot: 'bg-slate-400',
        badge:
          'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      }

    default:
      return {
        dot: 'bg-slate-400',
        badge:
          'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      }
  }
}

export default async function DashboardAnalytics({
  weekOffset,
}: {
  weekOffset: number
}) {
  const analytics = await getDashboardAnalytics(weekOffset)

  return (
    <section className="mt-8 space-y-8">

      {/* ============================================================ */}
      {/* FINANCIAL OVERVIEW */}
      {/* ============================================================ */}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Financial overview
            </p>

            <h2 className="mt-1 text-base font-bold tracking-tight text-foreground">
              Billing performance
            </h2>
          </div>

          <span className="glass hidden rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
            Current month
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            label="Invoices issued"
            value={analytics.issuedThisMonth.toString()}
            description="Issued this month"
            icon="↗"
            tone="blue"
          />

          <MetricCard
            label="Revenue collected"
            value={formatAmount(analytics.collectedThisMonth)}
            description="Payments recorded this month"
            icon="₹"
            tone="emerald"
            featured
          />

          <MetricCard
            label="Receivables"
            value={formatAmount(analytics.receivables)}
            description="Outstanding issued invoices"
            icon="◷"
            tone="violet"
          />

          <MetricCard
            label="Overdue invoices"
            value={analytics.overdueCount.toString()}
            description={
              analytics.overdueCount > 0
                ? 'Past due and unpaid'
                : 'Nothing requires attention'
            }
            icon="!"
            tone="rose"
            alert={analytics.overdueCount > 0}
          />

        </div>
      </section>

      {/* ============================================================ */}
      {/* STATUS + PLAN */}
      {/* ============================================================ */}

      <div className="grid gap-6 lg:grid-cols-2">

        <AnalyticsCard
          title="Invoices by status"
          description="Current invoice lifecycle distribution"
        >
          <div className="space-y-2">

            {analytics.statusBreakdown.length === 0 ? (
              <EmptyState />
            ) : (
              analytics.statusBreakdown.map((item) => {
                const styles = statusStyles(item.status)

                return (
                  <div
                    key={item.status}
                    className="motion-card group flex items-center justify-between rounded-xl border border-transparent px-3 py-3.5 transition-all duration-200 hover:border-blue-500/15 hover:bg-white/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">

                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {statusLabel(item.status)}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.count} invoice
                          {item.count === 1 ? '' : 's'}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`shrink-0 rounded-lg border border-border/40 px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
                    >
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                )
              })
            )}

          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Invoices by plan"
          description="Invoice volume and value by subscription plan"
        >
          <div className="space-y-2">

            {analytics.planBreakdown.length === 0 ? (
              <EmptyState />
            ) : (
              analytics.planBreakdown.map((item, index) => (
                <div
                  key={item.plan}
                  className="motion-card group flex items-center justify-between rounded-xl border border-transparent px-3 py-3.5 transition-all duration-200 hover:border-blue-500/15 hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.plan}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.count} invoice
                        {item.count === 1 ? '' : 's'}
                      </p>
                    </div>

                  </div>

                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatAmount(item.amount)}
                  </p>
                </div>
              ))
            )}

          </div>
        </AnalyticsCard>

      </div>

      {/* ============================================================ */}
      {/* REVENUE CHART */}
      {/* ============================================================ */}

      <AnalyticsCard
        title="Revenue collected"
        description={
          weekOffset === 0
            ? 'Weekly revenue over the last eight weeks'
            : weekOffset < 0
              ? 'Weekly revenue over a previous eight-week period'
              : 'Weekly revenue over a future eight-week period'
        }
        large
      >
        <RevenueChart
          initialRevenue={analytics.weeklyRevenue}
          initialWeekOffset={weekOffset}
        />
      </AnalyticsCard>

    </section>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone,
  alert = false,
  featured = false,
}: {
  label: string
  value: string
  description: string
  icon: string
  tone: 'blue' | 'emerald' | 'violet' | 'rose'
  alert?: boolean
  featured?: boolean
}) {
  const tones = {
    blue: {
      icon:
        'border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-blue-400',
      glow: 'hover:border-blue-500/30 hover:shadow-blue-500/5',
      accent: 'bg-blue-500',
    },

    emerald: {
      icon:
        'border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      glow: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
      accent: 'bg-emerald-500',
    },

    violet: {
      icon:
        'border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-400',
      glow: 'hover:border-violet-500/30 hover:shadow-violet-500/5',
      accent: 'bg-violet-500',
    },

    rose: {
      icon:
        'border-rose-500/15 bg-rose-500/10 text-rose-600 dark:text-rose-400',
      glow: 'hover:border-rose-500/30 hover:shadow-rose-500/5',
      accent: 'bg-rose-500',
    },
  }

  const style = tones[tone]

  return (
    <div
      className={`glass motion-card group relative overflow-hidden rounded-2xl p-5 hover:shadow-xl ${
        alert
          ? 'border-rose-500/30'
          : 'border-border/60'
      } ${style.glow} ${
        featured
          ? 'ring-1 ring-emerald-500/10'
          : ''
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${style.accent} opacity-70`}
      />

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 truncate text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {description}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-transform duration-200 group-hover:scale-105 ${style.icon}`}
        >
          {icon}
        </div>

      </div>

      {alert && (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-rose-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          Attention required
        </div>
      )}

    </div>
  )
}

function AnalyticsCard({
  title,
  description,
  children,
  large = false,
}: {
  title: string
  description: string
  children: React.ReactNode
  large?: boolean
}) {
  return (
    <div
      className={`glass motion-card rounded-2xl ${
        large ? 'p-5 sm:p-6' : 'p-5 sm:p-6'
      }`}
    >
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

      </div>

      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass rounded-xl border-dashed bg-background/20 py-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        No invoice data available
      </p>

      <p className="mt-1 text-xs text-muted-foreground/70">
        Data will appear here once invoices are created.
      </p>
    </div>
  )
}