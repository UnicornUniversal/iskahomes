import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

function buildDuplicateName(originalName) {
  const safeName = String(originalName || 'Untitled Package').trim() || 'Untitled Package'
  return `${safeName} (Copy)`
}

// POST - Duplicate an existing subscription package
export async function POST(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch source package
    const { data: sourcePackage, error: sourceError } = await supabaseAdmin
      .from('subscriptions_package')
      .select('*')
      .eq('id', id)
      .single()

    if (sourceError) {
      if (sourceError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }
      console.error('Database error (source fetch):', sourceError)
      return NextResponse.json({
        error: 'Failed to load package for duplication',
        details: sourceError.message
      }, { status: 500 })
    }

    // Ensure the duplicate name is unique-ish
    let duplicateName = buildDuplicateName(sourcePackage.name)
    const { data: existingName } = await supabaseAdmin
      .from('subscriptions_package')
      .select('id')
      .eq('name', duplicateName)
      .limit(1)
      .maybeSingle()

    if (existingName?.id) {
      duplicateName = `${duplicateName} ${Date.now()}`
    }

    const insertPayload = {
      name: duplicateName,
      description: sourcePackage.description,
      features: sourcePackage.features || [],
      api_limits: sourcePackage.api_limits || {},
      local_currency: sourcePackage.local_currency || 'GHS',
      local_currency_price: sourcePackage.local_currency_price ?? 0,
      international_currency: sourcePackage.international_currency || 'USD',
      international_currency_price: sourcePackage.international_currency_price ?? 0,
      duration: sourcePackage.duration,
      span: sourcePackage.span,
      display_text: sourcePackage.display_text,
      ideal_duration: sourcePackage.ideal_duration,
      user_type: sourcePackage.user_type,
      is_active: sourcePackage.is_active !== false,
      total_amount_usd: sourcePackage.total_amount_usd ?? null,
      total_amount_ghs: sourcePackage.total_amount_ghs ?? null
    }

    const { data: duplicatedPackage, error: insertError } = await supabaseAdmin
      .from('subscriptions_package')
      .insert([insertPayload])
      .select()
      .single()

    if (insertError) {
      console.error('Database error (duplicate insert):', insertError)
      return NextResponse.json({
        error: 'Failed to duplicate package',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: duplicatedPackage,
      message: 'Package duplicated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

