import { NextResponse } from 'next/server'
import { buildOrgReport } from '@/lib/orgReport'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const accountType = searchParams.get('accountType') || 'developer'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (accountType !== 'developer' && accountType !== 'agency') {
    return NextResponse.json({ error: 'accountType must be developer or agency' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    data: buildOrgReport({ accountType, from, to }),
  })
}
