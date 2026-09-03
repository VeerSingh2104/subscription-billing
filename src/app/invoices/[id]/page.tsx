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
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/invoices"
        className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to Invoices
      </Link>

      {/* Invoice Hero */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border border-t-4 border-t-blue-500 bg-card shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                Invoice
              </p>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                {invoice.status}
              </span>
            </div>

            <h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {invoice.subscriptions?.customer_name}
            </h1>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {invoice.subscriptions?.plan_name}
              <span className="mx-1.5">•</span>
              {invoice.subscriptions?.billing_cycle}
            </p>

            <p className="mt-1.5 text-xs text-muted-foreground">
              Invoice #{invoice.id.slice(0, 8)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-border bg-background px-4 py-2.5 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Invoice amount
              </p>

              <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
                INR {Number(invoice.amount).toFixed(2)}
              </p>

              <p className="text-xs text-muted-foreground">
                Billing record
              </p>
            </div>

            <InvoicePdfButton invoiceId={invoice.id} />
          </div>
        </div>
      </section>

      {/* Invoice Information */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/10 px-5 py-3">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
            Overview
          </p>

          <h2 className="mt-0.5 text-base font-bold text-foreground">
            Invoice information
          </h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Billing details and payment information for this invoice.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4">
          {/* Customer */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.subscriptions?.customer_name}
            </p>
          </div>

          {/* Plan */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Plan
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.subscriptions?.plan_name}
            </p>
          </div>

          {/* Billing Cycle */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Billing cycle
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.subscriptions?.billing_cycle}
            </p>
          </div>

          {/* Amount */}
          <div className="border-b border-border p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Amount
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              INR {Number(invoice.amount).toFixed(2)}
            </p>
          </div>

          {/* Billing Period */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Billing period
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.billing_period_start}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              through {invoice.billing_period_end}
            </p>
          </div>

          {/* Due Date */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Due date
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.due_date}
            </p>

            {canEditDueDate &&
              invoice.status !== 'PAID' &&
              invoice.status !== 'VOID' && (
                <div className="mt-1.5">
                  <InvoiceDueDateEditor
                    invoiceId={invoice.id}
                    currentDueDate={invoice.due_date}
                  />
                </div>
              )}
          </div>

          {/* Status */}
          <div className="border-b border-border p-3.5 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>

            <div className="mt-1.5">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Created */}
          <div className="border-b border-border p-3.5 lg:border-b-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Created
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground">
              {new Date(invoice.created_at).toLocaleDateString()}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(invoice.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Invoice ID */}
        <div className="flex flex-col gap-1 border-t border-border bg-muted/10 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Invoice ID
          </p>

          <p className="break-all text-[9px] text-muted-foreground">
            {invoice.id}
          </p>
        </div>
      </section>

      {/* Status Controls */}
      {profile?.role === 'BILLING_ADMIN' && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/10 px-5 py-3">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
              Actions
            </p>

            <h2 className="mt-0.5 text-base font-bold text-foreground">
              Invoice status
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage the invoice lifecycle from draft through payment or void.
            </p>
          </div>

          <div className="px-5 py-3">
            <InvoiceStatusControl
              invoiceId={invoice.id}
              currentStatus={invoice.status}
            />
          </div>
        </section>
      )}

      {/* Notes */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/10 px-5 py-3">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
            Internal record
          </p>

          <h2 className="mt-0.5 text-base font-bold text-foreground">
            Notes
          </h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Keep operational notes attached to this invoice.
          </p>
        </div>

        <div className="px-5 py-3">
          <InvoiceNotes invoiceId={invoice.id} />
        </div>
      </section>

      {/* Credit Notes */}
      {profile?.role === 'BILLING_ADMIN' && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/10 px-5 py-3">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
              Corrections
            </p>

            <h2 className="mt-0.5 text-base font-bold text-foreground">
              Credit notes
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Record billing corrections without changing the original invoice.
            </p>
          </div>

          <div className="px-5 py-3">
            <CreditNoteControls
              invoiceId={invoice.id}
              invoiceAmount={Number(invoice.amount)}
            />
          </div>
        </section>
      )}

      {/* History */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/10 px-5 py-3">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
            Audit trail
          </p>

          <h2 className="mt-0.5 text-base font-bold text-foreground">
            Invoice history
          </h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            A permanent record of invoice events and changes.
          </p>
        </div>

        <div className="px-5 py-3">
          <InvoiceHistory invoiceId={invoice.id} />
        </div>
      </section>

      <div className="h-4" />
    </main>
  )
}