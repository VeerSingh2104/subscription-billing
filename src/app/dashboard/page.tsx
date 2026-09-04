import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/components/logout-button'
import AdminControls from '@/app/dashboard/components/admin-controls'
import InvoiceControls from '@/app/dashboard/components/invoice-controls'
import BulkInvoiceGenerator from '@/app/components/bulk-invoice-generator'
import CollaboratorControl from '@/app/dashboard/components/collaborator-control'
import AppNavbar from '@/app/components/app-navbar'
import Link from 'next/link'
import DashboardAnalytics from './components/dashboard-analytics'

type AccountManager = {
    id: string
    full_name: string | null
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string }>
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const params = await searchParams

    const parsedWeek = Number.parseInt(params.week ?? '0', 10)

    const weekOffset = Number.isFinite(parsedWeek)
        ? Math.max(-52, Math.min(52, parsedWeek))
        : 0

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return (
            <main className="min-h-screen bg-background px-6 py-10 text-foreground">
                <div className="mx-auto max-w-7xl">
                    <div className="glass rounded-2xl border-red-500/20 bg-red-500/5 p-8">
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

    let managerProfiles: AccountManager[] = []
    let managerProfilesError: string | null = null

    if (profile.role === 'BILLING_ADMIN') {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'ACCOUNT_MANAGER')
            .order('full_name', { ascending: true })

        managerProfiles = data ?? []
        managerProfilesError = error?.message ?? null
    }

    const managerNamesById = new Map(
        managerProfiles.map((manager) => [manager.id, manager.full_name])
    )

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
                collaborators: (collaborators ?? []).map((collaborator) => ({
                    ...collaborator,
                    full_name:
                        managerNamesById.get(collaborator.user_id) ?? null,
                })),
            }
        })
    )

    const subscriptionCount = subscriptionsWithCollaborators.length

    return (
        <>
            <AppNavbar />

            <main className="min-h-screen bg-background text-foreground animate-fade-in">
                <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

                    {/* ====================================================== */}
                    {/* HEADER */}
                    {/* ====================================================== */}

                    <header
                        data-tour="dashboard-overview"
                        className="glass rounded-3xl p-6 animate-fade-up sm:p-7"
                    >
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                            <div className="flex items-start gap-4">

                                <div className="glass-primary motion-button flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white">
                                    B
                                </div>

                                <div className="min-w-0">

                                    <p className="text-xs font-semibold text-blue-500 dark:text-blue-300">
                                        Billing Platform
                                    </p>

                                    <h1 className="mt-1 text-2xl font-bold tracking-tight">
                                        Dashboard
                                    </h1>

                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Welcome back,{' '}
                                        <span className="font-semibold text-foreground">
                                            {profile.full_name}
                                        </span>
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-3">

                                        <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                                            {profile.role}
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            {user.email}
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="flex items-center gap-3">
                                <Link
                                    href="/invoices"
                                    className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                                >
                                    View invoices
                                    <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
                                        →
                                    </span>
                                </Link>
                            </div>

                        </div>
                    </header>

                    {/* ====================================================== */}
                    {/* FINANCIAL OVERVIEW */}
                    {/* ====================================================== */}

                    <div
                        data-tour="analytics"
                        className="animate-fade-up"
                        style={{ animationDelay: '80ms' }}
                    >
                        <DashboardAnalytics weekOffset={weekOffset} />
                    </div>

                    {/* ====================================================== */}
                    {/* SUBSCRIPTIONS */}
                    {/* ====================================================== */}

                    <section
                        data-tour="dashboard-subscriptions"
                        className="mt-14 animate-fade-up"
                        style={{ animationDelay: '140ms' }}
                    >

                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <div className="flex flex-wrap items-center gap-3">

                                    <h2 className="text-base font-bold">
                                        Subscriptions
                                    </h2>

                                    <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                                        {subscriptionCount} total
                                    </span>

                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Monitor customer plans, billing cycles, and ownership.
                                </p>

                            </div>

                            <Link
                                href="/subscriptions"
                                className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                            >
                                Manage all
                                <span className="ml-2">→</span>
                            </Link>

                        </div>

                        {/* Error */}

                        {subscriptionsError && (
                            <div className="glass mb-6 rounded-2xl border-red-500/20 bg-red-500/5 p-5 animate-fade-up">
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
                                <div className="glass rounded-2xl border-dashed p-12 text-center animate-fade-scale">

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-xl backdrop-blur">
                                        $
                                    </div>

                                    <h3 className="mt-4 text-sm font-semibold">
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
                                    style={{
                                        animationDelay: `${Math.min(
                                            260,
                                            180 +
                                                subscriptionsWithCollaborators.indexOf(
                                                    subscription
                                                ) *
                                                    70
                                        )}ms`,
                                    }}
                                    className="glass motion-card group relative overflow-hidden rounded-2xl animate-fade-up hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5"
                                >

                                    {/* Top accent */}

                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

                                    {/* Main card */}

                                    <div className="p-5 pt-6 sm:p-6 sm:pt-7">

                                        {/* Card header */}

                                        <div className="flex items-start justify-between gap-4">

                                            <div className="min-w-0">

                                                <div className="mb-3 flex items-center gap-2">

                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                                                        Customer
                                                    </span>

                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />

                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Subscription
                                                    </span>

                                                </div>

                                                <h3 className="truncate text-sm font-semibold transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                                                    {subscription.customer_name}
                                                </h3>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {subscription.plan_name}
                                                </p>

                                            </div>

                                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">

                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                                {subscription.status || 'Active'}
                                            </span>

                                        </div>

                                        {/* Price */}

                                        <div className="glass mt-6 rounded-2xl border-border/50 bg-background/30 p-4 sm:p-5">

                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Subscription Price
                                            </p>

                                            <div className="mt-2 flex items-baseline gap-2">

                                                <span className="text-xl font-bold tracking-tight">
                                                    ₹{subscription.price}
                                                </span>

                                                <span className="text-xs text-muted-foreground">
                                                    / {subscription.billing_cycle?.toLowerCase()}
                                                </span>

                                            </div>

                                        </div>

                                        {/* Details */}

                                        <div className="mt-4 grid grid-cols-2 gap-3">

                                            <div className="glass-button rounded-xl bg-background/30 p-3.5">

                                                <div className="flex items-center gap-2">

                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />

                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Billing Cycle
                                                    </p>

                                                </div>

                                                <p className="mt-3 text-sm font-semibold">
                                                    {subscription.billing_cycle}
                                                </p>

                                            </div>

                                            <div className="glass-button rounded-xl bg-background/30 p-3.5">

                                                <div className="flex items-center gap-2">

                                                    <div className="h-2 w-2 rounded-full bg-purple-500" />

                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Started
                                                    </p>

                                                </div>

                                                <p className="mt-3 text-sm font-semibold">
                                                    {subscription.start_date}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="mt-5">

                                            <Link
                                                href={`/subscriptions/${subscription.id}`}
                                                className="glass-button motion-button inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                                            >
                                                View Subscription
                                                <span className="ml-2">
                                                    →
                                                </span>
                                            </Link>

                                        </div>

                                    </div>

                                    {/* Account manager */}

                                    {profile.role === 'BILLING_ADMIN' && (

                                        <div className="border-t border-border/50 bg-background/10 px-6 py-6 backdrop-blur-sm">

                                            <div className="mb-5 flex items-start justify-between gap-4">

                                                <div>

                                                    <div className="flex items-center gap-2">

                                                        <h4 className="text-sm font-semibold">
                                                            Account Manager
                                                        </h4>

                                                        <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
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
                                                collaborators={
                                                    subscription.collaborators ?? []
                                                }
                                                availableManagers={managerProfiles}
                                                managersLoadError={
                                                    managerProfilesError
                                                }
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

                    {profile.role === 'BILLING_ADMIN' && (

                        <section
                            data-tour="administration"
                            className="mt-14 animate-fade-up"
                            style={{ animationDelay: '140ms' }}
                        >

                            <div className="mb-6">

                                <div className="flex flex-wrap items-center gap-3">

                                    <h2 className="text-base font-bold">
                                        Administration
                                    </h2>

                                    <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                                        Admin
                                    </span>

                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Billing administration and invoice management.
                                </p>

                            </div>

                            {/* Subscription Management */}

                            <details className="glass motion-card group overflow-hidden rounded-2xl">

                                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 transition hover:bg-white/5 [&::-webkit-details-marker]:hidden">

                                    <div className="flex items-center gap-4">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-xl font-semibold text-blue-600 dark:text-blue-300">
                                            +
                                        </div>

                                        <div>

                                            <h3 className="text-sm font-semibold text-foreground">
                                                Subscription Management
                                            </h3>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Create and manage customer subscriptions.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                        ↓
                                    </div>

                                </summary>

                                <div className="details-panel-wrapper">
                                    <div className="border-t border-border/50 px-6 py-6">
                                        <AdminControls />
                                    </div>
                                </div>

                            </details>

                            {/* Invoice Management */}

                            <details className="glass motion-card group mt-4 overflow-hidden rounded-2xl">

                                <summary className="flex cursor-pointer list-none items-center justify-between border-b border-border/40 bg-background/10 px-6 py-5 transition hover:bg-white/5 [&::-webkit-details-marker]:hidden">

                                    <div className="flex items-center gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 text-lg font-bold text-emerald-500">
                                            ₹
                                        </div>

                                        <div>

                                            <h3 className="text-sm font-semibold">
                                                Invoice Management
                                            </h3>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Create invoices for existing subscriptions.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                                        ↓
                                    </div>

                                </summary>

                                <div className="details-panel-wrapper">
                                    <div className="p-6">
                                        <InvoiceControls />

                                        <div className="mt-8 border-t border-border/50 pt-8">
                                            <div className="mb-5">

                                                <h4 className="text-sm font-semibold">
                                                    Bulk Invoice Generation
                                                </h4>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Generate the current billing period across all active subscriptions.
                                                </p>

                                            </div>

                                            <BulkInvoiceGenerator />
                                        </div>
                                    </div>
                                </div>

                            </details>

                        </section>


                    )}

                </div>
            </main>
        </>
    )
}