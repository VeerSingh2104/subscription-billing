import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import InvoiceStatusControl from '@/app/dashboard/components/invoice-status-control'
import InvoiceHistory from '@/app/invoices/components/invoice-history'
import InvoiceNotes from '@/app/invoices/components/invoice-notes'
import CreditNoteControls from '@/app/invoices/components/credit-note-controls'
import InvoicePdfButton from '@/app/invoices/components/invoice-pdf-button'
import Link from 'next/link'
import InvoiceDueDateEditor from '@/app/invoices/components/invoice-due-date-editor'
type InvoicePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function InvoiceDetailsPage({
  params,
}: InvoicePageProps) {
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

  const { id } = await params

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      subscriptions (
        customer_name,
        plan_name,
        billing_cycle,
        owner_id
      )
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  const isBillingAdmin =
    profile?.role === 'BILLING_ADMIN'

  const isSubscriptionOwner =
    invoice.subscriptions?.owner_id === user.id

  const canEditDueDate =
    isBillingAdmin || isSubscriptionOwner
  
    return (
    <main className="p-10">
      {/* Back */}
      <Link
        href="/invoices"
        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        ← Back to Invoices
      </Link>

      {/* Header */}
<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div>
    <h1 className="text-3xl font-bold">
      Invoice Details
    </h1>

    <p className="mt-2 text-gray-500">
      {invoice.subscriptions?.customer_name}
    </p>
  </div>

  <InvoicePdfButton invoiceId={invoice.id} />
</div>

      {/* Invoice Information */}
      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          Invoice Information
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Customer
            </p>

            <p className="mt-1 font-medium">
              {invoice.subscriptions?.customer_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Plan
            </p>

            <p className="mt-1 font-medium">
              {invoice.subscriptions?.plan_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Billing Cycle
            </p>

            <p className="mt-1 font-medium">
              {invoice.subscriptions?.billing_cycle}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Amount
            </p>

            <p className="mt-1 text-xl font-semibold">
              ₹{invoice.amount}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Billing Period
            </p>

            <p className="mt-1 font-medium">
              {invoice.billing_period_start} →{' '}
              {invoice.billing_period_end}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Due Date
            </p>
              
            <p className="mt-1 font-medium">
              {invoice.due_date}
            </p>
              
            {canEditDueDate &&
              invoice.status !== 'PAID' &&
              invoice.status !== 'VOID' && (
                <InvoiceDueDateEditor
                  invoiceId={invoice.id}
                  currentDueDate={invoice.due_date}
                />
              )}
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <p className="mt-1 font-semibold">
              {invoice.status}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Created
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                invoice.created_at
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Status Controls */}
      {profile?.role === 'BILLING_ADMIN' && (
        <section className="mt-6 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">
            Invoice Status
          </h2>

          <InvoiceStatusControl
            invoiceId={invoice.id}
            currentStatus={invoice.status}
          />
        </section>
      )}
        
      {/* Notes */}
      <section className="mt-6 rounded-lg border p-6">
        <InvoiceNotes invoiceId={invoice.id} />
      </section>

      {/* Credit Notes */}
      {profile?.role === 'BILLING_ADMIN' && (
        <section className="mt-6 rounded-lg border p-6">
          <CreditNoteControls
            invoiceId={invoice.id}
            invoiceAmount={Number(invoice.amount)}
          />
        </section>
      )}

      {/* History */}
      <section className="mt-6 rounded-lg border p-6">
        <InvoiceHistory invoiceId={invoice.id} />
      </section>
    </main>
  )
}