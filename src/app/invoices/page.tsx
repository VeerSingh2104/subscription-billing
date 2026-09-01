import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNavbar from '@/app/components/app-navbar'
import InvoiceList from './invoice-list'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      subscriptions (
        customer_name,
        plan_name,
        billing_cycle
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                Billing activity
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Invoices
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Filter by status, find a customer quickly, and open invoice details.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold">
                {invoices?.length ?? 0}
              </p>
            </div>
          </header>

          {error ? (
            <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-300">
              Could not load invoices: {error.message}
            </div>
          ) : invoices && invoices.length > 0 ? (
            <InvoiceList invoices={invoices} />
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-semibold">No invoices found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New invoices will appear here once they are created.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
