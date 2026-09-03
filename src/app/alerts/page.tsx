import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNavbar from '@/app/components/app-navbar'
import AlertsList from './alerts-list'
import { getOverdueAlerts } from './actions'

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

  const alerts = await getOverdueAlerts()

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
      </main>
    </>
  )
}