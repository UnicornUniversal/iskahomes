import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')
    const range = searchParams.get('range') // week, month, year (for backward compatibility)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

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

    // Build query with date filters if provided
    let query = supabaseAdmin
      .from('sales_listings')
      .select('sale_date, sale_price')
      .eq('user_id', finalUserId)
      .not('sale_date', 'is', null)

    // Apply date range filter if provided
    if (dateFrom) {
      query = query.gte('sale_date', dateFrom)
    }
    if (dateTo) {
      // Add time to end of day for inclusive end date
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      query = query.lte('sale_date', endDate.toISOString())
    }

    // OPTIMIZED: Fetch only needed fields
    const { data: sales, error: salesError } = await query.order('sale_date', { ascending: true })

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

    // Determine grouping strategy
    const useCustomRange = dateFrom && dateTo
    const startDate = dateFrom ? new Date(dateFrom) : null
    const endDate = dateTo ? new Date(dateTo) : null
    
    // Calculate days difference for custom range
    let daysDiff = 0
    if (useCustomRange && startDate && endDate) {
      daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    }

    // Group sales by time period (optimized)
    if (useCustomRange && daysDiff > 0) {
      // Custom date range - group by day if <= 90 days, by week if <= 365 days, by month if > 365 days
      if (daysDiff <= 90) {
        // Group by day
        const dayData = {}
        const dateKeys = []
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]
          const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          labels.push(dayLabel)
          dateKeys.push(dateKey)
          dayData[dateKey] = { count: 0, revenue: 0 }
        }

        sales.forEach(sale => {
          const saleDate = sale.sale_date.split('T')[0]
          if (dayData[saleDate]) {
            dayData[saleDate].count++
            dayData[saleDate].revenue += (sale.sale_price || 0)
          }
        })

        dateKeys.forEach(dateKey => {
          salesCount.push(dayData[dateKey].count)
          revenue.push(dayData[dateKey].revenue)
        })
      } else if (daysDiff <= 365) {
        // Group by week
        const weekData = {}
        const weekKeys = []
        
        let currentWeekStart = new Date(startDate)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()) // Start of week
        
        while (currentWeekStart <= endDate) {
          const weekEnd = new Date(currentWeekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          
          const weekKey = `${currentWeekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`
          const weekLabel = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          labels.push(weekLabel)
          weekKeys.push(weekKey)
          weekData[weekKey] = { start: new Date(currentWeekStart), end: new Date(weekEnd), count: 0, revenue: 0 }
          
          currentWeekStart.setDate(currentWeekStart.getDate() + 7)
        }

        sales.forEach(sale => {
          const saleDate = new Date(sale.sale_date)
          weekKeys.forEach(weekKey => {
            const week = weekData[weekKey]
            if (saleDate >= week.start && saleDate <= week.end) {
              week.count++
              week.revenue += (sale.sale_price || 0)
            }
          })
        })

        weekKeys.forEach(weekKey => {
          salesCount.push(weekData[weekKey].count)
          revenue.push(weekData[weekKey].revenue)
        })
      } else {
        // Group by month
        const monthData = {}
        const monthKeys = []
        
        let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        
        while (currentMonth <= endDate) {
          const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          labels.push(monthLabel)
          
          const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
          monthKeys.push(monthKey)
          monthData[monthKey] = { count: 0, revenue: 0 }
          
          currentMonth.setMonth(currentMonth.getMonth() + 1)
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
    } else if (range === 'week') {
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

