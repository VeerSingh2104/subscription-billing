import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type CreditNoteControlsProps = {
  invoiceId: string
  invoiceAmount: number
}

export default function CreditNoteControls({
  invoiceId,
  invoiceAmount,
}: CreditNoteControlsProps) {
  async function issueCreditNote(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const amount = Number(formData.get('amount'))
    const reason = (formData.get('reason') as string).trim()

    if (!amount || amount <= 0) {
      throw new Error('Credit note amount must be greater than zero')
    }

    if (amount > invoiceAmount) {
      throw new Error(
        'Credit note amount cannot exceed invoice amount'
      )
    }

    if (!reason) {
      throw new Error('Reason is required')
    }

    const { data: creditNote, error } = await supabase
      .from('credit_notes')
      .insert({
        invoice_id: invoiceId,
        amount,
        reason,
        issued_by: user.id,
      })
      .select('id, amount, reason')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const { error: historyError } = await supabase
      .from('invoice_history')
      .insert({
        invoice_id: invoiceId,
        event_type: 'CREDIT_NOTE_ISSUED',
        actor_id: user.id,
        old_status: null,
        new_status: null,
        details: {
          credit_note_id: creditNote.id,
          amount: creditNote.amount,
          reason: creditNote.reason,
        },
      })

    if (historyError) {
      throw new Error(historyError.message)
    }

    revalidatePath('/invoices')
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 dark:bg-amber-500/[0.06]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <span className="text-sm font-bold">↺</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">
              Issue Credit Note
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Record a billing correction against this invoice.
            </p>
          </div>
        </div>

        <form
          action={issueCreditNote}
          className="mt-4 space-y-3"
        >
          <div>
            <label
              htmlFor={`credit-amount-${invoiceId}`}
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Credit amount
            </label>

            <input
              id={`credit-amount-${invoiceId}`}
              name="amount"
              type="number"
              min="0.01"
              max={invoiceAmount}
              step="0.01"
              placeholder="Enter credit amount"
              required
              className="h-11 w-full rounded-xl border border-border bg-background/40 px-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
            />
          </div>

          <div>
            <label
              htmlFor={`credit-reason-${invoiceId}`}
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Reason
            </label>

            <textarea
              id={`credit-reason-${invoiceId}`}
              name="reason"
              placeholder="Explain the reason for this credit note"
              rows={3}
              required
              className="w-full resize-y rounded-xl border border-border bg-background/40 px-3.5 py-3 text-sm leading-5 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              Maximum credit: {invoiceAmount}
            </p>

            <button
              type="submit"
              className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20"
            >
              Issue Credit Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}