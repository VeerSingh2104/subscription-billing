import { getDashboardAnalytics } from '../actions/dashboard-analytics'
import RevenueChart from './revenue-chart'

function formatAmount(amount: number) {
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export default async function DashboardAnalytics({
  weekOffset,
}: {
  weekOffset: number
}) {
  const analytics = await getDashboardAnalytics(weekOffset)

  return (
    <section className="space-y-6">
      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Invoices issued this month"
          value={analytics.issuedThisMonth.toString()}
          description="Created and issued during the current month"
        />

        <MetricCard
          label="Revenue collected"
          value={formatAmount(analytics.collectedThisMonth)}
          description="Payments recorded this month"
        />

        <MetricCard
          label="Receivables"
          value={formatAmount(analytics.receivables)}
          description="Outstanding issued invoices"
        />

        <MetricCard
          label="Invoices overdue"
          value={analytics.overdueCount.toString()}
          description="Past due and not paid"
        />
      </div>

      {/* Status + plan */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsCard
          title="Invoices by status"
          description="Current invoice lifecycle distribution"
        >
          <div className="space-y-4">
            {analytics.statusBreakdown.length === 0 ? (
              <EmptyState />
            ) : (
              analytics.statusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {statusLabel(item.status)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.count} invoice
                      {item.count === 1 ? '' : 's'}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatAmount(item.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Invoices by plan"
          description="Invoice volume and value by subscription plan"
        >
          <div className="space-y-4">
            {analytics.planBreakdown.length === 0 ? (
              <EmptyState />
            ) : (
              analytics.planBreakdown.map((item) => (
                <div
                  key={item.plan}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.plan}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.count} invoice
                      {item.count === 1 ? '' : 's'}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatAmount(item.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </AnalyticsCard>
      </div>

      {/* Eight-week revenue chart */}
      {/* Eight-week revenue chart */}
<AnalyticsCard
  title="Revenue collected"
  description={
    weekOffset === 0
      ? 'Weekly revenue over the last eight weeks'
      : weekOffset < 0
        ? 'Weekly revenue over a previous eight-week period'
        : 'Weekly revenue over a future eight-week period'
  }
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
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  )
}

function AnalyticsCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <p className="py-6 text-center text-sm text-slate-500">
      No invoice data available.
    </p>
  )
}