import { createClient } from '@/lib/supabase/server'

function csvCell(
  value: string | number | null | undefined
): string {
  const text =
    value === null ||
    value === undefined
      ? ''
      : String(value)

  /*
   * Prevent spreadsheet formula injection.
   */
  const safeText =
    /^[=+\-@]/.test(text)
      ? `'${text}`
      : text

  return `"${safeText.replace(
    /"/g,
    '""'
  )}"`
}

export async function GET() {
  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    return new Response(
      'Not authenticated',
      {
        status: 401,
      }
    )
  }

  /*
   * Load subscriptions visible to the
   * current user. RLS determines visibility.
   */
  const {
    data: subscriptions,
    error: subscriptionsError,
  } =
    await supabase
      .from('subscriptions')
      .select(
        `
          id,
          customer_name,
          billing_email,
          plan_name,
          billing_cycle
        `
      )

  if (subscriptionsError) {
    return new Response(
      subscriptionsError.message,
      {
        status: 500,
      }
    )
  }

  const subscriptionIds =
    (subscriptions ?? []).map(
      (subscription) =>
        subscription.id
    )

  const subscriptionMap =
    new Map(
      (subscriptions ?? []).map(
        (subscription) => [
          subscription.id,
          subscription,
        ]
      )
    )

  let invoices: {
    id: string
    subscription_id: string
    amount: string | number
    due_date: string
    status: string
  }[] = []

  if (
    subscriptionIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('invoices')
      .select(
        `
          id,
          subscription_id,
          amount,
          due_date,
          status
        `
      )
      .in(
        'subscription_id',
        subscriptionIds
      )

    if (error) {
      return new Response(
        error.message,
        {
          status: 500,
        }
      )
    }

    invoices = data ?? []
  }

  const today =
    new Date()
      .toISOString()
      .slice(0, 10)

  /*
   * Receivables include:
   * - every ISSUED invoice
   * - anything overdue that is not PAID or VOID
   */
  const receivables =
    invoices
      .filter((invoice) => {
        const overdue =
          invoice.due_date <
            today &&
          invoice.status !==
            'PAID' &&
          invoice.status !==
            'VOID'

        return (
          invoice.status ===
            'ISSUED' ||
          overdue
        )
      })
      .sort((a, b) =>
        a.due_date.localeCompare(
          b.due_date
        )
      )

  const header = [
    'Invoice ID',
    'Customer',
    'Billing Email',
    'Plan',
    'Billing Cycle',
    'Amount',
    'Due Date',
    'Status',
  ]

  const rows = receivables.map(
    (invoice) => {
      const subscription =
        subscriptionMap.get(
          invoice.subscription_id
        )

      return [
        invoice.id,
        subscription?.customer_name,
        subscription?.billing_email,
        subscription?.plan_name,
        subscription?.billing_cycle,
        invoice.amount,
        invoice.due_date,
        invoice.status,
      ]
        .map(csvCell)
        .join(',')
    }
  )

  const csv = [
    header.map(csvCell).join(','),
    ...rows,
  ].join('\r\n')

  const filename =
    `receivables-${today}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type':
        'text/csv; charset=utf-8',
      'Content-Disposition':
        `attachment; filename="${filename}"`,
      'Cache-Control':
        'no-store',
    },
  })
}