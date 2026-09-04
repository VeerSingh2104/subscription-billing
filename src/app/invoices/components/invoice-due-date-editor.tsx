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
    <div className="mt-4 rounded-2xl border border-border bg-background/20 p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 sm:max-w-xs">
          <label
            htmlFor={`due-date-${invoiceId}`}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
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
            className="h-11 w-full rounded-xl border border-border bg-background/50 px-3.5 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="glass-primary motion-button inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          {isPending
            ? 'Saving...'
            : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
          <p className="text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Due date updated successfully.
          </p>
        </div>
      )}
    </div>
  )
}