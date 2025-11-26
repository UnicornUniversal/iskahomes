import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')

    if (!userId && !slug) {
      return NextResponse.json(
        { error: 'User ID or slug is required' },
        { status: 400 }
      )
    }

    let finalUserId = userId

    // If slug provided, get user_id from developers table
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

    // Use SQL SUM aggregation directly in the database via RPC function
    const { data: result, error: queryError } = await supabaseAdmin
      .rpc('get_sales_revenue_summary', { p_user_id: finalUserId })

    if (queryError) {
      console.error('Error calling RPC function:', queryError)
      console.error('Note: You need to run create_sales_revenue_function.sql to create the database function')
      return NextResponse.json(
        { 
          error: 'Database function not found', 
          details: 'Please run create_sales_revenue_function.sql to create the get_sales_revenue_summary function',
          message: queryError.message 
        },
        { status: 500 }
      )
    }

    // RPC function returns the aggregated result with SQL SUM
    const totalRevenue = result?.[0]?.total_revenue || result?.total_revenue || 0
    const totalSales = result?.[0]?.total_sales || result?.total_sales || 0

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: totalRevenue,
        totalSales: totalSales
      }
    })

  } catch (error) {
    console.error('Sales revenue fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

