'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type UpdateDueDateResult = {
  success: boolean
  error: string
}

export async function updateInvoiceDueDate(
  invoiceId: string,
  dueDate: string
): Promise<UpdateDueDateResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'You must be signed in.',
    }
  }

  if (!invoiceId?.trim()) {
    return {
      success: false,
      error: 'Invoice ID is required.',
    }
  }

  if (!dueDate?.trim()) {
    return {
      success: false,
      error: 'Due date is required.',
    }
  }

  /*
   * Load the invoice together with its subscription.
   * We use this server-side to enforce both the invoice
   * lifecycle rule and subscription ownership rule.
   */
  const { data: invoice, error: invoiceError } =
    await supabase
      .from('invoices')
      .select(`
        id,
        status,
        billing_period_start,
        due_date,
        subscriptions (
          owner_id
        )
      `)
      .eq('id', invoiceId)
      .single()

  if (invoiceError || !invoice) {
    return {
      success: false,
      error: 'Invoice not found.',
    }
  }

  /*
   * Paid invoices are completely immutable.
   */
  if (invoice.status === 'PAID') {
    return {
      success: false,
      error: 'Paid invoices are immutable and their due date cannot be changed.',
    }
  }

  /*
   * A void invoice is no longer active and should not be edited.
   */
  if (invoice.status === 'VOID') {
    return {
      success: false,
      error: 'Void invoices cannot be edited.',
    }
  }

  /*
   * Only Billing Admins or the subscription owner can
   * change the due date.
   */
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

  if (profileError || !profile) {
    return {
      success: false,
      error: 'Unable to load your profile.',
    }
  }

  const subscription = Array.isArray(
    invoice.subscriptions
  )
    ? invoice.subscriptions[0]
    : invoice.subscriptions

  const isBillingAdmin =
    profile.role === 'BILLING_ADMIN'

  const isOwner =
    subscription?.owner_id === user.id

  if (!isBillingAdmin && !isOwner) {
    return {
      success: false,
      error:
        'You do not have permission to change this invoice.',
    }
  }

  /*
   * Validate the date.
   *
   * Use UTC so that the date does not shift depending
   * on the server/browser timezone.
   */
  const parsedDueDate = new Date(
    `${dueDate}T00:00:00.000Z`
  )

  if (Number.isNaN(parsedDueDate.getTime())) {
    return {
      success: false,
      error: 'Due date must be a valid date.',
    }
  }

  /*
   * Keep the same validation used when invoices are created:
   * due date cannot be before the billing period starts.
   */
  if (dueDate < invoice.billing_period_start) {
    return {
      success: false,
      error:
        'Due date cannot be before the billing period starts.',
    }
  }

  /*
   * No database write is necessary when the date is unchanged.
   */
  if (dueDate === invoice.due_date) {
    return {
      success: true,
      error: '',
    }
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    }
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  revalidatePath('/alerts')

  return {
    success: true,
    error: '',
  }
}