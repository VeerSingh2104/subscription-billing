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
  const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profileError || !profile) {
  redirect('/login')
}
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <AppNavbar isAdmin={profile.role === 'BILLING_ADMIN'} />

      <main className="min-h-screen bg-background text-foreground animate-fade-in">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

          {/* ====================================================== */}
          {/* PAGE HEADER */}
          {/* ====================================================== */}

          <header
            className="glass rounded-3xl p-6 animate-fade-up sm:p-7"
            style={{ animationDelay: '70ms' }}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    Customer contracts
                  </p>

                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  Subscriptions
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Search, review, and open subscription records from one place.
                </p>

              </div>

              {/* Total */}

              <div className="glass-button motion-card shrink-0 rounded-2xl bg-background/25 px-5 py-4">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total subscriptions
                </p>

                <div className="mt-1 flex items-baseline gap-2">

                  <p className="text-2xl font-bold tracking-tight">
                    {subscriptions?.length ?? 0}
                  </p>

                  <span className="text-xs text-muted-foreground">
                    records
                  </span>

                </div>

              </div>

            </div>
          </header>

          {/* ====================================================== */}
          {/* CONTENT */}
          {/* ====================================================== */}

          {error ? (
            <div
              className="glass mt-8 rounded-2xl border-red-500/20 bg-red-500/5 p-6 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/10 text-sm font-bold text-red-600 dark:text-red-400">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Unable to load subscriptions
                  </p>

                  <p className="mt-1 text-sm text-red-500/80 dark:text-red-300/80">
                    {error.message}
                  </p>
                </div>

              </div>
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
              className="glass mt-8 rounded-2xl border-dashed p-12 text-center animate-fade-scale"
              style={{ animationDelay: '100ms' }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/10 text-lg font-semibold text-blue-500">
                +
              </div>

              <p className="mt-5 text-sm font-semibold">
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