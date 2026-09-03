'use server'

import { createClient } from '@/lib/supabase/server'

export type AlertWithInvoice = {
  id: string
  invoice_id: string
  alert_type: string
  due_date: string
  is_dismissed: boolean
  dismissed_by: string | null
  dismissed_at: string | null
  created_at: string
  invoice: {
    id: string
    amount: number | string
    due_date: string
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
    subscription: {
      customer_name: string
      plan_name: string
    }
  }
}

export type AlertHistoryItem = {
  id: string
  invoice_id: string
  alert_type: string
  due_date: string
  created_at: string
  dismissed_at: string | null
  invoice: {
    id: string
    amount: number | string
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
    subscription: {
      customer_name: string
      plan_name: string
    }
  }
}

async function requireBillingAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in.')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Unable to load your profile.')
  }

  if (profile.role !== 'BILLING_ADMIN') {
    throw new Error('Only billing admins can manage alerts.')
  }

  return {
    supabase,
    user,
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

export async function syncOverdueAlerts() {
  const { supabase } = await requireBillingAdmin()

  const today = getToday()

  const {
    data: overdueInvoices,
    error: invoiceError,
  } = await supabase
    .from('invoices')
    .select(`
      id,
      due_date,
      status,
      updated_at
    `)
    .eq('status', 'ISSUED')
    .lt('due_date', today)

  if (invoiceError) {
    throw new Error(invoiceError.message)
  }

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return
  }

  const invoiceIds = overdueInvoices.map(
    (invoice) => invoice.id
  )

  const {
    data: existingAlerts,
    error: alertError,
  } = await supabase
    .from('alerts')
    .select(`
      id,
      invoice_id,
      alert_type,
      due_date,
      is_dismissed,
      dismissed_by,
      dismissed_at,
      created_at
    `)
    .eq('alert_type', 'OVERDUE')
    .in('invoice_id', invoiceIds)
    .order('created_at', {
      ascending: false,
    })

  if (alertError) {
    throw new Error(alertError.message)
  }

  const alerts = existingAlerts ?? []

  for (const invoice of overdueInvoices) {
    const invoiceAlerts = alerts.filter(
      (alert) => alert.invoice_id === invoice.id
    )

    if (invoiceAlerts.length === 0) {
      const { error } = await supabase
        .from('alerts')
        .insert({
          invoice_id: invoice.id,
          alert_type: 'OVERDUE',
          due_date: invoice.due_date,
          is_dismissed: false,
        })

      if (error) {
        throw new Error(error.message)
      }

      continue
    }

    const latestAlert = invoiceAlerts[0]

    if (!latestAlert.is_dismissed) {
      continue
    }

    if (
      latestAlert.dismissed_at &&
      new Date(invoice.updated_at) <=
        new Date(latestAlert.dismissed_at)
    ) {
      continue
    }

    const { error } = await supabase
      .from('alerts')
      .insert({
        invoice_id: invoice.id,
        alert_type: 'OVERDUE',
        due_date: invoice.due_date,
        is_dismissed: false,
      })

    if (error) {
      throw new Error(error.message)
    }
  }
}

export async function getOverdueAlerts(): Promise<
  AlertWithInvoice[]
> {
  const { supabase } = await requireBillingAdmin()

  await syncOverdueAlerts()

  const today = getToday()

  const {
    data,
    error,
  } = await supabase
    .from('alerts')
    .select(`
      id,
      invoice_id,
      alert_type,
      due_date,
      is_dismissed,
      dismissed_by,
      dismissed_at,
      created_at,
      invoices!inner (
        id,
        amount,
        due_date,
        status,
        subscriptions!inner (
          customer_name,
          plan_name
        )
      )
    `)
    .eq('alert_type', 'OVERDUE')
    .eq('is_dismissed', false)
    .eq('invoices.status', 'ISSUED')
    .lt('invoices.due_date', today)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((alert: any) => ({
    id: alert.id,
    invoice_id: alert.invoice_id,
    alert_type: alert.alert_type,
    due_date: alert.due_date,
    is_dismissed: alert.is_dismissed,
    dismissed_by: alert.dismissed_by,
    dismissed_at: alert.dismissed_at,
    created_at: alert.created_at,

    invoice: {
      id: alert.invoices.id,
      amount: alert.invoices.amount,
      due_date: alert.invoices.due_date,
      status: alert.invoices.status,

      subscription: {
        customer_name:
          alert.invoices.subscriptions.customer_name,
        plan_name:
          alert.invoices.subscriptions.plan_name,
      },
    },
  }))
}

/**
 * Returns dismissed overdue alerts.
 *
 * Alert records are never deleted, so this provides
 * a persistent history of previous overdue alerts.
 */
export async function getAlertHistory(): Promise<
  AlertHistoryItem[]
> {
  const { supabase } = await requireBillingAdmin()

  const {
    data,
    error,
  } = await supabase
    .from('alerts')
    .select(`
      id,
      invoice_id,
      alert_type,
      due_date,
      created_at,
      dismissed_at,
      is_dismissed,
      invoices!inner (
        id,
        amount,
        status,
        subscriptions!inner (
          customer_name,
          plan_name
        )
      )
    `)
    .eq('alert_type', 'OVERDUE')
    .eq('is_dismissed', true)
    .order('dismissed_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((alert: any) => ({
    id: alert.id,
    invoice_id: alert.invoice_id,
    alert_type: alert.alert_type,
    due_date: alert.due_date,
    created_at: alert.created_at,
    dismissed_at: alert.dismissed_at,

    invoice: {
      id: alert.invoices.id,
      amount: alert.invoices.amount,
      status: alert.invoices.status,

      subscription: {
        customer_name:
          alert.invoices.subscriptions.customer_name,
        plan_name:
          alert.invoices.subscriptions.plan_name,
      },
    },
  }))
}

export async function getOverdueAlertCount() {
  const alerts = await getOverdueAlerts()

  return alerts.length
}

export async function dismissOverdueAlert(
  alertId: string
) {
  const { supabase, user } =
    await requireBillingAdmin()

  const {
    data: alert,
    error: alertError,
  } = await supabase
    .from('alerts')
    .select('id, alert_type, is_dismissed')
    .eq('id', alertId)
    .single()

  if (alertError || !alert) {
    throw new Error('Alert not found.')
  }

  if (alert.alert_type !== 'OVERDUE') {
    throw new Error('This is not an overdue alert.')
  }

  if (alert.is_dismissed) {
    return {
      success: true,
    }
  }

  const { error } = await supabase
    .from('alerts')
    .update({
      is_dismissed: true,
      dismissed_by: user.id,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
  }
}