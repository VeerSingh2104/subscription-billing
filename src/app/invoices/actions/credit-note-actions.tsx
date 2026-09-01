'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function issueCreditNote(
  invoiceId: string,
  formData: FormData
) {
  'use server'

  try {
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

    const { data: invoice, error: invoiceError } =
      await supabase
        .from('invoices')
        .select('amount, status')
        .eq('id', invoiceId)
        .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error:
          invoiceError?.message ||
          'Invoice not found',
      }
    }

    // Only ISSUED and PAID invoices can receive credit notes.
    if (
      invoice.status !== 'ISSUED' &&
      invoice.status !== 'PAID'
    ) {
      return {
        success: false,
        error: `Credit notes cannot be issued for an invoice with status ${invoice.status}`,
      }
    }

    const amount = Number(formData.get('amount'))

    const reason = (
      formData.get('reason') as string
    )?.trim()

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error:
          'Credit note amount must be greater than zero',
      }
    }

    if (!reason) {
      return {
        success: false,
        error: 'Reason is required',
      }
    }

    const invoiceAmount = Number(invoice.amount)

    if (
      !Number.isFinite(invoiceAmount) ||
      invoiceAmount <= 0
    ) {
      return {
        success: false,
        error: 'Invalid invoice amount',
      }
    }

    const {
      data: existingCreditNotes,
      error: creditNotesError,
    } = await supabase
      .from('credit_notes')
      .select('amount')
      .eq('invoice_id', invoiceId)

    if (creditNotesError) {
      return {
        success: false,
        error: creditNotesError.message,
      }
    }

    const totalCredited =
      existingCreditNotes?.reduce(
        (total, creditNote) =>
          total + Number(creditNote.amount),
        0
      ) ?? 0

    const remainingCredit =
      invoiceAmount - totalCredited

    if (remainingCredit <= 0) {
      return {
        success: false,
        error:
          'This invoice has already been fully credited',
      }
    }

    if (amount > remainingCredit) {
      return {
        success: false,
        error: `Credit note amount cannot exceed the remaining credit of INR${remainingCredit.toFixed(2)}`,
      }
    }

    const {
      data: creditNote,
      error,
    } = await supabase
      .from('credit_notes')
      .insert({
        invoice_id: invoiceId,
        amount,
        reason,
        issued_by: user.id,
      })
      .select('id, amount, reason')
      .single()

    if (error || !creditNote) {
      return {
        success: false,
        error:
          error?.message ||
          'Could not create credit note',
      }
    }

    const { error: historyError } =
      await supabase
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
      return {
        success: false,
        error: historyError.message,
      }
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Issue credit note error:', error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Something went wrong',
    }
  }
}