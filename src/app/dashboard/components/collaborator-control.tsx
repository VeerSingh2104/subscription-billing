import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Collaborator = {
  user_id: string
}

type CollaboratorControlProps = {
  subscriptionId: string
  collaborators: Collaborator[]
}

export default function CollaboratorControl({
  subscriptionId,
  collaborators,
}: CollaboratorControlProps) {
  async function addCollaborator(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const managerId = formData.get('managerId') as string

    if (!managerId) {
      throw new Error('Please enter an account manager user ID')
    }

    const { error } = await supabase
      .from('subscription_collaborators')
      .insert({
        subscription_id: subscriptionId,
        user_id: managerId,
      })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
  }

  async function removeCollaborator(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const managerId = formData.get('managerId') as string

    if (!managerId) {
      throw new Error('Manager ID is required')
    }

    const { error } = await supabase
      .from('subscription_collaborators')
      .delete()
      .eq('subscription_id', subscriptionId)
      .eq('user_id', managerId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
  }

  return (
    <div className="mt-4">
      {collaborators.length > 0 ? (
        <div className="mb-4 space-y-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.user_id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User ID
                </p>

                <p className="font-medium break-all">
                  {collaborator.user_id}
                </p>
              </div>

              <form action={removeCollaborator}>
                <input
                  type="hidden"
                  name="managerId"
                  value={collaborator.user_id}
                />

                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-dashed p-4">
          <p className="font-medium">No manager assigned</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Assign an account manager using the field below.
          </p>
        </div>
      )}

      <form action={addCollaborator}>
        <input
          name="managerId"
          placeholder="Account Manager user ID"
          required
          className="w-full rounded-md border bg-transparent p-3"
        />

        <button
          type="submit"
          className="mt-2 rounded-md border px-4 py-2 font-medium"
        >
          Add Manager
        </button>
      </form>
    </div>
  )
}