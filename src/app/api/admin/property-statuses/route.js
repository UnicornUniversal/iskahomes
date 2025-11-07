import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cachePropertyStatuses, getCachedPropertyStatuses } from '@/lib/cache'

// GET - Fetch all property statuses
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reconcile = searchParams.get('reconcile') === 'true'

    // If reconcile is requested, fetch from DB and update Redis
    if (reconcile) {
      const { data, error } = await supabaseAdmin
        .from('property_status')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Update Redis cache
      try {
        await cachePropertyStatuses(data)
      } catch (redisError) {
        console.error('Redis cache update error:', redisError)
        // Continue even if Redis fails
      }

      return NextResponse.json({ 
        data,
        message: 'Data reconciled and cached successfully'
      })
    }

    // Try to get from Redis first
    try {
      const cachedData = await getCachedPropertyStatuses()
      if (cachedData) {
        return NextResponse.json({ data: cachedData, cached: true })
      }
    } catch (redisError) {
      console.error('Redis fetch error:', redisError)
      // Fall through to database fetch
    }

    // Fallback to database if cache miss
    const { data, error } = await supabaseAdmin
      .from('property_status')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cache the data for future requests
    try {
      await cachePropertyStatuses(data)
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, cached: false })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new property status
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_status')
      .insert({
        name,
        description,
        active: active !== undefined ? active : true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_status')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyStatuses(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property status created successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update property status
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, active } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_status')
      .update({
        name,
        description,
        active: active !== undefined ? active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_status')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyStatuses(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property status updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete property status
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('property_status')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_status')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyStatuses(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ message: 'Property status deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
