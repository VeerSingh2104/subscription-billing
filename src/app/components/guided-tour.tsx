'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type TourStep = {
    target: string
    title: string
    description: string
}

type TargetRect = {
    top: number
    left: number
    width: number
    height: number
}

type CardPosition = {
    top: number
    left: number
    above: boolean
}

const tourSteps: TourStep[] = [
    {
        target: '[data-tour="dashboard"]',
        title: 'Dashboard',
        description:
            'This is your main overview. From here you can see your billing activity, financial insights, subscriptions, and management tools.',
    },
    {
        target: '[data-tour="dashboard-overview"]',
        title: 'Dashboard Overview',
        description:
            'This section introduces your account and shows your role, email, and a quick shortcut to your invoices.',
    },
    {
        target: '[data-tour="analytics"]',
        title: 'Financial Overview',
        description:
            'This area gives you a quick view of your billing performance, financial activity, and revenue trends.',
    },
    {
        target: '[data-tour="dashboard-subscriptions"]',
        title: 'Subscription Overview',
        description:
            'This section shows your subscription records, including customers, plans, billing cycles, prices, and subscription details.',
    },
    {
        target: '[data-tour="subscriptions"]',
        title: 'Subscriptions',
        description:
            'Use this navigation option to view and manage all subscription records in one place.',
    },
    {
        target: '[data-tour="invoices"]',
        title: 'Invoices',
        description:
            'Use this navigation option to search, filter, sort, and manage invoices across your billing portfolio.',
    },
    {
        target: '[data-tour="alerts"]',
        title: 'Alerts',
        description:
            'Important billing notifications appear here. The badge shows when there are alerts that need your attention.',
    },
    {
        target: '[data-tour="theme"]',
        title: 'Theme',
        description:
            'Switch between light and dark mode. Your preference is saved on this device and remains after refreshing the page.',
    },
    {
        target: '[data-tour="administration"]',
        title: 'Administration',
        description:
            'Billing administrators can access subscription management, invoice management, and bulk invoice generation tools from here.',
    },
]

const appRoutes = [
    '/dashboard',
    '/subscriptions',
    '/invoices',
    '/alerts',
]

function getSpotlightElement(
    selector: string
): HTMLElement | null {
    const container = document.querySelector(selector)

    if (!(container instanceof HTMLElement)) {
        return null
    }

    const tagName = container.tagName.toLowerCase()

    /*
     * Navigation items and controls should be highlighted
     * directly.
     */
    if (
        tagName === 'a' ||
        tagName === 'button' ||
        tagName === 'input' ||
        tagName === 'select'
    ) {
        return container
    }

    /*
     * For larger sections, highlight the actual heading
     * instead of the whole component.
     */
    const heading = container.querySelector(
        'h1, h2, h3, h4'
    )

    if (heading instanceof HTMLElement) {
        return heading
    }

    /*
     * Fallback for containers without a heading.
     */
    const interactive = container.querySelector(
        'a, button, input, select'
    )

    if (interactive instanceof HTMLElement) {
        return interactive
    }

    return container
}

export default function GuidedTour() {
    const pathname = usePathname()

    const [started, setStarted] = useState(false)
    const [stepIndex, setStepIndex] = useState(0)
    const [showWelcome, setShowWelcome] = useState(false)
    const [availableSteps, setAvailableSteps] =
        useState<TourStep[]>([])

    const isAppRoute = appRoutes.some(
        (route) =>
            pathname === route ||
            pathname.startsWith(`${route}/`)
    )

    useEffect(() => {
        if (!isAppRoute) {
            setShowWelcome(false)
            setStarted(false)
            return
        }

        const completed = localStorage.getItem(
            'billing-tour-completed'
        )

        if (!completed) {
            setShowWelcome(true)
        }
    }, [isAppRoute])

    /*
     * Find only the tour targets that actually exist
     * on the current page.
     */
    useEffect(() => {
        if (!started) return

        const findAvailableSteps = () => {
            const steps = tourSteps.filter(
                (step) =>
                    getSpotlightElement(step.target) !== null
            )

            setAvailableSteps(steps)

            if (
                steps.length > 0 &&
                stepIndex >= steps.length
            ) {
                setStepIndex(steps.length - 1)
            }
        }

        findAvailableSteps()

        const timeout = window.setTimeout(
            findAvailableSteps,
            150
        )

        return () => {
            window.clearTimeout(timeout)
        }
    }, [
        started,
        stepIndex,
        pathname,
    ])

    /*
     * Bring the current target into view.
     */
    useEffect(() => {
        if (!started) return

        const step = availableSteps[stepIndex]

        if (!step) return

        const element =
            getSpotlightElement(step.target)

        if (!element) return

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
        })
    }, [
        started,
        stepIndex,
        availableSteps,
        pathname,
    ])

    function startTour() {
        const steps = tourSteps.filter(
            (step) =>
                getSpotlightElement(step.target) !== null
        )

        setAvailableSteps(steps)
        setShowWelcome(false)
        setStarted(true)
        setStepIndex(0)
    }

    function skipTour() {
        localStorage.setItem(
            'billing-tour-completed',
            'true'
        )

        setShowWelcome(false)
        setStarted(false)
        setStepIndex(0)
    }

    function nextStep() {
        if (
            stepIndex >=
            availableSteps.length - 1
        ) {
            finishTour()
            return
        }

        setStepIndex(
            (current) => current + 1
        )
    }

    function previousStep() {
        if (stepIndex === 0) return

        setStepIndex(
            (current) => current - 1
        )
    }

    function finishTour() {
        /*
         * Return to the very beginning of the page
         * smoothly before closing the tour.
         */
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })

        localStorage.setItem(
            'billing-tour-completed',
            'true'
        )

        setStarted(false)
        setShowWelcome(false)
        setStepIndex(0)
    }

    if (!isAppRoute) {
        return null
    }

    if (!showWelcome && !started) {
        return null
    }

    const currentStep =
        availableSteps[stepIndex]

    return (
        <>
            {/*
             * Welcome screen.
             */}
            {showWelcome && (
                <div className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-lg dark:bg-black/50" />
            )}

            {showWelcome && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-5">
                    <div className="w-full max-w-md rounded-3xl border border-border/70 bg-background/95 p-7 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:shadow-black/50">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/10 bg-blue-500/10 text-lg font-bold text-blue-600 dark:text-blue-300">
                            B
                        </div>

                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                            Quick tour
                        </p>

                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Welcome to Subscription Billing
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Let&apos;s take a quick tour of
                            the website so you know what
                            everything does and where to
                            find the tools you need.
                        </p>

                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={skipTour}
                                className="glass-button motion-button rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                            >
                                Skip
                            </button>

                            <button
                                type="button"
                                onClick={startTour}
                                className="glass-primary motion-button rounded-xl px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                            >
                                Start Tour
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {started && currentStep && (
                <TourStepCard
                    step={currentStep}
                    stepIndex={stepIndex}
                    totalSteps={availableSteps.length}
                    onNext={nextStep}
                    onPrevious={previousStep}
                    onSkip={skipTour}
                />
            )}
        </>
    )
}

function TourStepCard({
    step,
    stepIndex,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
}: {
    step: TourStep
    stepIndex: number
    totalSteps: number
    onNext: () => void
    onPrevious: () => void
    onSkip: () => void
}) {
    const [targetRect, setTargetRect] =
        useState<TargetRect | null>(null)

    const [position, setPosition] =
        useState<CardPosition | null>(null)

    /*
     * Continuously measure the actual target and the
     * actual tour card.
     */
    useEffect(() => {
        let resizeObserver:
            | ResizeObserver
            | null = null

        let animationFrame = 0

        const update = () => {
            const target =
                getSpotlightElement(step.target)

            if (!target) {
                setTargetRect(null)
                setPosition(null)
                return
            }

            const rect =
                target.getBoundingClientRect()

            const measuredTarget: TargetRect = {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            }

            setTargetRect(measuredTarget)

            const card =
                document.querySelector(
                    '[data-tour-card="true"]'
                ) as HTMLElement | null

            if (!card) {
                return
            }

            const cardRect =
                card.getBoundingClientRect()

            const cardWidth =
                cardRect.width

            const cardHeight =
                cardRect.height

            const margin = 16
            const gap = 20

            const spaceAbove =
                rect.top - gap

            const spaceBelow =
                window.innerHeight -
                rect.bottom -
                gap

            let above = false

            /*
             * Prefer below if the REAL card fits there.
             * Otherwise use above if the REAL card fits.
             * If neither fits, use the side with more space.
             */
            if (
                spaceBelow >= cardHeight
            ) {
                above = false
            } else if (
                spaceAbove >= cardHeight
            ) {
                above = true
            } else {
                above =
                    spaceAbove >
                    spaceBelow
            }

            /*
             * Center the actual card around the actual
             * target.
             */
            let left =
                rect.left +
                rect.width / 2 -
                cardWidth / 2

            /*
             * Keep the actual card inside the viewport.
             */
            left = Math.max(
                margin,
                Math.min(
                    left,
                    window.innerWidth -
                        cardWidth -
                        margin
                )
            )

            let top = above
                ? rect.top - gap
                : rect.bottom + gap

            /*
             * Only clamp when necessary.
             */
            if (above) {
                top = Math.max(
                    margin + cardHeight,
                    top
                )
            } else {
                top = Math.min(
                    top,
                    window.innerHeight -
                        cardHeight -
                        margin
                )
            }

            setPosition({
                top,
                left,
                above,
            })
        }

        /*
         * Initial measurement.
         */
        update()

        /*
         * Measure again after rendering.
         */
        animationFrame =
            window.requestAnimationFrame(() => {
                update()
            })

        /*
         * Watch the actual target for size changes.
         */
        const target =
            getSpotlightElement(step.target)

        if (target) {
            resizeObserver =
                new ResizeObserver(update)

            resizeObserver.observe(target)
        }

        /*
         * Watch the tour card for size changes too.
         */
        const card =
            document.querySelector(
                '[data-tour-card="true"]'
            ) as HTMLElement | null

        if (card) {
            if (!resizeObserver) {
                resizeObserver =
                    new ResizeObserver(update)
            }

            resizeObserver.observe(card)
        }

        window.addEventListener(
            'resize',
            update
        )

        window.addEventListener(
            'scroll',
            update,
            true
        )

        return () => {
            window.cancelAnimationFrame(
                animationFrame
            )

            resizeObserver?.disconnect()

            window.removeEventListener(
                'resize',
                update
            )

            window.removeEventListener(
                'scroll',
                update,
                true
            )
        }
    }, [step.target])

    /*
     * Re-measure once the card has appeared.
     */
    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                const target =
                    getSpotlightElement(
                        step.target
                    )

                if (!target) return

                const rect =
                    target.getBoundingClientRect()

                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                })
            }, 50)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [step.target])

    /*
     * Temporary fallback while the browser is measuring.
     */
    if (!targetRect || !position) {
        return (
            <div className="fixed bottom-5 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
                <div
                    data-tour-card="true"
                    className="rounded-2xl border border-border/70 bg-background/95 p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:shadow-black/50"
                >
                    <TourCardContent
                        step={step}
                        stepIndex={stepIndex}
                        totalSteps={totalSteps}
                        onNext={onNext}
                        onPrevious={onPrevious}
                        onSkip={onSkip}
                    />
                </div>
            </div>
        )
    }

    const padding = 7

    const top =
        targetRect.top - padding

    const left =
        targetRect.left - padding

    const width =
        targetRect.width +
        padding * 2

    const height =
        targetRect.height +
        padding * 2

    return (
        <>
            {/*
             * ONE full-screen blur layer.
             *
             * The center hole is cut out using a CSS
             * mask, so the highlighted target is NOT
             * behind a backdrop-filter.
             */
            <div
                className="pointer-events-none fixed inset-0 z-[100] bg-black/35 backdrop-blur-md dark:bg-black/50"
                style={{
                    WebkitMaskImage: `
                        linear-gradient(
                            to bottom,
                            black 0,
                            black ${Math.max(0, top)}px,
                            transparent ${Math.max(0, top)}px,
                            transparent ${Math.max(0, top + height)}px,
                            black ${Math.max(0, top + height)}px,
                            black 100%
                        )
                    `,
                    maskImage: `
                        linear-gradient(
                            to bottom,
                            black 0,
                            black ${Math.max(0, top)}px,
                            transparent ${Math.max(0, top)}px,
                            transparent ${Math.max(0, top + height)}px,
                            black ${Math.max(0, top + height)}px,
                            black 100%
                        )
                    `,
                }}
            />

            /*
             * Left and right darkening panels.
             *
             * These DO NOT use backdrop blur.
             * This prevents blur from leaking into the
             * highlighted heading/control.
             */}
            <div
                className="pointer-events-none fixed z-[101] bg-black/35 dark:bg-black/50"
                style={{
                    top,
                    left: 0,
                    width: Math.max(0, left),
                    height,
                }}
            />

            <div
                className="pointer-events-none fixed z-[101] bg-black/35 dark:bg-black/50"
                style={{
                    top,
                    left: left + width,
                    right: 0,
                    height,
                }}
            />

            {/*
             * Actual spotlight border.
             */}
            <div
                className="pointer-events-none fixed z-[115] rounded-xl border border-blue-400/90 bg-transparent shadow-[0_0_0_3px_rgba(59,130,246,0.10),0_0_28px_rgba(59,130,246,0.22)] transition-all duration-300 dark:border-blue-300/90 dark:shadow-[0_0_0_3px_rgba(96,165,250,0.10),0_0_28px_rgba(96,165,250,0.18)]"
                style={{
                    top,
                    left,
                    width,
                    height,
                }}
            />

            {/*
             * Explanation card.
             */}
            <div
                className="fixed z-[120] w-[calc(100%-2rem)] max-w-[360px]"
                style={{
                    top: position.top,
                    left: position.left,
                    transform: position.above
                        ? 'translateY(-100%)'
                        : 'translateY(0)',
                }}
            >
                <div
                    data-tour-card="true"
                    className="rounded-2xl border border-border/70 bg-background/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl dark:bg-background/95 dark:shadow-black/60"
                >
                    <TourCardContent
                        step={step}
                        stepIndex={stepIndex}
                        totalSteps={totalSteps}
                        onNext={onNext}
                        onPrevious={onPrevious}
                        onSkip={onSkip}
                    />
                </div>
            </div>
        </>
    )
}

function TourCardContent({
    step,
    stepIndex,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
}: {
    step: TourStep
    stepIndex: number
    totalSteps: number
    onNext: () => void
    onPrevious: () => void
    onSkip: () => void
}) {
    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                    Step {stepIndex + 1} of{' '}
                    {totalSteps}
                </span>

                <button
                    type="button"
                    onClick={onSkip}
                    className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                    Skip
                </button>
            </div>

            <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">
                {step.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={stepIndex === 0}
                    className="glass-button rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    className="glass-primary motion-button rounded-xl px-4 py-2.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                >
                    {stepIndex ===
                    totalSteps - 1
                        ? 'Finish'
                        : 'Next'}
                </button>
            </div>
        </>
    )
}