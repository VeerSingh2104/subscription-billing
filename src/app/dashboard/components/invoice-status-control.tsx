import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type InvoiceStatusControlProps = {
  invoiceId: string
  currentStatus: string
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

    const allowedStatuses = [
      'DRAFT',
      'ISSUED',
      'PAID',
      'VOID',
    ]

    if (!allowedStatuses.includes(newStatus)) {
      throw new Error('Invalid invoice status')
    }

    const { data: invoice, error } = await supabase
  .from('invoices')
  .select('status')
  .eq('id', invoiceId)
  .single()

if (error) {
  throw new Error(error.message)
}

const oldStatus = invoice.status

if (oldStatus === newStatus) {
  return
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

  return (
    <form action={updateStatus} className="mt-4 flex gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border bg-transparent p-2"
      >
        <option value="DRAFT">Draft</option>
        <option value="ISSUED">Issued</option>
        <option value="PAID">Paid</option>
        <option value="VOID">Void</option>
      </select>

      <button
        type="submit"
        className="rounded-md border px-4 py-2 font-medium"
      >
        Update Status
      </button>
    </form>
  )
}