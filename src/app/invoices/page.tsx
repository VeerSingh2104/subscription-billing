import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNavbar from '@/app/components/app-navbar'
import InvoiceList from './invoice-list'

const PAGE_SIZE = 10

type SearchParams = {
  q?: string
  status?: string
  overdue?: string
  owner?: string
  sort?: string
  direction?: string
  page?: string
}

const ALLOWED_STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'VOID']

const ALLOWED_SORTS = ['due_date', 'amount', 'status']

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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
  const params = await searchParams

  const query =
    typeof params.q === 'string'
      ? params.q.trim()
      : ''

  const status = ALLOWED_STATUSES.includes(
    params.status ?? ''
  )
    ? params.status!
    : 'ALL'

  const overdue = params.overdue === 'true'

  const owner =
    typeof params.owner === 'string'
      ? params.owner
      : 'ALL'

  const sort = ALLOWED_SORTS.includes(
    params.sort ?? ''
  )
    ? params.sort!
    : 'due_date'

  const direction =
    params.direction === 'desc'
      ? 'desc'
      : 'asc'

  const requestedPage = Number.parseInt(
    params.page ?? '1',
    10
  )

  const page =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1

  /*
   * ---------------------------------------------------------
   * 1. Load account managers for the owner filter.
   * ---------------------------------------------------------
   */

  const {
    data: owners,
    error: ownersError,
  } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'ACCOUNT_MANAGER')
    .order('full_name', {
      ascending: true,
    })

  /*
   * ---------------------------------------------------------
   * 2. Find subscriptions visible to this user.
   *
   * Search and owner filtering happen in Postgres here.
   * We only need subscription IDs for the invoice query.
   * ---------------------------------------------------------
   */

  let subscriptionQuery = supabase
    .from('subscriptions')
    .select(
      `
        id,
        customer_name,
        billing_email,
        plan_name,
        billing_cycle,
        owner_id
      `
    )

  /*
   * Search customer name OR billing email.
   */

  if (query) {
    const escapedQuery = query
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/,/g, '\\,')

    subscriptionQuery = subscriptionQuery.or(
      `customer_name.ilike.%${escapedQuery}%,billing_email.ilike.%${escapedQuery}%`
    )
  }

  /*
   * Filter by owning account manager.
   */

  if (owner !== 'ALL') {
    subscriptionQuery = subscriptionQuery.eq(
      'owner_id',
      owner
    )
  }

  const {
    data: subscriptions,
    error: subscriptionError,
  } = await subscriptionQuery

  if (subscriptionError) {
    console.error(
      'Could not load subscriptions:',
      subscriptionError
    )
  }

  /*
   * ---------------------------------------------------------
   * 3. Get subscription IDs.
   * ---------------------------------------------------------
   */

  const visibleSubscriptions =
    subscriptions ?? []

  const subscriptionIds =
    visibleSubscriptions.map(
      (subscription) => subscription.id
    )

  /*
   * ---------------------------------------------------------
   * 4. Fetch invoices belonging to those subscriptions.
   *
   * Status, overdue, sorting and pagination all happen
   * server-side in Postgres.
   * ---------------------------------------------------------
   */

  let invoices: any[] = []
  let invoiceError: any = null
  let count: number | null = 0

  /*
   * If there are no matching subscriptions, there cannot
   * be any matching invoices.
   */

  if (subscriptionIds.length > 0) {
    let invoiceQuery = supabase
      .from('invoices')
      .select(
        `
          id,
          subscription_id,
          billing_period_start,
          billing_period_end,
          amount,
          due_date,
          status,
          created_at
        `,
        { count: 'exact' }
      )
      .in(
        'subscription_id',
        subscriptionIds
      )

    /*
     * Status filter.
     */

    if (status !== 'ALL') {
      invoiceQuery = invoiceQuery.eq(
        'status',
        status
      )
    }

    /*
     * Overdue filter.
     *
     * An invoice is overdue when:
     * - due date is before today
     * - it is not PAID
     * - it is not VOID
     */

    if (overdue) {
      const today = new Date()
        .toISOString()
        .split('T')[0]

      invoiceQuery = invoiceQuery
        .lt('due_date', today)
        .neq('status', 'PAID')
        .neq('status', 'VOID')
    }

    /*
     * Server-side sorting.
     */

    invoiceQuery = invoiceQuery.order(
      sort,
      {
        ascending:
          direction === 'asc',
      }
    )

    /*
     * Stable secondary sort.
     */

    invoiceQuery = invoiceQuery.order(
      'created_at',
      {
        ascending: false,
      }
    )

    /*
     * Server-side pagination.
     */

    const from =
      (page - 1) * PAGE_SIZE

    const to =
      from + PAGE_SIZE - 1

    invoiceQuery =
      invoiceQuery.range(
        from,
        to
      )

    const result =
      await invoiceQuery

    invoices =
      result.data ?? []

    invoiceError =
      result.error

    count =
      result.count
  }

  /*
   * ---------------------------------------------------------
   * 5. Combine invoice + subscription data on the SERVER.
   *
   * This restores the convenient shape expected by
   * InvoiceList without using Supabase nested relationships.
   * ---------------------------------------------------------
   */

  const subscriptionMap =
    new Map(
      visibleSubscriptions.map(
        (subscription) => [
          subscription.id,
          subscription,
        ]
      )
    )

  const invoicesWithSubscriptions =
    invoices.map((invoice) => ({
      ...invoice,
      subscriptions: [
        subscriptionMap.get(
          invoice.subscription_id
        ),
      ].filter(Boolean),
    }))

  /*
   * ---------------------------------------------------------
   * 6. Pagination information.
   * ---------------------------------------------------------
   */

  const totalMatches =
    count ?? 0

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalMatches / PAGE_SIZE
      )
    )

  /*
   * If someone manually enters a page beyond
   * the available range, redirect to the last page.
   */

  if (
    totalMatches > 0 &&
    page > totalPages
  ) {
    const correctedParams =
      new URLSearchParams()

    if (query) {
      correctedParams.set(
        'q',
        query
      )
    }

    if (status !== 'ALL') {
      correctedParams.set(
        'status',
        status
      )
    }

    if (overdue) {
      correctedParams.set(
        'overdue',
        'true'
      )
    }

    if (owner !== 'ALL') {
      correctedParams.set(
        'owner',
        owner
      )
    }

    if (sort !== 'due_date') {
      correctedParams.set(
        'sort',
        sort
      )
    }

    if (direction !== 'asc') {
      correctedParams.set(
        'direction',
        direction
      )
    }

    correctedParams.set(
      'page',
      String(totalPages)
    )

    redirect(
      `/invoices?${correctedParams.toString()}`
    )
  }

  const currentFrom =
    totalMatches === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1

  const currentTo =
    totalMatches === 0
      ? 0
      : Math.min(
          page * PAGE_SIZE,
          totalMatches
        )

  return (
    <>
      <AppNavbar isAdmin={profile.role === 'BILLING_ADMIN'} />

      <main className="min-h-screen bg-background text-foreground animate-fade-in">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* ====================================================== */}
          {/* PAGE HEADER */}
          {/* ====================================================== */}

          <header
            className="glass motion-card rounded-3xl p-6 animate-fade-up sm:p-7"
            style={{ animationDelay: '70ms' }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    Billing activity
                  </p>

                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  Invoices
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Search, filter, and manage invoices across your billing portfolio.
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <a
                  href="/api/invoices/receivables/csv"
                  className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                >
                  Export Receivables
                </a>

                <div className="glass-button motion-card rounded-2xl bg-background/25 px-5 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total Invoices
                  </p>

                  <p className="mt-0.5 text-xl font-bold tracking-tight">
                    {totalMatches}
                  </p>

                </div>

              </div>

            </div>
          </header>

          {/* ====================================================== */}
          {/* CONTENT */}
          {/* ====================================================== */}

          {invoiceError ? (
            <div
              className="glass mt-6 rounded-2xl border-red-500/20 bg-red-500/5 p-5 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-sm font-bold text-red-600 dark:text-red-400">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Unable to load invoices
                  </p>

                  <p className="mt-1 text-xs text-red-500/80 dark:text-red-300/80">
                    {invoiceError.message}
                  </p>
                </div>

              </div>
            </div>
          ) : subscriptionError ? (
            <div
              className="glass mt-6 rounded-2xl border-red-500/20 bg-red-500/5 p-5 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-sm font-bold text-red-600 dark:text-red-400">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Unable to load subscriptions
                  </p>

                  <p className="mt-1 text-xs text-red-500/80 dark:text-red-300/80">
                    {subscriptionError.message}
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div
              className="animate-fade-up"
              style={{ animationDelay: '120ms' }}
            >
              <InvoiceList
                invoices={invoicesWithSubscriptions}
                owners={owners ?? []}
                query={query}
                status={status}
                overdue={overdue}
                owner={owner}
                sort={sort}
                direction={direction}
                page={page}
                totalMatches={totalMatches}
                totalPages={totalPages}
                currentFrom={currentFrom}
                currentTo={currentTo}
              />
            </div>
          )}

        </div>
      </main>
    </>
  )
}