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
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold">
        Notes
      </h3>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          Could not load notes: {error.message}
        </p>
      )}

      {!error && notes?.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          No notes yet.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {notes?.map((note) => (
          <div
            key={note.id}
            className="rounded-md bg-gray-50 p-3"
          >
            <p>{note.note}</p>

            <p className="mt-1 text-xs text-gray-400">
              {new Date(note.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <form action={addNote} className="mt-4">
        <textarea
          name="note"
          required
          placeholder="Add a note..."
          rows={3}
          className="w-full rounded-md border bg-transparent p-3"
        />

        <button
          type="submit"
          className="mt-2 rounded-md border px-4 py-2 font-medium"
        >
          Add Note
        </button>
      </form>
    </div>
  )
}