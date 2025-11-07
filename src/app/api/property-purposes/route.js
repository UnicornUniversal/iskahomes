import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache } from 'react'

// Cached function to fetch property purposes
const getCachedPropertyPurposes = cache(async () => {
  const { data, error } = await supabaseAdmin
    .from('property_purposes')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
})

// GET - Fetch all active property purposes (public route)
export async function GET() {
  try {
    const data = await getCachedPropertyPurposes()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
