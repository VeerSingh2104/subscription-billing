'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceDueDate } from '../actions/update-invoice-due-date'

type Props = {
  invoiceId: string
  currentDueDate: string
}

export default function InvoiceDueDateEditor({
  invoiceId,
  currentDueDate,
}: Props) {
  const router = useRouter()

  const [dueDate, setDueDate] =
    useState(currentDueDate)

  const [error, setError] = useState('')

  const [success, setSuccess] =
    useState(false)

  const [isPending, startTransition] =
    useTransition()

  function handleSave() {
    setError('')
    setSuccess(false)

    startTransition(async () => {
      const result =
        await updateInvoiceDueDate(
          invoiceId,
          dueDate
        )

      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess(true)

      router.refresh()
    })
  }

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <label
            htmlFor={`due-date-${invoiceId}`}
            className="block text-xs font-medium text-gray-500"
          >
            Change due date
          </label>

          <input
            id={`due-date-${invoiceId}`}
            type="date"
            value={dueDate}
            onChange={(event) => {
              setDueDate(event.target.value)
              setSuccess(false)
              setError('')
            }}
            disabled={isPending}
            className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isPending ||
            !dueDate ||
            dueDate === currentDueDate
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? 'Saving...'
            : 'Save due date'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-2 text-sm text-emerald-600">
          Due date updated successfully.
        </p>
      )}
    </div>
  )
}