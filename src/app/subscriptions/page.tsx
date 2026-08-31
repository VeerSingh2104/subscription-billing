import { createClient } from '@/lib/supabase/server'
import AppNavbar from '@/app/components/app-navbar'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
    <AppNavbar />
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Subscriptions
      </h1>

      {error && (
        <p className="mt-4 text-red-600">
          Error: {error.message}
        </p>
      )}

      {!error && subscriptions?.length === 0 && (
        <p className="mt-4 text-gray-500">
          No subscriptions found.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {subscriptions?.map((subscription) => (
          <div
            key={subscription.id}
            className="rounded-lg border p-5"
          >
            <h2 className="font-semibold">
              {subscription.customer_name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {subscription.plan_name} ·{' '}
              {subscription.billing_cycle}
            </p>

            <p className="mt-2">
              ₹{subscription.price}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Started: {subscription.start_date}
            </p>
          </div>
        ))}
      </div>
    </main>
    </>
  )
}