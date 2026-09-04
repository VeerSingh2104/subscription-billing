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
      <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        Unable to load invoice history: {error.message}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          No invoice history yet.
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Changes and activity for this invoice will appear here.
        </p>
      </div>
    )
  }

  return (
    <section className="mt-5 border-t border-border pt-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

        <h3 className="text-base font-bold text-foreground">
          Invoice History
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {history.map((event, index) => (
          <div
            key={event.id}
            className="glass motion-card relative overflow-hidden rounded-2xl px-4 py-4 animate-fade-up"
            style={{
              animationDelay: `${Math.min(400, index * 60)}ms`,
            }}
          >
            <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500/50" />

            <div className="pl-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {event.event_type === 'STATUS_CHANGED'
                    ? `${event.old_status} → ${event.new_status}`
                    : event.event_type}
                </p>
              </div>

              {event.event_type === 'STATUS_CHANGED' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Invoice status changed from{' '}
                  <span className="font-medium text-foreground">
                    {event.old_status}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-foreground">
                    {event.new_status}
                  </span>
                </p>
              )}

              {/* {event.details?.message && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {event.details.message}
                </p>
              )} */}

              <p className="mt-2 text-[11px] text-muted-foreground/70">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}