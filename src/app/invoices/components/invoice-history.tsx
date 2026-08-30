import { createClient } from '@/lib/supabase/server'

type InvoiceHistoryProps = {
  invoiceId: string
}

export default async function InvoiceHistory({
  invoiceId,
}: InvoiceHistoryProps) {
  const supabase = await createClient()

  const { data: history, error } = await supabase
    .from('invoice_history')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <p className="mt-4 text-sm text-red-600">
        Could not load history: {error.message}
      </p>
    )
  }

  if (!history || history.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        No history found.
      </p>
    )
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-semibold">
        Invoice History
      </h3>

      <div className="mt-3 space-y-3">
        {history.map((event) => (
          <div
            key={event.id}
            className="rounded-md bg-gray-50 p-3 text-sm"
          >
            <p className="font-medium">
              {event.event_type}
            </p>

            {event.event_type === 'STATUS_CHANGED' && (
              <p className="mt-1 text-gray-600">
                {event.old_status} → {event.new_status}
              </p>
            )}

            {event.details?.message && (
              <p className="mt-1 text-gray-500">
                {event.details.message}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              {new Date(event.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}