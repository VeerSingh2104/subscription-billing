import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNavbar from '@/app/components/app-navbar'

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
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Invoices
      </h1>

      <p className="mt-2 text-gray-500">
        View and manage your invoices.
      </p>

      {error && (
        <p className="mt-4 text-red-600">
          Error: {error.message}
        </p>
      )}

      {!error && invoices?.length === 0 && (
        <p className="mt-6 text-gray-500">
          No invoices found.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {invoices?.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-lg border p-5"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">
                  {invoice.subscriptions?.customer_name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {invoice.subscriptions?.plan_name} ·{' '}
                  {invoice.subscriptions?.billing_cycle}
                </p>

                <p className="mt-3">
                  ₹{invoice.amount}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Due: {invoice.due_date}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Status: {invoice.status}
                </p>
              </div>

              <a
                href={`/invoices/${invoice.id}`}
                className="rounded-md border px-4 py-2 text-center font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                View Invoice
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
    </>
  )
}