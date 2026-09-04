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
  const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profileError || !profile) {
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

      <main className="min-h-screen bg-background text-foreground animate-fade-in">
      <AppNavbar isAdmin={profile.role === 'BILLING_ADMIN'} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* ====================================================== */}
          {/* BACK */}
          {/* ====================================================== */}

          <Link
            href="/subscriptions"
            className="motion-link inline-flex text-xs font-medium text-muted-foreground transition hover:text-foreground animate-fade-up"
          >
            ← Back to Subscriptions
          </Link>

          {/* ====================================================== */}
          {/* HEADER */}
          {/* ====================================================== */}

          <section
            className="glass motion-card relative mt-4 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '70ms' }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />

            <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2.5">

                  <div className="flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                      Subscription
                    </p>
                  </div>

                  <StatusBadge
                    status={subscription.status || 'ACTIVE'}
                  />

                </div>

                <h1 className="mt-3 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {subscription.customer_name}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription.plan_name}
                  <span className="mx-1.5">•</span>
                  {subscription.billing_cycle}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Subscription #{subscription.id.slice(0, 8)}
                </p>

              </div>

              {/* Value */}

              <div className="glass-button motion-card shrink-0 rounded-2xl bg-background/25 px-5 py-4 lg:min-w-[190px] lg:text-right">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Subscription value
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {formatCurrency(subscription.price)}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subscription.billing_cycle}
                </p>

              </div>

            </div>
          </section>

          {/* ====================================================== */}
          {/* SUBSCRIPTION INFORMATION */}
          {/* ====================================================== */}

          <section
            className="glass motion-card mt-5 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '130ms' }}
          >
            <div className="border-b border-border/50 bg-background/15 px-5 py-4 sm:px-6">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Overview
              </p>

              <h2 className="mt-1 text-base font-bold">
                Subscription information
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Key billing and contract details for this subscription.
              </p>

            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {subscription.customer_name}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Billing email
                </p>

                <p className="mt-1.5 break-all text-xs font-medium">
                  {subscription.billing_email}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Plan
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {subscription.plan_name}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Billing cycle
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {subscription.billing_cycle}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {formatCurrency(subscription.price)}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Start date
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {formatDate(subscription.start_date)}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  End date
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {subscription.end_date
                    ? formatDate(subscription.end_date)
                    : 'Active'}
                </p>
              </div>

              <div className="glass-button rounded-2xl bg-background/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={subscription.status || 'ACTIVE'}
                  />
                </div>
              </div>

            </div>

            <div className="border-t border-border/50 bg-background/10 px-5 py-3 sm:flex sm:items-center sm:justify-between sm:px-6">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subscription ID
              </p>

              <p className="mt-1 break-all font-mono text-[9px] text-muted-foreground sm:mt-0 sm:text-right">
                {subscription.id}
              </p>

            </div>
          </section>

          {/* ====================================================== */}
          {/* ACCOUNT ACCESS */}
          {/* ====================================================== */}

          <section
            className="glass motion-card mt-5 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '190ms' }}
          >
            <div className="border-b border-border/50 bg-background/15 px-5 py-4 sm:px-6">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Access
              </p>

              <h2 className="mt-1 text-base font-bold">
                Account access
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                The owner and collaborators with access to this subscription.
              </p>

            </div>

            <div className="px-5 py-5 sm:px-6">

              {/* Owner */}

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Owner
                </p>

                <div className="glass-button motion-card mt-2 flex items-center gap-3 rounded-2xl bg-blue-500/5 px-4 py-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/15 bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-300">
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

              <div className="mt-6 border-t border-border/50 pt-5">

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
                  <div
                    className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-700 dark:text-red-300 animate-fade-up"
                    style={{ animationDelay: '250ms' }}
                  >
                    Unable to load collaborators:{' '}
                    {collaboratorsError.message}
                  </div>
                )}

                {!collaboratorsError &&
                  collaboratorsWithProfiles.length === 0 && (
                    <div
                      className="glass mt-3 rounded-2xl border-dashed bg-background/15 px-4 py-6 text-center animate-fade-scale"
                      style={{ animationDelay: '250ms' }}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        No collaborators assigned
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Only the subscription owner currently has access.
                      </p>
                    </div>
                  )}

                {!collaboratorsError &&
                  collaboratorsWithProfiles.length > 0 && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">

                      {collaboratorsWithProfiles.map(
                        (collaborator, index) => (
                          <div
                            key={collaborator.user_id}
                            className="glass-button motion-card flex items-center gap-3 rounded-2xl bg-background/15 px-4 py-3 animate-fade-up"
                            style={{
                              animationDelay: `${Math.min(
                                500,
                                270 + index * 60
                              )}ms`,
                            }}
                          >

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-bold text-muted-foreground">
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
                        )
                      )}

                    </div>
                  )}

              </div>

            </div>
          </section>

          {/* ====================================================== */}
          {/* INVOICES */}
          {/* ====================================================== */}

          <section
            className="glass motion-card mt-5 overflow-hidden rounded-3xl animate-fade-up"
            style={{ animationDelay: '310ms' }}
          >
            <div className="flex flex-col gap-3 border-b border-border/50 bg-background/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                  Billing
                </p>

                <h2 className="mt-1 text-base font-bold">
                  Invoices
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Billing history for this subscription.
                </p>

              </div>

              <div className="glass-button rounded-xl px-3 py-2 text-[10px] font-semibold text-muted-foreground">
                {invoices?.length ?? 0}{' '}
                {invoices?.length === 1
                  ? 'invoice'
                  : 'invoices'}
              </div>

            </div>

            <div className="px-5 py-5 sm:px-6">

              {invoicesError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-700 dark:text-red-300 animate-fade-up">
                  Unable to load invoices:{' '}
                  {invoicesError.message}
                </div>
              )}

              {!invoicesError &&
                (!invoices || invoices.length === 0) && (
                  <div className="glass rounded-2xl border-dashed bg-background/15 px-5 py-9 text-center animate-fade-scale">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
                      —
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                      No invoices yet
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Invoices created for this subscription will appear here.
                    </p>

                  </div>
                )}

              {!invoicesError &&
                invoices &&
                invoices.length > 0 && (
                  <div className="space-y-3">

                    {invoices.map((invoice, index) => (
                      <div
                        key={invoice.id}
                        className="glass-button motion-card group rounded-2xl bg-background/15 px-4 py-4 animate-fade-up"
                        style={{
                          animationDelay: `${Math.min(
                            500,
                            360 + index * 60
                          )}ms`,
                        }}
                      >

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2.5">

                              <p className="text-sm font-semibold transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                                {formatCurrency(invoice.amount)}
                              </p>

                              <StatusBadge
                                status={invoice.status}
                              />

                            </div>

                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Billing period:{' '}
                              {formatDate(
                                invoice.billing_period_start
                              )}
                              {' → '}
                              {formatDate(
                                invoice.billing_period_end
                              )}
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
                            className="glass-button motion-button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          >
                            View Invoice

                            <span
                              aria-hidden="true"
                              className="transition-transform duration-200 group-hover:translate-x-0.5"
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

          <div className="h-4" />

        </div>
      </main>
    </>
  )
}