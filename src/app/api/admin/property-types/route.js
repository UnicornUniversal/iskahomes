import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'
import { invalidatePropertyTypesCache } from '@/lib/cacheInvalidation'
import { cachePropertyTypes, getCachedPropertyTypes } from '@/lib/cache'

// Cached function to fetch property types from database
const getCachedPropertyTypesFromDB = cache(async () => {
  const { data, error } = await supabaseAdmin
    .from('property_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
})

// GET - Fetch all property types
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reconcile = searchParams.get('reconcile') === 'true'

    // If reconcile is requested, fetch from DB and update Redis
    if (reconcile) {
      const { data, error } = await supabaseAdmin
        .from('property_types')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Update Redis cache
      try {
        await cachePropertyTypes(data)
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
      const cachedData = await getCachedPropertyTypes()
      if (cachedData) {
        return NextResponse.json({ data: cachedData, cached: true })
      }
    } catch (redisError) {
      console.error('Redis fetch error:', redisError)
      // Fall through to database fetch
    }

    // Fallback to database if cache miss
    const data = await getCachedPropertyTypesFromDB()
    
    // Cache the data for future requests
    try {
      await cachePropertyTypes(data)
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }
    
    return NextResponse.json({ data, cached: false })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new property type
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_types')
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

    // Invalidate cache after successful creation
    invalidatePropertyTypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_types')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyTypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property type created successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update property type
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, active } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('property_types')
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

    // Invalidate cache after successful update
    invalidatePropertyTypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_types')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyTypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ data, message: 'Property type updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete property type
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('property_types')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache after successful deletion
    invalidatePropertyTypesCache()

    // Update Redis cache - fetch all and re-cache
    try {
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from('property_types')
        .select('*')
        .order('name', { ascending: true })
      
      if (!fetchError && allData) {
        await cachePropertyTypes(allData)
      }
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails
    }

    return NextResponse.json({ message: 'Property type deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
