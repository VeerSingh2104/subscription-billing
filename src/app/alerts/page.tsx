import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNavbar from '@/app/components/app-navbar'
import AlertsList from './alerts-list'
import { getOverdueAlerts, getAlertHistory, } from './actions'

export default async function AlertsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  if (profile.role !== 'BILLING_ADMIN') {
    redirect('/dashboard')
  }

 const [alerts, alertHistory] = await Promise.all([
  getOverdueAlerts(),
  getAlertHistory(),
])

  return (
    <>
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Alerts
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Overdue invoices
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review invoices that are past their due date and
            still awaiting payment.
          </p>
        </div>

        <AlertsList
          alerts={alerts.map((alert) => ({
            id: alert.id,
            invoice_id: alert.invoice_id,
            invoice: {
              id: alert.invoice.id,
              amount: alert.invoice.amount,
              due_date: alert.invoice.due_date,
            },
            subscription: {
              customer_name:
                alert.invoice.subscription.customer_name,
              plan_name:
                alert.invoice.subscription.plan_name,
            },
          }))}
        />
        <section className="mt-10">
  <div className="mb-5">
    <p className="text-sm font-semibold text-blue-600">
      History
    </p>

    <h2 className="mt-1 text-xl font-semibold text-foreground">
      Alert history
    </h2>

    <p className="mt-1 text-sm text-muted-foreground">
      Previously dismissed overdue alerts are kept for reference.
    </p>
  </div>

  <div className="overflow-hidden rounded-2xl border border-border bg-card">
    {alertHistory.length === 0 ? (
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
        No dismissed alerts yet.
      </div>
    ) : (
      <div className="divide-y divide-border">
        {alertHistory.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">
                {alert.invoice.subscription.customer_name}
              </p>

              <p className="text-sm text-muted-foreground">
                {alert.invoice.subscription.plan_name}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Invoice #{alert.invoice_id.slice(0, 8)}
              </p>
            </div>

            <div className="text-sm sm:text-right">
              <p className="font-medium text-foreground">
                INR {Number(alert.invoice.amount).toFixed(2)}
              </p>

              <p className="text-muted-foreground">
                Due: {alert.due_date}
              </p>

              <p className="text-muted-foreground">
                Dismissed:{' '}
                {alert.dismissed_at
                  ? new Date(alert.dismissed_at).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>
      </main>
    </>
  )
}