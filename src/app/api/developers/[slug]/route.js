import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Developer slug is required' }, { status: 400 })
    }

    // Fetch developer data by slug
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !developer) {
      console.error('Error fetching developer:', error)
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    return NextResponse.json(developer)
  } catch (error) {
    console.error('Error fetching developer:', error)
    return NextResponse.json({ error: 'Failed to fetch developer' }, { status: 500 })
  }
}