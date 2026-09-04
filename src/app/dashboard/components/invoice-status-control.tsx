import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type InvoiceStatusControlProps = {
  invoiceId: string
  currentStatus: string
}

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'VOID'],
  ISSUED: ['PAID', 'VOID'],
  PAID: [],
  VOID: [],
}

export default function InvoiceStatusControl({
  invoiceId,
  currentStatus,
}: InvoiceStatusControlProps) {
  async function updateStatus(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const newStatus = formData.get('status') as string

    const validStatuses = ['DRAFT', 'ISSUED', 'PAID', 'VOID']

    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid invoice status')
    }

    // Fetch the current status directly from the database.
    // This prevents someone from bypassing the UI and submitting
    // an invalid transition manually.
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      throw new Error(
        error?.message || 'Invoice not found'
      )
    }

    const oldStatus = invoice.status

    if (oldStatus === newStatus) {
      return
    }

    const allowedNextStatuses =
      allowedTransitions[oldStatus] ?? []

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${oldStatus} → ${newStatus}`
      )
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: newStatus,
      })
      .eq('id', invoiceId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { error: historyError } = await supabase
      .from('invoice_history')
      .insert({
        invoice_id: invoiceId,
        event_type: 'STATUS_CHANGED',
        actor_id: user.id,
        old_status: oldStatus,
        new_status: newStatus,
        details: {
          message: `Invoice status changed from ${oldStatus} to ${newStatus}`,
        },
      })

    if (historyError) {
      throw new Error(historyError.message)
    }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
  }

  const availableStatuses =
    allowedTransitions[currentStatus] ?? []

  // PAID and VOID are final states.
  if (availableStatuses.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50">
        <p className="font-medium">
          Invoice is {currentStatus}
        </p>

        <p className="mt-1 text-gray-500 dark:text-gray-400">
          No further status changes are allowed.
        </p>
      </div>
    )
  }

  return (
    <form
      action={updateStatus}
      className="mt-4 flex flex-col gap-2 sm:flex-row"
    >
      <select
  name="status"
  defaultValue=""
  required
  className="rounded-xl border border-border bg-background/40 p-2.5 text-sm text-foreground outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 [color-scheme:light] dark:[color-scheme:dark]"
>
  <option value="" disabled>
    Change status
  </option>

  {availableStatuses.map((status) => (
    <option
      key={status}
      value={status}
      className="bg-background text-foreground"
    >
      {status === 'ISSUED' && 'Issue Invoice'}
      {status === 'PAID' && 'Mark as Paid'}
      {status === 'VOID' && 'Void Invoice'}
    </option>
  ))}
</select>

      <button
  type="submit"
  className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
>
  Update Status
</button>
    </form>
  )
}