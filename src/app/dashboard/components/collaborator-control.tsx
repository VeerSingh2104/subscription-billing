import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Collaborator = {
  user_id: string
  full_name: string | null
}

type AccountManager = {
  id: string
  full_name: string | null
}

type CollaboratorControlProps = {
  subscriptionId: string
  collaborators: Collaborator[]
  availableManagers: AccountManager[]
  managersLoadError?: string | null
}

export default function CollaboratorControl({
  subscriptionId,
  collaborators,
  availableManagers,
  managersLoadError,
}: CollaboratorControlProps) {
  const assignedManagerIds = new Set(
    collaborators.map((collaborator) => collaborator.user_id)
  )
  const assignableManagers = availableManagers.filter(
    (manager) => !assignedManagerIds.has(manager.id)
  )

  const managerName = (manager: { full_name: string | null }) =>
    manager.full_name?.trim() || 'Unnamed account manager'

  async function addCollaborator(managerId: string) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'BILLING_ADMIN') {
      throw new Error('Only billing admins can manage account managers')
    }

    if (!managerId) {
      throw new Error('Please select an account manager')
    }

    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', managerId)
      .eq('role', 'ACCOUNT_MANAGER')
      .single()

    if (!managerProfile) {
      throw new Error('Please select a valid account manager')
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
    revalidatePath(`/subscriptions/${subscriptionId}`)
  }

  async function removeCollaborator(managerId: string) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'BILLING_ADMIN') {
      throw new Error('Only billing admins can manage account managers')
    }

    if (!managerId) {
      throw new Error('Please select an account manager')
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
    revalidatePath(`/subscriptions/${subscriptionId}`)
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
                  Manager
                </p>

                <p className="font-medium">
                  {managerName(collaborator)}
                </p>
              </div>

              <form action={removeCollaborator.bind(null, collaborator.user_id)}>
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
            Assign an account manager from the available names below.
          </p>
        </div>
      )}

      {managersLoadError && (
        <p className="text-sm text-red-600">
          Could not load available account managers: {managersLoadError}
        </p>
      )}

      {!managersLoadError && assignableManagers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Available account managers
          </p>

          {assignableManagers.map((manager) => (
            <form
              key={manager.id}
              action={addCollaborator.bind(null, manager.id)}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <span className="min-w-0 truncate font-medium">
                {managerName(manager)}
              </span>

              <button
                type="submit"
                className="shrink-0 rounded-md border px-4 py-2 font-medium"
              >
                Add
              </button>
            </form>
          ))}
        </div>
      )}

      {!managersLoadError && assignableManagers.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No additional account managers are available.
        </p>
      )}
    </div>
  )
}
