import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOverdueAlertCount } from '@/app/alerts/actions'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { isAdmin: false, count: 0 },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'BILLING_ADMIN') {
      return NextResponse.json({
        isAdmin: false,
        count: 0,
      })
    }

    const count = await getOverdueAlertCount()

    return NextResponse.json({
      isAdmin: true,
      count,
    })
  } catch {
    return NextResponse.json(
      { isAdmin: false, count: 0 },
      { status: 500 }
    )
  }
}