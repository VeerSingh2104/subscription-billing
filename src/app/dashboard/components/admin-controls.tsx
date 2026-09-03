import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default function AdminControls() {
  async function createSubscription(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const customerName = formData.get('customer_name') as string
    const billingEmail = formData.get('billing_email') as string
    const planName = formData.get('plan_name') as string
    const billingCycle = formData.get('billing_cycle') as string
    const price = formData.get('price') as string
    const startDate = formData.get('start_date') as string

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        customer_name: customerName,
        billing_email: billingEmail,
        plan_name: planName,
        billing_cycle: billingCycle,
        price: Number(price),
        start_date: startDate,
        owner_id: user.id,
        is_archived: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/subscriptions')
  }

  return (
    <form action={createSubscription} className="space-y-5">
      {/* Customer name */}
      <div>
        <label
          htmlFor="customer_name"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Customer name
        </label>

        <input
          id="customer_name"
          name="customer_name"
          type="text"
          placeholder="Enter customer name"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Billing email */}
      <div>
        <label
          htmlFor="billing_email"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Billing email
        </label>

        <input
          id="billing_email"
          name="billing_email"
          type="email"
          placeholder="customer@example.com"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Plan name */}
      <div>
        <label
          htmlFor="plan_name"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Plan name
        </label>

        <input
          id="plan_name"
          name="plan_name"
          type="text"
          placeholder="e.g. Professional"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Billing cycle */}
      <div>
        <label
          htmlFor="billing_cycle"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Billing cycle
        </label>

        <select
          id="billing_cycle"
          name="billing_cycle"
          required
          defaultValue="MONTHLY"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="ANNUAL">Annual</option>
        </select>
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Price
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            INR
          </span>

          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            className="w-full rounded-xl border border-border bg-background py-3 pl-14 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Start date */}
      <div>
        <label
          htmlFor="start_date"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Start date
        </label>

        <input
          id="start_date"
          name="start_date"
          type="date"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.99]"
        >
          Create Subscription
        </button>
      </div>
    </form>
  )
}