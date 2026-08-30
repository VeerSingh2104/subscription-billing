import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoiceStatusControl from '@/app/dashboard/components/invoice-status-control'
import InvoiceHistory from '@/app/invoices/components/invoice-history'
import InvoiceNotes from '@/app/invoices/components/invoice-notes'
import CreditNoteControls from '@/app/invoices/components/credit-note-controls'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  redirect('/login')
}

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

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
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Invoices
      </h1>

      {error && (
        <p className="mt-4 text-red-600">
          Error: {error.message}
        </p>
      )}

      {!error && invoices?.length === 0 && (
        <p className="mt-4 text-gray-500">
          No invoices found.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {invoices?.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-lg border p-5"
          >
            <p className="font-semibold">
              {invoice.subscriptions?.customer_name}
            </p>

            <p className="text-sm text-gray-500">
              {invoice.subscriptions?.plan_name} ·{' '}
              {invoice.subscriptions?.billing_cycle}
            </p>

            <p className="mt-3">
              Amount: ₹{invoice.amount}
            </p>

            <p className="mt-1">
              Status: {invoice.status}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Due: {invoice.due_date}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Period: {invoice.billing_period_start} →{' '}
              {invoice.billing_period_end}
            </p>
            {profile?.role === 'BILLING_ADMIN' && (
  <InvoiceStatusControl
    invoiceId={invoice.id}
    currentStatus={invoice.status}
  />
  
)}
<InvoiceHistory invoiceId={invoice.id} />
<InvoiceNotes invoiceId={invoice.id} />
{profile?.role === 'BILLING_ADMIN' && (
  <CreditNoteControls
    invoiceId={invoice.id}
    invoiceAmount={Number(invoice.amount)}
  />
)}
          </div>
        ))}
      </div>
    </main>
  
)
  
}
