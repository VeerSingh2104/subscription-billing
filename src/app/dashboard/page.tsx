import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/components/logout-button'
import ThemeToggle from '@/app/components/theme-toggle'
import AdminControls from '@/app/dashboard/components/admin-controls'
import InvoiceControls from '@/app/dashboard/components/invoice-controls'
import CollaboratorControl from '@/app/dashboard/components/collaborator-control'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return (
            <main className="min-h-screen bg-background px-6 py-10 text-foreground">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
                        <h1 className="text-2xl font-bold">
                            Profile Not Found
                        </h1>

                        <p className="mt-3 text-muted-foreground">
                            Your user profile could not be found.
                        </p>

                        <div className="mt-6">
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    const { data: subscriptions, error: subscriptionsError } =
        await supabase
            .from('subscriptions')
            .select('*')

    /*
     * Load collaborators separately for each subscription.
     * This avoids depending on Supabase's automatic relationship
     * resolution between subscriptions and subscription_collaborators.
     */
    const subscriptionsWithCollaborators = await Promise.all(
        (subscriptions ?? []).map(async (subscription) => {
            const { data: collaborators, error: collaboratorsError } =
                await supabase
                    .from('subscription_collaborators')
                    .select('user_id')
                    .eq('subscription_id', subscription.id)

            if (collaboratorsError) {
                console.error(
                    `Failed to load collaborators for subscription ${subscription.id}:`,
                    collaboratorsError.message
                )
            }

            return {
                ...subscription,
                collaborators: collaborators ?? [],
            }
        })
    )

    const subscriptionCount = subscriptionsWithCollaborators.length

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

                {/* ====================================================== */}
                {/* HEADER */}
                {/* ====================================================== */}

                <header className="border-b border-border pb-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex items-start gap-4">

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
                                B
                            </div>

                            <div className="min-w-0">

                                <p className="text-sm font-medium text-blue-500">
                                    Billing Platform
                                </p>

                                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Dashboard
                                </h1>

                                <p className="mt-3 text-sm text-muted-foreground">
                                    Welcome back,{' '}
                                    <span className="font-semibold text-foreground">
                                        {profile.full_name}
                                    </span>
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-3">

                                    <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                                        {profile.role}
                                    </span>

                                    <span className="text-sm text-muted-foreground">
                                        {user.email}
                                    </span>

                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <LogoutButton />
                        </div>

                    </div>
                </header>

                {/* ====================================================== */}
                {/* STATS */}
                {/* ====================================================== */}

                <section className="mt-8 grid gap-5 md:grid-cols-3">

                    {/* Active subscriptions */}

                    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-medium text-muted-foreground">
                                    Active Subscriptions
                                </p>

                                <p className="mt-3 text-4xl font-bold tracking-tight">
                                    {subscriptionCount}
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-lg font-bold text-blue-500">
                                $
                            </div>

                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">
                            Subscriptions available to your account
                        </p>

                    </div>

                    {/* Account role */}

                    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg">

                        <div className="flex items-start justify-between">

                            <div className="min-w-0">

                                <p className="text-sm font-medium text-muted-foreground">
                                    Account Role
                                </p>

                                <p className="mt-3 truncate text-2xl font-bold">
                                    {profile.role}
                                </p>

                            </div>

                            <div className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-lg text-purple-500">
                                ✓
                            </div>

                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">
                            Your current access level
                        </p>

                    </div>

                    {/* Account */}

                    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg">

                        <div className="flex items-start justify-between">

                            <div className="min-w-0">

                                <p className="text-sm font-medium text-muted-foreground">
                                    Account
                                </p>

                                <p className="mt-3 truncate text-sm font-semibold">
                                    {user.email}
                                </p>

                            </div>

                            <div className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-500">
                                @
                            </div>

                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">
                            Signed in account
                        </p>

                    </div>

                </section>

                {/* ====================================================== */}
                {/* SUBSCRIPTIONS */}
                {/* ====================================================== */}

                <section className="mt-14">

                    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                            <div className="flex flex-wrap items-center gap-3">

                                <h2 className="text-2xl font-bold tracking-tight">
                                    Subscriptions
                                </h2>

                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {subscriptionCount} total
                                </span>

                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage and review your customer subscriptions.
                            </p>

                        </div>

                    </div>

                    {/* Error */}

                    {subscriptionsError && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

                            <p className="text-sm font-semibold text-red-500">
                                Unable to load subscriptions
                            </p>

                            <p className="mt-1 text-sm text-red-500/80">
                                {subscriptionsError.message}
                            </p>

                        </div>
                    )}

                    {/* Empty state */}

                    {!subscriptionsError &&
                        subscriptionsWithCollaborators.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">

                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-xl">
                                    $
                                </div>

                                <h3 className="mt-4 font-semibold">
                                    No subscriptions found
                                </h3>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    There are currently no subscriptions
                                    associated with your account.
                                </p>

                            </div>
                        )}

                    {/* Subscription cards */}

                    <div className="grid gap-6 lg:grid-cols-2">

                        {subscriptionsWithCollaborators.map((subscription) => (

                            <div
                                key={subscription.id}
                                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl"
                            >

                                {/* Top accent */}

                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

                                {/* Main card */}

                                <div className="p-6 pt-7">

                                    {/* Card header */}

                                    <div className="flex items-start justify-between gap-4">

                                        <div className="min-w-0">

                                            <div className="mb-3 flex items-center gap-2">

                                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500">
                                                    Customer
                                                </span>

                                                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />

                                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                                    Subscription
                                                </span>

                                            </div>

                                            <h3 className="truncate text-xl font-bold tracking-tight">
                                                {subscription.customer_name}
                                            </h3>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {subscription.plan_name}
                                            </p>

                                        </div>

                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">

                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                            {subscription.status || 'Active'}

                                        </span>

                                    </div>

                                    {/* Price */}

                                    <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">

                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Subscription Price
                                        </p>

                                        <div className="mt-2 flex items-baseline gap-2">

                                            <span className="text-3xl font-bold tracking-tight">
                                                ₹{subscription.price}
                                            </span>

                                            <span className="text-sm text-muted-foreground">
                                                / {subscription.billing_cycle?.toLowerCase()}
                                            </span>

                                        </div>

                                    </div>

                                    {/* Details */}

                                    <div className="mt-5 grid grid-cols-2 gap-4">

                                        <div className="rounded-xl border border-border bg-background/50 p-4">

                                            <div className="flex items-center gap-2">

                                                <div className="h-2 w-2 rounded-full bg-blue-500" />

                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Billing Cycle
                                                </p>

                                            </div>

                                            <p className="mt-3 text-sm font-bold">
                                                {subscription.billing_cycle}
                                            </p>

                                        </div>

                                        <div className="rounded-xl border border-border bg-background/50 p-4">

                                            <div className="flex items-center gap-2">

                                                <div className="h-2 w-2 rounded-full bg-purple-500" />

                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Started
                                                </p>

                                            </div>

                                            <p className="mt-3 text-sm font-bold">
                                                {subscription.start_date}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                {/* Account manager */}

                                {profile.role === 'BILLING_ADMIN' && (

                                    <div className="border-t border-border bg-muted/10 px-6 py-6">

                                        <div className="mb-5 flex items-start justify-between gap-4">

                                            <div>

                                                <div className="flex items-center gap-2">

                                                    <h4 className="text-sm font-bold">
                                                        Account Manager
                                                    </h4>

                                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                                                        ADMIN
                                                    </span>

                                                </div>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Assign or manage the manager responsible
                                                    for this subscription.
                                                </p>

                                            </div>

                                        </div>

                                        <CollaboratorControl
                                            subscriptionId={subscription.id}
                                            collaborators={subscription.collaborators ?? []}
                                        />

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                </section>

                {/* ====================================================== */}
                {/* ADMINISTRATION */}
                {/* ====================================================== */}

                {profile.role === 'BILLING_ADMIN' ? (

                    <section className="mt-16">

                        <div className="mb-7">

                            <div className="flex flex-wrap items-center gap-3">

                                <h2 className="text-2xl font-bold tracking-tight">
                                    Administration
                                </h2>

                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                                    Admin
                                </span>

                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Billing administration and invoice management.
                            </p>

                        </div>

                        {/* Subscription Management */}

                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

                            <div className="border-b border-border bg-muted/10 px-6 py-5">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl font-bold text-blue-500">
                                        +
                                    </div>

                                    <div>

                                        <h3 className="font-bold">
                                            Subscription Management
                                        </h3>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Create and manage customer subscriptions.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="p-6">
                                <AdminControls />
                            </div>

                        </div>

                        {/* Invoice Management */}

                        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

                            <div className="border-b border-border bg-muted/10 px-6 py-5">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-500">
                                        ₹
                                    </div>

                                    <div>

                                        <h3 className="font-bold">
                                            Invoice Management
                                        </h3>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Create invoices for existing subscriptions.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="p-6">
                                <InvoiceControls />
                            </div>

                        </div>

                    </section>

                ) : (

                    <section className="mt-16">

                        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

                            <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-500">
                                    →
                                </div>

                                <div>

                                    <h2 className="text-xl font-bold">
                                        Account Manager
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Account management tools will appear here.
                                        Your available tools depend on your assigned
                                        permissions.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </section>

                )}

            </div>
        </main>
    )
}