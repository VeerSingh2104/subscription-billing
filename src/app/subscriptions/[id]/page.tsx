import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppNavbar from '@/app/components/app-navbar'
import StatusBadge from '@/app/components/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'

type SubscriptionPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function SubscriptionDetailsPage({
  params,
}: SubscriptionPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !subscription) {
    notFound()
  }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', subscription.owner_id)
    .single()

  const { data: invoices, error: invoicesError } =
    await supabase
      .from('invoices')
      .select(
        `
        id,
        amount,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        created_at
      `
      )
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: false })

  const { data: collaborators, error: collaboratorsError } =
    await supabase
      .from('subscription_collaborators')
      .select('user_id')
      .eq('subscription_id', subscription.id)

  const collaboratorIds = [
    ...new Set(
      (collaborators ?? []).map(
        (collaborator) => collaborator.user_id
      )
    ),
  ]

  const { data: collaboratorProfiles } =
    collaboratorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', collaboratorIds)
      : { data: [] }

  const profileNamesById = new Map(
    (collaboratorProfiles ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ])
  )

  const collaboratorsWithProfiles = (
    collaborators ?? []
  ).map((collaborator) => ({
    ...collaborator,
    full_name:
      profileNamesById.get(collaborator.user_id) ?? null,
  }))

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Back */}
          <Link
            href="/subscriptions"
            className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to Subscriptions
          </Link>

          {/* Header */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-border border-t-4 border-t-blue-500 bg-card shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                    Subscription
                  </p>

                  <StatusBadge
                    status={subscription.status || 'ACTIVE'}
                  />
                </div>

                <h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {subscription.customer_name}
                </h1>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subscription.plan_name}
                  <span className="mx-1.5">•</span>
                  {subscription.billing_cycle}
                </p>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Subscription #{subscription.id.slice(0, 8)}
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-border bg-background px-4 py-2.5 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Subscription value
                </p>

                <p className="mt-0.5 text-xl font-bold tracking-tight">
                  {formatCurrency(subscription.price)}
                </p>

                <p className="text-xs text-muted-foreground">
                  {subscription.billing_cycle}
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Information */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/10 px-5 py-3">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                Overview
              </p>

              <h2 className="mt-0.5 text-base font-bold">
                Subscription information
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Key billing and contract details for this subscription.
              </p>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {subscription.customer_name}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Billing email
                </p>

                <p className="mt-1 break-all text-xs font-medium">
                  {subscription.billing_email}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Plan
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {subscription.plan_name}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Billing cycle
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {subscription.billing_cycle}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {formatCurrency(subscription.price)}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Start date
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {formatDate(subscription.start_date)}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  End date
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {subscription.end_date
                    ? formatDate(subscription.end_date)
                    : 'Active'}
                </p>
              </div>

              <div className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>

                <div className="mt-1">
                  <StatusBadge
                    status={subscription.status || 'ACTIVE'}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-border bg-muted/10 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subscription ID
              </p>

              <p className="break-all font-mono text-[9px] text-muted-foreground sm:text-right">
                {subscription.id}
              </p>
            </div>
          </section>

          {/* Access */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/10 px-5 py-3">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                Access
              </p>

              <h2 className="mt-0.5 text-base font-bold">
                Account access
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                The owner and collaborators with access to this subscription.
              </p>
            </div>

            <div className="px-5 py-4">

              {/* Owner */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Owner
                </p>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-300">
                    {(ownerProfile?.full_name?.trim() || 'A')
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {ownerProfile?.full_name?.trim() ||
                        'Unnamed account manager'}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Subscription owner
                    </p>
                  </div>
                </div>
              </div>

              {/* Collaborators */}
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Collaborators
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Additional account managers with access.
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {collaboratorsWithProfiles.length}{' '}
                    {collaboratorsWithProfiles.length === 1
                      ? 'collaborator'
                      : 'collaborators'}
                  </span>
                </div>

                {collaboratorsError && (
                  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
                    Could not load collaborators:{' '}
                    {collaboratorsError.message}
                  </div>
                )}

                {!collaboratorsError &&
                  collaboratorsWithProfiles.length === 0 && (
                    <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/10 px-4 py-5 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        No collaborators assigned
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Only the subscription owner currently has access.
                      </p>
                    </div>
                  )}

                {!collaboratorsError &&
                  collaboratorsWithProfiles.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {collaboratorsWithProfiles.map((collaborator) => (
                        <div
                          key={collaborator.user_id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-3 py-2.5 transition hover:bg-muted/20"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {(collaborator.full_name?.trim() || 'A')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Account manager
                            </p>

                            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                              {collaborator.full_name?.trim() ||
                                'Unnamed account manager'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </section>

          {/* Invoices */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-2.5 border-b border-border bg-muted/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                  Billing
                </p>

                <h2 className="mt-0.5 text-base font-bold">
                  Invoices
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Billing history for this subscription.
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {invoices?.length ?? 0}{' '}
                {invoices?.length === 1
                  ? 'invoice'
                  : 'invoices'}
              </div>
            </div>

            <div className="px-5 py-4">
              {invoicesError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
                  Could not load invoices:{' '}
                  {invoicesError.message}
                </div>
              )}

              {!invoicesError &&
                (!invoices || invoices.length === 0) && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center">
                    <p className="text-sm font-semibold">
                      No invoices yet
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Invoices created for this subscription will appear here.
                    </p>
                  </div>
                )}

              {!invoicesError &&
                invoices &&
                invoices.length > 0 && (
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="group rounded-xl border border-border bg-background px-4 py-3 transition hover:border-blue-500/30 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <p className="text-sm font-semibold">
                                {formatCurrency(invoice.amount)}
                              </p>

                              <StatusBadge status={invoice.status} />
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Billing period:{' '}
                              {formatDate(invoice.billing_period_start)}
                              {' → '}
                              {formatDate(invoice.billing_period_end)}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Due:{' '}
                              <span className="font-medium text-foreground">
                                {formatDate(invoice.due_date)}
                              </span>
                            </p>
                          </div>

                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-blue-500/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            View Invoice

                            <span
                              aria-hidden="true"
                              className="transition-transform group-hover:translate-x-0.5"
                            >
                              →
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </section>

          <div className="h-3" />
        </div>
      </main>
    </>
  )
}