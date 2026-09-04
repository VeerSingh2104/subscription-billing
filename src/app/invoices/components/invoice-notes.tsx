import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type InvoiceNotesProps = {
  invoiceId: string
}

export default async function InvoiceNotes({
  invoiceId,
}: InvoiceNotesProps) {
  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from('invoice_notes')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })

  async function addNote(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const note = formData.get('note') as string

    if (!note.trim()) {
      throw new Error('Note cannot be empty')
    }

    const { error } = await supabase
      .from('invoice_notes')
      .insert({
        invoice_id: invoiceId,
        author_id: user.id,
        note: note.trim(),
      })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/invoices')
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />

        <h3 className="text-base font-bold text-foreground">
          Notes
        </h3>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-300">
            Unable to load notes: {error.message}
          </p>
        </div>
      )}

      {!error && notes?.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-7 text-center">
          <p className="text-sm font-semibold text-foreground">
            No notes yet.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Add an internal note to keep useful context with this invoice.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {notes?.map((note, index) => (
          <div
            key={note.id}
            className="glass motion-card relative overflow-hidden rounded-2xl px-4 py-4 animate-fade-up"
            style={{
              animationDelay: `${Math.min(300, index * 60)}ms`,
            }}
          >
            <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500/40" />

            <div className="pl-2">
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {note.note}
              </p>

              <p className="mt-2 text-[11px] text-muted-foreground/70">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form action={addNote} className="mt-4">
        <textarea
          name="note"
          required
          placeholder="Enter a note..."
          rows={3}
          className="w-full resize-y rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
        />

        <button
          type="submit"
          className="glass-primary motion-button mt-3 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          Add Note
        </button>
      </form>
    </section>
  )
}