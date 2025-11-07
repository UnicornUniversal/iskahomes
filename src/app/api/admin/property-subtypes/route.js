import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'
import { invalidatePropertySubtypesCache } from '@/lib/cacheInvalidation'
import { cachePropertySubtypes, getCachedPropertySubtypes } from '@/lib/cache'

// Cached function to fetch property subtypes from database
const getCachedPropertySubtypesFromDB = cache(async () => {
  const { data, error } = await supabaseAdmin
    .from('property_subtypes')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
})

// GET - Fetch all property subtypes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reconcile = searchParams.get('reconcile') === 'true'

    // If reconcile is requested, fetch from DB and update Redis
    if (reconcile) {
      const { data, error } = await supabaseAdmin
        .from('property_subtypes')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Update Redis cache
      try {
        await cachePropertySubtypes(data)
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
      const cachedData = await getCachedPropertySubtypes()
      if (cachedData) {
        return NextResponse.json({ data: cachedData, cached: true })
      }
    } catch (redisError) {
      console.error('Redis fetch error:', redisError)
      // Fall through to database fetch
    }

    // Fallback to database if cache miss
    const data = await getCachedPropertySubtypesFromDB()
    
    // Cache the data for future requests
    try {
      await cachePropertySubtypes(data)
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }
    
    return NextResponse.json({ data, cached: false })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new property subtype
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, property_type, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!property_type) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_subtypes')
      .insert({
        name,
        description,
        property_type,
        active: active !== undefined ? active : true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache after successful creation
    invalidatePropertySubtypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_subtypes')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertySubtypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property subtype created successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update property subtype
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, property_type, active } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    if (!property_type) {
      return NextResponse.json({ error: 'Property type is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_subtypes')
      .update({
        name,
        description,
        property_type,
        active: active !== undefined ? active : true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache after successful update
    invalidatePropertySubtypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_subtypes')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertySubtypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property subtype updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete property subtype
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('property_subtypes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache after successful deletion
    invalidatePropertySubtypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_subtypes')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertySubtypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ message: 'Property subtype deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
