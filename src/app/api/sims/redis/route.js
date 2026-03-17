import { NextResponse } from 'next/server'
import { setKey, getKey } from '@/lib/redis'

export async function POST(request) {
  try {
    const body = await request.json()
    const { key, value, ttl } = body || {}

    if (!key || String(key).trim() === '') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const normalizedKey = String(key).trim()
    const normalizedValue = value ?? ''
    const ttlNumber = Number(ttl)
    const options = Number.isFinite(ttlNumber) && ttlNumber > 0 ? { ttl: ttlNumber } : {}

    const saved = await setKey(normalizedKey, normalizedValue, options)
    if (!saved) {
      return NextResponse.json(
        { error: 'Redis is unavailable. Could not save key/value.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Key/value saved successfully',
      data: {
        key: normalizedKey,
        value: normalizedValue,
        ttl: options.ttl || null
      }
    })
  } catch (error) {
    console.error('Redis sims POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key || String(key).trim() === '') {
      return NextResponse.json({ error: 'Key query parameter is required' }, { status: 400 })
    }

    const normalizedKey = String(key).trim()
    const value = await getKey(normalizedKey)

    if (value === null) {
      return NextResponse.json(
        { error: 'Key not found or Redis unavailable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        key: normalizedKey,
        value
      }
    })
  } catch (error) {
    console.error('Redis sims GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
