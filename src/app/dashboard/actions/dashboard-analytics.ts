'use server'

import { createClient } from '@/lib/supabase/server'

type Invoice = {
  id: string
  subscription_id: string
  amount: number | string
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
  created_at: string
  due_date: string
}

type Subscription = {
  id: string
  plan_name: string
}

type HistoryEvent = {
  invoice_id: string
  created_at: string
  new_status: string | null
}

export type DashboardAnalytics = {
  issuedThisMonth: number
  collectedThisMonth: number
  receivables: number
  overdueCount: number
  statusBreakdown: {
    status: string
    count: number
    amount: number
  }[]
  planBreakdown: {
    plan: string
    count: number
    amount: number
  }[]
  weeklyRevenue: {
    label: string
    start: string
    end: string
    amount: number
  }[]
}

function startOfMonth(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  )
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day

  result.setUTCDate(result.getUTCDate() + diff)
  result.setUTCHours(0, 0, 0, 0)

  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function money(value: number | string | null | undefined) {
  return Number(value ?? 0)
}

export async function getDashboardAnalytics(
  weekOffset = 0
): Promise<DashboardAnalytics> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unable to load your profile.')
  }

  /*
   * Account managers should only see subscriptions they own
   * or collaborate on. Billing admins can see everything.
   */
  let visibleSubscriptionIds: string[] | null = null

  if (profile.role === 'ACCOUNT_MANAGER') {
    const [{ data: owned }, { data: collaborations }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id')
        .eq('owner_id', user.id),

      supabase
        .from('subscription_collaborators')
        .select('subscription_id')
        .eq('user_id', user.id),
    ])

    visibleSubscriptionIds = Array.from(
      new Set([
        ...(owned ?? []).map((item) => item.id),
        ...(collaborations ?? []).map((item) => item.subscription_id),
      ])
    )
  }

  /*
   * Fetch invoices visible to this user.
   *
   * We need all visible invoices for status/plan/receivable
   * calculations, while collection dates come from immutable
   * invoice history below.
   */
  let invoiceQuery = supabase
    .from('invoices')
    .select(
      'id, subscription_id, amount, status, created_at, due_date'
    )

  if (visibleSubscriptionIds !== null) {
    if (visibleSubscriptionIds.length === 0) {
      return emptyAnalytics()
    }

    invoiceQuery = invoiceQuery.in(
      'subscription_id',
      visibleSubscriptionIds
    )
  }

  const { data: invoices, error: invoicesError } = await invoiceQuery

  if (invoicesError) {
    throw new Error(invoicesError.message)
  }

  const invoiceRows = (invoices ?? []) as Invoice[]

  const subscriptionIds = Array.from(
    new Set(invoiceRows.map((invoice) => invoice.subscription_id))
  )

  let subscriptions: Subscription[] = []

  if (subscriptionIds.length > 0) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, plan_name')
      .in('id', subscriptionIds)

    if (error) {
      throw new Error(error.message)
    }

    subscriptions = (data ?? []) as Subscription[]
  }

  const subscriptionMap = new Map(
    subscriptions.map((subscription) => [
      subscription.id,
      subscription.plan_name,
    ])
  )

  const today = new Date()
  const monthStart = startOfMonth(today)
  const nextMonthStart = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() + 1,
      1
    )
  )

  /*
   * Invoice history is the source of truth for when an invoice
   * became Paid. This avoids treating an unrelated invoice edit
   * as a collection event.
   */
  const paidInvoiceIds = invoiceRows
    .filter((invoice) => invoice.status === 'PAID')
    .map((invoice) => invoice.id)

  let historyRows: HistoryEvent[] = []

  if (paidInvoiceIds.length > 0) {
    const { data, error } = await supabase
      .from('invoice_history')
      .select('invoice_id, created_at, new_status')
      .in('invoice_id', paidInvoiceIds)
      .eq('new_status', 'PAID')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    historyRows = (data ?? []) as HistoryEvent[]
  }

  /*
   * If an invoice was somehow marked Paid more than once,
   * count only its first Paid event.
   */
  const firstPaidEventByInvoice = new Map<string, HistoryEvent>()

  for (const event of historyRows) {
    if (!firstPaidEventByInvoice.has(event.invoice_id)) {
      firstPaidEventByInvoice.set(event.invoice_id, event)
    }
  }

  const invoiceMap = new Map(
    invoiceRows.map((invoice) => [invoice.id, invoice])
  )

  const issuedThisMonth = invoiceRows.filter((invoice) => {
    if (invoice.status !== 'ISSUED') return false

    const created = new Date(invoice.created_at)

    return created >= monthStart && created < nextMonthStart
  }).length

  const collectedEvents = Array.from(
    firstPaidEventByInvoice.values()
  )

  const collectedThisMonth = collectedEvents.reduce(
    (total, event) => {
      const paidAt = new Date(event.created_at)

      if (paidAt >= monthStart && paidAt < nextMonthStart) {
        const invoice = invoiceMap.get(event.invoice_id)

        return total + money(invoice?.amount)
      }

      return total
    },
    0
  )

  /*
   * Receivables = all currently Issued invoice amounts.
   * Overdue invoices are still Issued until they are Paid or Void.
   */
  const receivables = invoiceRows
    .filter((invoice) => invoice.status === 'ISSUED')
    .reduce((total, invoice) => total + money(invoice.amount), 0)

  const todayString = formatDate(today)

  const overdueCount = invoiceRows.filter((invoice) => {
    return (
      invoice.due_date < todayString &&
      invoice.status !== 'PAID' &&
      invoice.status !== 'VOID'
    )
  }).length

  /*
   * Status breakdown.
   */
  const statusMap = new Map<
    string,
    { count: number; amount: number }
  >()

  for (const invoice of invoiceRows) {
    const existing = statusMap.get(invoice.status) ?? {
      count: 0,
      amount: 0,
    }

    existing.count += 1
    existing.amount += money(invoice.amount)

    statusMap.set(invoice.status, existing)
  }

  const statusOrder = ['DRAFT', 'ISSUED', 'PAID', 'VOID']

  const statusBreakdown = statusOrder
    .filter((status) => statusMap.has(status))
    .map((status) => ({
      status,
      ...statusMap.get(status)!,
    }))

  /*
   * Plan breakdown.
   */
  const planMap = new Map<
    string,
    { count: number; amount: number }
  >()

  for (const invoice of invoiceRows) {
    const plan =
      subscriptionMap.get(invoice.subscription_id) ?? 'Unknown Plan'

    const existing = planMap.get(plan) ?? {
      count: 0,
      amount: 0,
    }

    existing.count += 1
    existing.amount += money(invoice.amount)

    planMap.set(plan, existing)
  }

  const planBreakdown = Array.from(planMap.entries())
    .map(([plan, values]) => ({
      plan,
      ...values,
    }))
    .sort((a, b) => b.amount - a.amount)

  /*
   * Eight-week revenue timeline.
   *
   * weekOffset = 0  -> current eight-week window
   * weekOffset = -1 -> previous eight-week window
   * weekOffset = 1  -> next eight-week window
   */
  const currentWeekStart = startOfWeek(today)

  const selectedWeekStart = addDays(
    currentWeekStart,
    weekOffset * 7
  )

  const windowStart = addDays(
    selectedWeekStart,
    -7 * 7
  )

  const weeklyRevenue = Array.from({ length: 8 }, (_, index) => {
    const weekStart = addDays(windowStart, index * 7)
    const weekEndExclusive = addDays(weekStart, 7)
    const weekEnd = addDays(weekStart, 6)

    const amount = collectedEvents.reduce(
      (total, payment) => {
        const paidAt = new Date(payment.created_at)

        if (
          paidAt >= weekStart &&
          paidAt < weekEndExclusive
        ) {
          const invoice = invoiceMap.get(payment.invoice_id)

          return total + money(invoice?.amount)
        }

        return total
      },
      0
    )

    const label = weekStart.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })

    return {
      label,
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      amount,
    }
  })

  return {
    issuedThisMonth,
    collectedThisMonth,
    receivables,
    overdueCount,
    statusBreakdown,
    planBreakdown,
    weeklyRevenue,
  }
}

function emptyAnalytics(): DashboardAnalytics {
  const today = new Date()
  const currentWeekStart = startOfWeek(today)
  const windowStart = addDays(currentWeekStart, -7 * 7)

  const weeklyRevenue = Array.from({ length: 8 }, (_, index) => {
    const weekStart = addDays(windowStart, index * 7)
    const weekEnd = addDays(weekStart, 6)

    return {
      label: weekStart.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      amount: 0,
    }
  })

  return {
    issuedThisMonth: 0,
    collectedThisMonth: 0,
    receivables: 0,
    overdueCount: 0,
    statusBreakdown: [],
    planBreakdown: [],
    weeklyRevenue,
  }
}