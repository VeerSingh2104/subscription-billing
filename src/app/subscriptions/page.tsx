import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNavbar from '@/app/components/app-navbar'
import SubscriptionList from './subscription-list'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background text-foreground animate-fade-in">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="flex flex-col gap-4 border-b border-border pb-8 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                Customer contracts
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                Subscriptions
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Search, review, and open subscription records from one place.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm motion-card">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </p>

              <p className="mt-1 text-xl font-bold">
                {subscriptions?.length ?? 0}
              </p>
            </div>
          </header>

          {error ? (
            <div
              className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-300 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              Could not load subscriptions: {error.message}
            </div>
          ) : subscriptions && subscriptions.length > 0 ? (
            <div
              className="mt-8 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <SubscriptionList subscriptions={subscriptions} />
            </div>
          ) : (
            <div
              className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center animate-fade-scale"
              style={{ animationDelay: '100ms' }}
            >
              <p className="text-sm font-semibold">
                No subscriptions found
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                New customer subscriptions will appear here.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}