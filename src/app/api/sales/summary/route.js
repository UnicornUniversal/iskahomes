import { NextResponse } from 'next/server'
import {
  buildCommissionSummary,
  buildTaxonomySummary,
  fetchActiveListingsForCommission,
  fetchSalesRowsForAccount
} from '@/lib/salesAnalytics'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')
    const accountType = searchParams.get('account_type') || 'developer'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    const salesData = await fetchSalesRowsForAccount({
      accountType,
      accountId: userId,
      slug,
      dateFrom,
      dateTo
    })

    const activeListings = await fetchActiveListingsForCommission({
      accountType,
      accountId: userId
    })

    const commission = buildCommissionSummary(salesData, activeListings)

    if (!salesData.length) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            total_sales: 0,
            total_revenue: 0,
            by_type: { sold: { count: 0, revenue: 0 }, rented: { count: 0, revenue: 0 } },
            by_source: {},
            by_purpose: {},
            by_type_property: {},
            by_category: {},
            by_subtype: {},
            commission
          }
        }
      })
    }

    const taxonomySummary = await buildTaxonomySummary(salesData)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...taxonomySummary,
          commission
        }
      }
    })
  } catch (error) {
    console.error('Sales summary fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
