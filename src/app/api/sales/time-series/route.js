import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')
    const range = searchParams.get('range') || 'month' // week, month, year

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    let finalUserId = userId

    // Get user_id from slug if needed
    if (slug && !userId) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', slug)
        .single()

      if (devError || !developer) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }

      finalUserId = developer.developer_id
    }

    // OPTIMIZED: Fetch only needed fields
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_date, sale_price')
      .eq('user_id', finalUserId)
      .not('sale_date', 'is', null)
      .order('sale_date', { ascending: true })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales', details: salesError.message },
        { status: 500 }
      )
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          labels: [],
          sales: [],
          revenue: []
        }
      })
    }

    // Group sales by time period
    const now = new Date()
    let labels = []
    let salesCount = []
    let revenue = []

    // Group sales by time period (optimized)
    if (range === 'week') {
      // Last 7 days
      const weekData = {}
      const dateKeys = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0]
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
        labels.push(dayLabel)
        dateKeys.push(dateKey)
        weekData[dateKey] = { count: 0, revenue: 0 }
      }

      sales.forEach(sale => {
        const saleDate = sale.sale_date.split('T')[0]
        if (weekData[saleDate]) {
          weekData[saleDate].count++
          weekData[saleDate].revenue += (sale.sale_price || 0)
        }
      })

      dateKeys.forEach(dateKey => {
        salesCount.push(weekData[dateKey].count)
        revenue.push(weekData[dateKey].revenue)
      })

    } else if (range === 'month') {
      // Last 4 weeks (current month)
      const monthData = {}
      const weekRanges = []
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (i * 7))
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        labels.push(`Week ${4 - i}`)
        weekRanges.push({
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          count: 0,
          revenue: 0
        })
      }

      sales.forEach(sale => {
        const saleDate = sale.sale_date.split('T')[0]
        weekRanges.forEach(week => {
          if (saleDate >= week.start && saleDate <= week.end) {
            week.count++
            week.revenue += (sale.sale_price || 0)
          }
        })
      })

      weekRanges.forEach(week => {
        salesCount.push(week.count)
        revenue.push(week.revenue)
      })

    } else if (range === 'year') {
      // Last 12 months
      const monthData = {}
      const monthKeys = []
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthLabel = month.toLocaleDateString('en-US', { month: 'short' })
        labels.push(monthLabel)
        
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
        monthKeys.push(monthKey)
        monthData[monthKey] = { count: 0, revenue: 0 }
      }

      sales.forEach(sale => {
        const saleDate = new Date(sale.sale_date)
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        if (monthData[monthKey]) {
          monthData[monthKey].count++
          monthData[monthKey].revenue += (sale.sale_price || 0)
        }
      })

      monthKeys.forEach(monthKey => {
        salesCount.push(monthData[monthKey].count)
        revenue.push(monthData[monthKey].revenue)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        labels,
        sales: salesCount,
        revenue
      }
    })

  } catch (error) {
    console.error('Sales time series fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

