import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'

// Cached function to fetch property categories
const getCachedPropertyCategories = cache(async () => {
  const { data, error } = await supabaseAdmin
    .from('property_categories')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
})

// GET - Fetch all active property categories (public route)
export async function GET() {
  try {
    const data = await getCachedPropertyCategories()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}