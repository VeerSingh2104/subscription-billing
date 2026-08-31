import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import InvoiceCreateForm from './invoice-create-form'

export default async function InvoiceControls() {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(
      'id, customer_name, plan_name, billing_cycle, price'
    )
    .eq('is_archived', false)
    .order('customer_name')

  async function createInvoice(
  _previousState: {
    success: boolean
    error: string
  },
  formData: FormData
) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const subscriptionId = (
      formData.get('subscription_id') as string
    )?.trim()

    const billingPeriodStart = (
      formData.get('billing_period_start') as string
    )?.trim()

    const billingPeriodEnd = (
      formData.get('billing_period_end') as string
    )?.trim()

    const amountValue = (
      formData.get('amount') as string
    )?.trim()

    const dueDate = (
      formData.get('due_date') as string
    )?.trim()

    /*
     * Basic validation
     */

    if (!subscriptionId) {
      return {
        success: false,
        error: 'Please select a subscription',
      }
    }

    if (!billingPeriodStart) {
      return {
        success: false,
        error: 'Billing period start is required',
      }
    }

    if (!billingPeriodEnd) {
      return {
        success: false,
        error: 'Billing period end is required',
      }
    }

    if (!dueDate) {
      return {
        success: false,
        error: 'Due date is required',
      }
    }

    if (!amountValue) {
      return {
        success: false,
        error: 'Amount is required',
      }
    }

    const amount = Number(amountValue)

    if (!Number.isFinite(amount)) {
      return {
        success: false,
        error: 'Amount must be a valid number',
      }
    }

    if (amount <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than zero',
      }
    }

    /*
     * Date validation
     */

    const startDate = new Date(
      `${billingPeriodStart}T00:00:00`
    )

    const endDate = new Date(
      `${billingPeriodEnd}T00:00:00`
    )

    const invoiceDueDate = new Date(
      `${dueDate}T00:00:00`
    )

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      Number.isNaN(invoiceDueDate.getTime())
    ) {
      return {
        success: false,
        error: 'One or more dates are invalid',
      }
    }

    if (endDate < startDate) {
      return {
        success: false,
        error:
          'Billing period end cannot be before billing period start',
      }
    }

    if (invoiceDueDate < startDate) {
      return {
        success: false,
        error:
          'Due date cannot be before the billing period starts',
      }
    }

    /*
     * Verify subscription
     */

    const {
      data: subscription,
      error: subscriptionError,
    } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .eq('is_archived', false)
      .single()

    if (subscriptionError || !subscription) {
      return {
        success: false,
        error:
          subscriptionError?.message ||
          'Selected subscription was not found',
      }
    }

    /*
     * Create invoice
     */

    const {
      data: invoice,
      error: invoiceError,
    } = await supabase
      .from('invoices')
      .insert({
        subscription_id: subscriptionId,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        amount,
        due_date: dueDate,
        status: 'DRAFT',
      })
      .select('id, status')
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error:
          invoiceError?.message ||
          'Could not create invoice',
      }
    }

    /*
     * Create invoice history
     */

    const { error: historyError } = await supabase
      .from('invoice_history')
      .insert({
        invoice_id: invoice.id,
        event_type: 'CREATED',
        actor_id: user.id,
        old_status: null,
        new_status: invoice.status,
        details: {
          message: 'Invoice created',
        },
      })

    if (historyError) {
      return {
        success: false,
        error: historyError.message,
      }
    }

    /*
     * Refresh pages
     */

    revalidatePath('/invoices')
    revalidatePath('/dashboard')

    return {
      success: true,
      error: '',
    }
  }

  return (
    <section className="mt-8 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">
        Create Invoice
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Create an invoice for an existing subscription.
      </p>

      {error && (
        <p className="mt-4 text-red-600">
          Could not load subscriptions:{' '}
          {error.message}
        </p>
      )}

      {!error &&
        (!subscriptions ||
          subscriptions.length === 0) && (
          <p className="mt-4 text-sm text-gray-500">
            No active subscriptions available.
          </p>
        )}

      {subscriptions &&
        subscriptions.length > 0 && (
          <InvoiceCreateForm
            subscriptions={subscriptions}
            createInvoice={createInvoice}
          />
        )}
    </section>
  )
}