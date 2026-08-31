import { createClient } from '@/lib/supabase/server'
import { generateInvoicePdf } from '@/lib/invoice-pdf'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  const { id } = await params

  const { data: invoice, error: invoiceError } =
    await supabase
      .from('invoices')
      .select(`
        id,
        billing_period_start,
        billing_period_end,
        amount,
        due_date,
        status,
        created_at,
        subscriptions (
          customer_name,
          plan_name,
          billing_cycle
        )
      `)
      .eq('id', id)
      .single()

  if (invoiceError || !invoice) {
    return new Response('Invoice not found', {
      status: 404,
    })
  }

  const { data: creditNotes, error: creditNotesError } =
    await supabase
      .from('credit_notes')
      .select(`
        amount,
        reason,
        created_at
      `)
      .eq('invoice_id', id)
      .order('created_at', {
        ascending: true,
      })

  if (creditNotesError) {
    return new Response(
      `Could not load credit notes: ${creditNotesError.message}`,
      {
        status: 500,
      }
    )
  }

  const subscription = Array.isArray(
    invoice.subscriptions
  )
    ? invoice.subscriptions[0]
    : invoice.subscriptions

  if (!subscription) {
    return new Response(
      'Invoice subscription not found',
      {
        status: 404,
      }
    )
  }

  const pdf = await generateInvoicePdf({
    id: invoice.id,
    customerName: subscription.customer_name,
    planName: subscription.plan_name,
    billingCycle: subscription.billing_cycle,
    billingPeriodStart:
      invoice.billing_period_start,
    billingPeriodEnd:
      invoice.billing_period_end,
    amount: Number(invoice.amount),
    dueDate: invoice.due_date,
    status: invoice.status,
    createdAt: invoice.created_at,
    creditNotes:
      creditNotes?.map((creditNote) => ({
        amount: Number(creditNote.amount),
        reason: creditNote.reason,
        createdAt: creditNote.created_at,
      })) ?? [],
  })

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}