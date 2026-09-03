'use client'

import { useState, useTransition } from 'react'
import {
  generateCurrentPeriodInvoices,
  type BulkInvoiceResponse,
} from '@/app/dashboard/actions/invoice-generation'

export default function BulkInvoiceGenerator() {
  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [result, setResult] =
    useState<BulkInvoiceResponse | null>(
      null
    )

  function handleGenerate() {
    setResult(null)

    startTransition(async () => {
      const response =
        await generateCurrentPeriodInvoices()

      setResult(response)
    })
  }

  const generated =
    result?.results.filter(
      (item) =>
        item.status ===
        'generated'
    ).length ?? 0

  const skipped =
    result?.results.filter(
      (item) =>
        item.status ===
        'skipped'
    ).length ?? 0

  const failed =
    result?.results.filter(
      (item) =>
        item.status ===
        'failed'
    ).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            Generate current-period invoices
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Creates one draft invoice for every active
            subscription that does not already have an
            invoice for the current billing period.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? 'Generating...'
            : 'Generate Current Period'}
        </button>
      </div>

      {result?.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {result.error}
        </div>
      )}

      {result?.success && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-500">
                {generated}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Skipped
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-500">
                {skipped}
              </p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Failed
              </p>

              <p className="mt-2 text-2xl font-bold text-red-500">
                {failed}
              </p>
            </div>
          </div>

          {result.periodLabel && (
            <p className="text-sm text-muted-foreground">
              Billing period:{' '}
              <span className="font-semibold text-foreground">
                {result.periodLabel}
              </span>
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Subscription
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Plan
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Cycle
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Result
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Reason
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {result.results.map(
                  (item) => (
                    <tr
                      key={
                        item.subscriptionId
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.customerName}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {item.planName}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {item.billingCycle}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status ===
                            'generated'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : item.status ===
                                'skipped'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {item.reason ||
                          'Invoice created successfully'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}