'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-foreground animate-fade-in">

      {/* Soft cloudy background */}
      {/* Full-page flowing cloudy background */}
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/30 dark:via-background dark:to-indigo-950/30" />

  <div className="absolute -left-[15%] -top-[20%] h-[65vh] w-[65vw] rounded-full bg-blue-400/20 blur-[120px] animate-cloud-one dark:bg-blue-500/15" />

  <div className="absolute -right-[15%] -top-[10%] h-[60vh] w-[60vw] rounded-full bg-indigo-400/20 blur-[130px] animate-cloud-two dark:bg-indigo-500/15" />

  <div className="absolute -bottom-[25%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-sky-400/20 blur-[140px] animate-cloud-three dark:bg-sky-500/15" />

  <div className="absolute -bottom-[20%] -right-[15%] h-[65vh] w-[65vw] rounded-full bg-violet-400/15 blur-[130px] animate-cloud-four dark:bg-violet-500/10" />

  <div className="absolute left-[30%] top-[35%] h-[35vh] w-[40vw] rounded-full bg-blue-300/10 blur-[100px] animate-cloud-two dark:bg-blue-400/10" />

  <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] dark:bg-black/10" />
</div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-fade-scale">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8 motion-card dark:shadow-black/20">

          <div
            className="animate-fade-up"
            style={{ animationDelay: '70ms' }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="glass-primary flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image
                    src="/icon.png"
                    alt="Subscription Billing"
                    width={64}
                    height={64}
                    priority
                    className="h-full w-full object-cover"
                />
            </span>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Subscription Billing
                </h1>

                <p className="text-xs text-muted-foreground">
                  Operations console
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5 animate-fade-up"
            style={{ animationDelay: '130ms' }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/80 px-3 py-3 text-sm text-foreground outline-none transition duration-200 placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/80 px-3 py-3 text-sm text-foreground outline-none transition duration-200 placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 animate-fade-up dark:text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="motion-button w-full rounded-lg bg-blue-600 p-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm text-muted-foreground animate-fade-up"
            style={{ animationDelay: '190ms' }}
          >
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="motion-link font-medium text-foreground underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-300"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}