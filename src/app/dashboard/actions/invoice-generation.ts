'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BulkInvoiceResult = {
  subscriptionId: string
  customerName: string
  planName: string
  billingCycle: string
  status: 'generated' | 'skipped' | 'failed'
  reason?: string
  invoiceId?: string
}

export type BulkInvoiceResponse = {
  success: boolean
  periodLabel: string
  results: BulkInvoiceResult[]
  error?: string
}

type Subscription = {
  id: string
  customer_name: string
  plan_name: string
  billing_cycle: string
  price: string | number
  start_date: string
  is_archived: boolean
}

/*
 * Work entirely with UTC date-only values so invoice periods
 * do not shift because of the server's timezone.
 */

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function daysInMonth(
  year: number,
  month: number
): number {
  return new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate()
}

function makeDate(
  year: number,
  month: number,
  day: number
): Date {
  const safeDay = Math.min(
    day,
    daysInMonth(year, month)
  )

  return new Date(
    Date.UTC(year, month, safeDay)
  )
}

function addMonths(
  date: Date,
  months: number
): Date {
  const targetMonth =
    date.getUTCMonth() + months

  return makeDate(
    date.getUTCFullYear() +
      Math.floor(targetMonth / 12),
    ((targetMonth % 12) + 12) % 12,
    date.getUTCDate()
  )
}

function addYears(
  date: Date,
  years: number
): Date {
  return makeDate(
    date.getUTCFullYear() + years,
    date.getUTCMonth(),
    date.getUTCDate()
  )
}

function subtractOneDay(
  date: Date
): Date {
  const result = new Date(date)
  result.setUTCDate(
    result.getUTCDate() - 1
  )
  return result
}

/*
 * Calculates the billing period containing today,
 * anchored to the subscription's original start date.
 *
 * Example:
 * Monthly subscription started on Aug 15:
 * current period on Sep 3 = Aug 15 -> Sep 14.
 *
 * Annual subscription started on Aug 15:
 * current period on Sep 3 = Aug 15 2026 -> Aug 14 2027.
 */
function getCurrentBillingPeriod(
  subscription: Subscription,
  today: Date
) {
  const subscriptionStart = new Date(
    `${subscription.start_date}T00:00:00Z`
  )

  if (
    Number.isNaN(
      subscriptionStart.getTime()
    )
  ) {
    throw new Error(
      'Subscription has an invalid start date'
    )
  }

  if (subscriptionStart > today) {
    return null
  }

  if (
    subscription.billing_cycle ===
    'MONTHLY'
  ) {
    const anchorDay =
      subscriptionStart.getUTCDate()

    let periodStart = makeDate(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      anchorDay
    )

    if (periodStart > today) {
      periodStart = addMonths(
        periodStart,
        -1
      )
    }

    const nextPeriodStart =
      addMonths(periodStart, 1)

    const periodEnd =
      subtractOneDay(
        nextPeriodStart
      )

    return {
      start: dateOnly(periodStart),
      end: dateOnly(periodEnd),
    }
  }

  if (
    subscription.billing_cycle ===
    'ANNUAL'
  ) {
    const anchorMonth =
      subscriptionStart.getUTCMonth()

    const anchorDay =
      subscriptionStart.getUTCDate()

    let periodStart = makeDate(
      today.getUTCFullYear(),
      anchorMonth,
      anchorDay
    )

    if (periodStart > today) {
      periodStart = addYears(
        periodStart,
        -1
      )
    }

    const nextPeriodStart =
      addYears(periodStart, 1)

    const periodEnd =
      subtractOneDay(
        nextPeriodStart
      )

    return {
      start: dateOnly(periodStart),
      end: dateOnly(periodEnd),
    }
  }

  throw new Error(
    `Unsupported billing cycle: ${subscription.billing_cycle}`
  )
}

export async function generateCurrentPeriodInvoices(): Promise<BulkInvoiceResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      periodLabel: '',
      results: [],
      error: 'Not authenticated',
    }
  }

  /*
   * Server-side role check.
   */
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (
    profileError ||
    !profile
  ) {
    return {
      success: false,
      periodLabel: '',
      results: [],
      error: 'User profile could not be loaded',
    }
  }

  if (
    profile.role !==
    'BILLING_ADMIN'
  ) {
    return {
      success: false,
      periodLabel: '',
      results: [],
      error:
        'Only billing admins can bulk-generate invoices',
    }
  }

  /*
   * Load every active subscription.
   *
   * RLS still applies to this query.
   */
  const {
    data: subscriptions,
    error: subscriptionsError,
  } = await supabase
    .from('subscriptions')
    .select(
      `
        id,
        customer_name,
        plan_name,
        billing_cycle,
        price,
        start_date,
        is_archived
      `
    )
    .eq('is_archived', false)
    .order('customer_name', {
      ascending: true,
    })

  if (subscriptionsError) {
    return {
      success: false,
      periodLabel: '',
      results: [],
      error:
        subscriptionsError.message,
    }
  }

  const today = new Date()

  const results: BulkInvoiceResult[] =
    []

  let periodLabel = ''

  for (const subscription of (
    subscriptions ?? []
  ) as Subscription[]) {
    try {
      const period =
        getCurrentBillingPeriod(
          subscription,
          today
        )

      /*
       * A future-start subscription is active in the database,
       * but does not yet have a current billing period.
       */
      if (!period) {
        results.push({
          subscriptionId:
            subscription.id,
          customerName:
            subscription.customer_name,
          planName:
            subscription.plan_name,
          billingCycle:
            subscription.billing_cycle,
          status: 'skipped',
          reason:
            'Subscription starts in the future',
        })

        continue
      }

      periodLabel =
        `${period.start} to ${period.end}`

      /*
       * Check whether this exact billing period already
       * has an invoice.
       */
      const {
        data: existingInvoice,
        error: existingInvoiceError,
      } = await supabase
        .from('invoices')
        .select('id')
        .eq(
          'subscription_id',
          subscription.id
        )
        .eq(
          'billing_period_start',
          period.start
        )
        .eq(
          'billing_period_end',
          period.end
        )
        .limit(1)
        .maybeSingle()

      if (existingInvoiceError) {
        results.push({
          subscriptionId:
            subscription.id,
          customerName:
            subscription.customer_name,
          planName:
            subscription.plan_name,
          billingCycle:
            subscription.billing_cycle,
          status: 'failed',
          reason:
            existingInvoiceError.message,
        })

        continue
      }

      if (existingInvoice) {
        results.push({
          subscriptionId:
            subscription.id,
          customerName:
            subscription.customer_name,
          planName:
            subscription.plan_name,
          billingCycle:
            subscription.billing_cycle,
          status: 'skipped',
          reason:
            'Invoice already exists for this billing period',
          invoiceId:
            existingInvoice.id,
        })

        continue
      }

      /*
       * Use the subscription price directly rather than
       * converting it through floating-point arithmetic.
       */
      const amount =
        String(subscription.price)

      /*
       * Create the invoice as DRAFT.
       *
       * Due date is the end of the billing period.
       */
      const {
        data: invoice,
        error: invoiceError,
      } = await supabase
        .from('invoices')
        .insert({
          subscription_id:
            subscription.id,
          billing_period_start:
            period.start,
          billing_period_end:
            period.end,
          amount,
          due_date:
            period.end,
          status: 'DRAFT',
        })
        .select('id, status')
        .single()

      if (
        invoiceError ||
        !invoice
      ) {
        results.push({
          subscriptionId:
            subscription.id,
          customerName:
            subscription.customer_name,
          planName:
            subscription.plan_name,
          billingCycle:
            subscription.billing_cycle,
          status: 'failed',
          reason:
            invoiceError?.message ||
            'Could not create invoice',
        })

        continue
      }

      /*
       * Record immutable creation history.
       */
      const {
        error: historyError,
      } = await supabase
        .from('invoice_history')
        .insert({
          invoice_id:
            invoice.id,
          event_type:
            'CREATED',
          actor_id:
            user.id,
          old_status:
            null,
          new_status:
            invoice.status,
          details: {
            message:
              'Invoice generated in bulk',
            billing_period_start:
              period.start,
            billing_period_end:
              period.end,
          },
        })

      if (historyError) {
        results.push({
          subscriptionId:
            subscription.id,
          customerName:
            subscription.customer_name,
          planName:
            subscription.plan_name,
          billingCycle:
            subscription.billing_cycle,
          status: 'failed',
          reason:
            `Invoice created but history failed: ${historyError.message}`,
          invoiceId:
            invoice.id,
        })

        continue
      }

      results.push({
        subscriptionId:
          subscription.id,
        customerName:
          subscription.customer_name,
        planName:
          subscription.plan_name,
        billingCycle:
          subscription.billing_cycle,
        status: 'generated',
        invoiceId:
          invoice.id,
      })
    } catch (error) {
      results.push({
        subscriptionId:
          subscription.id,
        customerName:
          subscription.customer_name,
        planName:
          subscription.plan_name,
        billingCycle:
          subscription.billing_cycle,
        status: 'failed',
        reason:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/invoices')

  return {
    success: true,
    periodLabel,
    results,
  }
}