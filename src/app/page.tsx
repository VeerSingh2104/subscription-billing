import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const {
  data: { user },
} = await supabase.auth.getUser()

  return (
  <main className="p-10">
    <h1 className="text-2xl font-bold">
      Supabase Connection Test
    </h1>

    <p className="mt-4">
      {user
        ? `Logged in as: ${user.email}`
        : 'Supabase connected — no user is logged in.'}
    </p>
  </main>
)
}