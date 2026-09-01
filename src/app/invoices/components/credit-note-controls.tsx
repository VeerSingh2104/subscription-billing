'use client'

import { useState } from 'react'
import { issueCreditNote } from '@/app/invoices/actions/credit-note-actions'

type CreditNoteControlsProps = {
  invoiceId: string
  invoiceAmount: number
}

export default function CreditNoteControls({
  invoiceId,
  invoiceAmount,
}: CreditNoteControlsProps) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    const result = await issueCreditNote(
      invoiceId,
      formData
    )

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to issue credit note.')
      return
    }

    setSuccess('Credit note issued successfully.')

    event.currentTarget.reset()
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold">
        Issue Credit Note
      </h3>

      {error && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
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
          disabled={loading}
          className="rounded-md border px-4 py-2 font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
        >
          {loading
            ? 'Issuing...'
            : 'Issue Credit Note'}
        </button>
      </form>
    </div>
  )
}