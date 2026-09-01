import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppNavbar from '@/app/components/app-navbar'

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
      (collaborators ?? []).map((collaborator) => collaborator.user_id)
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

  const collaboratorsWithProfiles = (collaborators ?? []).map(
    (collaborator) => ({
      ...collaborator,
      full_name: profileNamesById.get(collaborator.user_id) ?? null,
    })
  )

  return (
    <>
      <AppNavbar />

      <main className="p-10">
        {/* Back */}
        <Link
          href="/subscriptions"
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Subscriptions
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Subscription Details
          </h1>

          <p className="mt-2 text-gray-500">
            {subscription.customer_name}
          </p>
        </div>

        {/* Subscription Information */}
        <section className="mt-8 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">
            Subscription Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Customer
              </p>

              <p className="mt-1 font-medium">
                {subscription.customer_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Plan
              </p>

              <p className="mt-1 font-medium">
                {subscription.plan_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Billing Cycle
              </p>

              <p className="mt-1 font-medium">
                {subscription.billing_cycle}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Price
              </p>

              <p className="mt-1 text-xl font-semibold">
                ₹{subscription.price}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Start Date
              </p>

              <p className="mt-1 font-medium">
                {subscription.start_date}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                End Date
              </p>

              <p className="mt-1 font-medium">
                {subscription.end_date || 'Active'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="mt-1 font-semibold">
                {subscription.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Subscription ID
              </p>

              <p className="mt-1 break-all text-sm font-medium">
                {subscription.id}
              </p>
            </div>
          </div>
        </section>

        {/* Account Managers */}
        <section className="mt-6 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">
            Assigned Account Managers
          </h2>

          {collaboratorsError && (
            <p className="mt-4 text-sm text-red-600">
              Could not load account managers:{' '}
              {collaboratorsError.message}
            </p>
          )}

          {!collaboratorsError &&
            collaboratorsWithProfiles.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">
                No account managers assigned.
              </p>
            )}

          {!collaboratorsError &&
            collaboratorsWithProfiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {collaboratorsWithProfiles.map((collaborator) => (
                  <div
                    key={collaborator.user_id}
                    className="rounded-md border p-3"
                  >
                    <p className="text-sm text-gray-500">
                      Manager
                    </p>

                    <p className="font-medium">
                      {collaborator.full_name?.trim() ||
                        'Unnamed account manager'}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* Invoices */}
        <section className="mt-6 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">
            Invoices
          </h2>

          {invoicesError && (
            <p className="mt-4 text-sm text-red-600">
              Could not load invoices:{' '}
              {invoicesError.message}
            </p>
          )}

          {!invoicesError &&
            (!invoices || invoices.length === 0) && (
              <p className="mt-4 text-sm text-gray-500">
                No invoices found for this subscription.
              </p>
            )}

          {!invoicesError &&
            invoices &&
            invoices.length > 0 && (
              <div className="mt-4 space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-md border p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">
                          ₹{invoice.amount}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {invoice.billing_period_start} →{' '}
                          {invoice.billing_period_end}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Due: {invoice.due_date}
                        </p>

                        <p className="mt-1 text-sm">
                          Status: {invoice.status}
                        </p>
                      </div>

                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="inline-flex rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        View Invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </main>
    </>
  )
}
