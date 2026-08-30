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
    <section className="mt-8 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">
        Admin Controls
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Create a new subscription.
      </p>

      <form action={createSubscription} className="mt-6 space-y-4">
        <input
          name="customer_name"
          placeholder="Customer name"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <input
          name="billing_email"
          type="email"
          placeholder="Billing email"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <input
          name="plan_name"
          placeholder="Plan name"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <select
          name="billing_cycle"
          required
          defaultValue="MONTHLY"
          className="w-full rounded-md border bg-transparent p-3"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="ANNUAL">Annual</option>
        </select>

        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <input
          name="start_date"
          type="date"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <button
          type="submit"
          className="rounded-md border px-5 py-2 font-medium"
        >
          Create Subscription
        </button>
      </form>
    </section>
  )
}