'use client'

import { useActionState } from 'react'

type Subscription = {
  id: string
  customer_name: string
  plan_name: string
  billing_cycle: string
  price: number
}

type InvoiceActionState = {
  success: boolean
  error: string
}

type InvoiceCreateFormProps = {
  subscriptions: Subscription[]
  createInvoice: (
    previousState: InvoiceActionState,
    formData: FormData
  ) => Promise<InvoiceActionState>
}

const initialState: InvoiceActionState = {
  success: false,
  error: '',
}

export default function InvoiceCreateForm({
  subscriptions,
  createInvoice,
}: InvoiceCreateFormProps) {
  const [state, formAction, isPending] =
    useActionState(
      createInvoice,
      initialState
    )

  return (
    <form
      action={formAction}
      className="mt-6 space-y-4"
    >
      {state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-400">
          Invoice created successfully.
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          Subscription
        </label>

        <select
          name="subscription_id"
          required
          disabled={isPending}
          className="w-full rounded-md border bg-transparent p-3"
        >
          <option value="">
            Select subscription
          </option>

          {subscriptions.map(
            (subscription) => (
              <option
                key={subscription.id}
                value={subscription.id}
              >
                {subscription.customer_name} —{' '}
                {subscription.plan_name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Billing period start
        </label>

        <input
          name="billing_period_start"
          type="date"
          required
          disabled={isPending}
          className="w-full rounded-md border bg-transparent p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Billing period end
        </label>

        <input
          name="billing_period_end"
          type="date"
          required
          disabled={isPending}
          className="w-full rounded-md border bg-transparent p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Amount
        </label>

        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          disabled={isPending}
          placeholder="Enter invoice amount"
          className="w-full rounded-md border bg-transparent p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Due date
        </label>

        <input
          name="due_date"
          type="date"
          required
          disabled={isPending}
          className="w-full rounded-md border bg-transparent p-3"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border px-5 py-2 font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
      >
        {isPending
          ? 'Creating Invoice...'
          : 'Create Invoice'}
      </button>
    </form>
  )
}