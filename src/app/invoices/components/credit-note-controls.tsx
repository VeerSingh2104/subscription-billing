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
      throw new Error(
        'Credit note amount must be greater than zero'
      )
    }

    if (amount > invoiceAmount) {
      throw new Error(
        'Credit note amount cannot exceed invoice amount'
      )
    }

    if (!reason) {
      throw new Error('Reason is required')
    }

    // Get all existing credit notes for this invoice.
    const { data: existingCreditNotes, error: creditNotesError } =
      await supabase
        .from('credit_notes')
        .select('amount')
        .eq('invoice_id', invoiceId)

    if (creditNotesError) {
      throw new Error(creditNotesError.message)
    }

    // Calculate the total amount already credited.
    const totalCredited =
      existingCreditNotes?.reduce(
        (total, creditNote) =>
          total + Number(creditNote.amount),
        0
      ) ?? 0

    // Make sure the new credit note does not push
    // the total above the invoice amount.
    if (totalCredited + amount > invoiceAmount) {
      const remainingCredit =
        invoiceAmount - totalCredited

      throw new Error(
        `Credit note exceeds the remaining creditable amount of ₹${remainingCredit.toFixed(2)}`
      )
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
    revalidatePath(`/invoices/${invoiceId}`)
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold">
        Issue Credit Note
      </h3>

      <form
        action={issueCreditNote}
        className="mt-4 space-y-3"
      >
        <input
          name="amount"
          type="number"
          min="0.01"
          max={invoiceAmount}
          step="0.01"
          placeholder="Credit amount"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <textarea
          name="reason"
          placeholder="Reason for credit note"
          rows={3}
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <button
          type="submit"
          className="rounded-md border px-4 py-2 font-medium"
        >
          Issue Credit Note
        </button>
      </form>
    </div>
  )
}