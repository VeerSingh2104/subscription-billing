import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function InvoiceControls() {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('id, customer_name, plan_name, billing_cycle, price')
    .eq('is_archived', false)
    .order('customer_name')

  async function createInvoice(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const subscriptionId = formData.get('subscription_id') as string
    const billingPeriodStart = formData.get(
      'billing_period_start'
    ) as string
    const billingPeriodEnd = formData.get(
      'billing_period_end'
    ) as string
    const amount = formData.get('amount') as string
    const dueDate = formData.get('due_date') as string

    const { data: invoice, error } = await supabase
  .from('invoices')
  .insert({
    subscription_id: subscriptionId,
    billing_period_start: billingPeriodStart,
    billing_period_end: billingPeriodEnd,
    amount: Number(amount),
    due_date: dueDate,
    status: 'DRAFT',
  })
  .select('id, status')
  .single()

if (error) {
  throw new Error(error.message)
}

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
  throw new Error(historyError.message)
}

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
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
          Could not load subscriptions: {error.message}
        </p>
      )}

      <form action={createInvoice} className="mt-6 space-y-4">
        <select
          name="subscription_id"
          required
          className="w-full rounded-md border bg-transparent p-3"
        >
          <option value="">Select subscription</option>

          {subscriptions?.map((subscription) => (
            <option
              key={subscription.id}
              value={subscription.id}
            >
              {subscription.customer_name} —{' '}
              {subscription.plan_name}
            </option>
          ))}
        </select>

        <div>
          <label className="mb-1 block text-sm">
            Billing period start
          </label>

          <input
            name="billing_period_start"
            type="date"
            required
            className="w-full rounded-md border bg-transparent p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">
            Billing period end
          </label>

          <input
            name="billing_period_end"
            type="date"
            required
            className="w-full rounded-md border bg-transparent p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">
            Amount
          </label>

          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            className="w-full rounded-md border bg-transparent p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">
            Due date
          </label>

          <input
            name="due_date"
            type="date"
            required
            className="w-full rounded-md border bg-transparent p-3"
          />
        </div>

        <button
          type="submit"
          className="rounded-md border px-5 py-2 font-medium"
        >
          Create Invoice
        </button>
      </form>
    </section>
  )
}