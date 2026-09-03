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

  const inputClassName =
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form
      action={formAction}
      className="mt-8 space-y-6"
    >
      {state.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-400">
          Invoice created successfully.
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Subscription
        </label>

        <select
          name="subscription_id"
          required
          disabled={isPending}
          defaultValue=""
          className={inputClassName}
        >
          <option
            value=""
            disabled
            className="bg-background text-muted-foreground"
          >
            Select subscription
          </option>

          {subscriptions.map(
            (subscription) => (
              <option
                key={subscription.id}
                value={subscription.id}
                className="bg-background text-foreground"
              >
                {subscription.customer_name} —{' '}
                {subscription.plan_name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Billing period start
        </label>

        <input
          name="billing_period_start"
          type="date"
          required
          disabled={isPending}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Billing period end
        </label>

        <input
          name="billing_period_end"
          type="date"
          required
          disabled={isPending}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Amount
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            INR
          </span>

          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            disabled={isPending}
            placeholder="0.00"
            className={`${inputClassName} pl-14`}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Due date
        </label>

        <input
          name="due_date"
          type="date"
          required
          disabled={isPending}
          className={inputClassName}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? 'Creating Invoice...'
            : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}