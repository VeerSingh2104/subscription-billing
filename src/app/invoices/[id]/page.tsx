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
    <main className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* ====================================================== */}
        {/* BACK */}
        {/* ====================================================== */}

        <Link
          href="/invoices"
          className="motion-button inline-flex items-center rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground animate-fade-up"
        >
          ← Back to Invoices
        </Link>

        {/* ====================================================== */}
        {/* INVOICE HERO */}
        {/* ====================================================== */}

        <section
          className="glass motion-card relative mt-3 overflow-hidden rounded-3xl animate-fade-up"
          style={{ animationDelay: '70ms' }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2.5">

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                    Invoice
                  </p>
                </div>

                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                  {invoice.status}
                </span>

              </div>

              <h1 className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {invoice.subscriptions?.customer_name}
              </h1>

              <p className="mt-1 text-xs text-muted-foreground">
                {invoice.subscriptions?.plan_name}
                <span className="mx-1.5">•</span>
                {invoice.subscriptions?.billing_cycle}
              </p>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Invoice #{invoice.id.slice(0, 8)}
              </p>

            </div>

            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center">

              <div className="glass-button rounded-2xl px-5 py-3 text-right">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Invoice amount
                </p>

                <p className="mt-0.5 text-xl font-bold tracking-tight">
                  INR {Number(invoice.amount).toFixed(2)}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  Billing record
                </p>

              </div>

              <InvoicePdfButton invoiceId={invoice.id} />

            </div>

          </div>
        </section>

        {/* ====================================================== */}
        {/* INVOICE INFORMATION */}
        {/* ====================================================== */}

        <section
          className="glass motion-card mt-4 overflow-hidden rounded-3xl animate-fade-up"
          style={{ animationDelay: '130ms' }}
        >
          <div className="border-b border-border/50 px-5 py-4 sm:px-6">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
              Overview
            </p>

            <h2 className="mt-1 text-base font-bold">
              Invoice information
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Billing details and payment information for this invoice.
            </p>

          </div>

          <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* Customer */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {invoice.subscriptions?.customer_name}
              </p>
            </div>

            {/* Plan */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Plan
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {invoice.subscriptions?.plan_name}
              </p>
            </div>

            {/* Billing Cycle */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Billing cycle
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {invoice.subscriptions?.billing_cycle}
              </p>
            </div>

            {/* Amount */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                INR {Number(invoice.amount).toFixed(2)}
              </p>
            </div>

            {/* Billing Period */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Billing period
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {invoice.billing_period_start}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                through {invoice.billing_period_end}
              </p>
            </div>

            {/* Due Date */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Due date
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {invoice.due_date}
              </p>

              {canEditDueDate &&
                invoice.status !== 'PAID' &&
                invoice.status !== 'VOID' && (
                  <div className="mt-2">
                    <InvoiceDueDateEditor
                      invoiceId={invoice.id}
                      currentDueDate={invoice.due_date}
                    />
                  </div>
                )}

            </div>

            {/* Status */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </p>

              <div className="mt-2">
                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 transition-transform duration-200 hover:scale-105 dark:text-blue-300">
                  {invoice.status}
                </span>
              </div>

            </div>

            {/* Created */}

            <div className="rounded-2xl border border-border/50 bg-background/25 p-4 backdrop-blur-sm">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Created
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(invoice.created_at).toLocaleTimeString()}
              </p>

            </div>

          </div>

          {/* Invoice ID */}

          <div className="border-t border-border/50 bg-background/15 px-5 py-3 sm:px-6">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Invoice ID
            </p>

            <p className="mt-1 break-all text-[9px] text-muted-foreground">
              {invoice.id}
            </p>

          </div>

        </section>

        {/* ====================================================== */}
        {/* STATUS CONTROLS */}
        {/* ====================================================== */}

        {profile?.role === 'BILLING_ADMIN' && (
          <section
            className="glass motion-card mt-4 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '190ms' }}
          >
            <div className="border-b border-border/50 px-5 py-4 sm:px-6">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Actions
              </p>

              <h2 className="mt-1 text-base font-bold">
                Invoice status
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Manage the invoice lifecycle from draft through payment or void.
              </p>

            </div>

            <div className="px-5 py-4 sm:px-6">
              <InvoiceStatusControl
                invoiceId={invoice.id}
                currentStatus={invoice.status}
              />
            </div>

          </section>
        )}

        {/* ====================================================== */}
        {/* NOTES */}
        {/* ====================================================== */}

        <section
          className="glass motion-card mt-4 overflow-hidden rounded-3xl animate-fade-up"
          style={{ animationDelay: '250ms' }}
        >
          <div className="border-b border-border/50 px-5 py-4 sm:px-6">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
              Internal record
            </p>

            <h2 className="mt-1 text-base font-bold">
              Notes
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Keep operational notes attached to this invoice.
            </p>

          </div>

          <div className="px-5 py-4 sm:px-6">
            <InvoiceNotes invoiceId={invoice.id} />
          </div>

        </section>

        {/* ====================================================== */}
        {/* CREDIT NOTES */}
        {/* ====================================================== */}

        {profile?.role === 'BILLING_ADMIN' && (
          <section
            className="glass motion-card mt-4 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '310ms' }}
          >
            <div className="border-b border-border/50 px-5 py-4 sm:px-6">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Corrections
              </p>

              <h2 className="mt-1 text-base font-bold">
                Credit notes
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Record billing corrections without changing the original invoice.
              </p>

            </div>

            <div className="px-5 py-4 sm:px-6">
              <CreditNoteControls
                invoiceId={invoice.id}
                invoiceAmount={Number(invoice.amount)}
              />
            </div>

          </section>
        )}

        {/* ====================================================== */}
        {/* HISTORY */}
        {/* ====================================================== */}

        <section
          className="glass motion-card mt-4 overflow-hidden rounded-3xl animate-fade-up"
          style={{ animationDelay: '370ms' }}
        >
          <div className="border-b border-border/50 px-5 py-4 sm:px-6">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
              Audit trail
            </p>

            <h2 className="mt-1 text-base font-bold">
              Invoice history
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              A permanent record of invoice events and changes.
            </p>

          </div>

          <div className="px-5 py-4 sm:px-6">
            <InvoiceHistory invoiceId={invoice.id} />
          </div>

        </section>

        <div className="h-5" />

      </div>
    </main>
  )
}