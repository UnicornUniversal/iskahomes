import { NextResponse } from 'next/server'

function normalizeHost(rawHost) {
  if (!rawHost) return null;
  let host = String(rawHost).trim();
  // If only domain is provided, add scheme
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `https://${host}`;
  }
  // Remove trailing dots and slashes
  while (host.endsWith('.')) host = host.slice(0, -1);
  while (host.endsWith('/')) host = host.slice(0, -1);
  try {
    const url = new URL(host);
    if (!url.hostname.includes('posthog')) return null;
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    // Read envs directly here (supports .env or .env.local)
    const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_PERSONAL_API_KEY
    const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID
    const RAW_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const HOST = normalizeHost(RAW_HOST)

    console.log('=== PostHog API Test ===')
    console.log('POSTHOG_PERSONAL_API_KEY:', PERSONAL_API_KEY ? 'Set' : 'Not set')
    console.log('POSTHOG_PROJECT_ID:', PROJECT_ID || 'Not set')
    console.log('POSTHOG_HOST (raw):', RAW_HOST)
    console.log('POSTHOG_HOST (normalized):', HOST)

    // Test 1: Check if PostHog is configured
    const isConfigured = !!(PERSONAL_API_KEY && PROJECT_ID && HOST)
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'PostHog not configured',
        details: {
          personalApiKey: PERSONAL_API_KEY ? 'Set' : 'Not set',
          projectId: PROJECT_ID ? 'Set' : 'Not set',
          hostRaw: RAW_HOST || 'Not set',
          hostNormalized: HOST || 'invalid',
          message: 'Please set POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, and POSTHOG_HOST (or NEXT_PUBLIC_POSTHOG_HOST) in your env file'
        }
      }, { status: 400 })
    }

    // Test 2: RAW requests directly to PostHog Events API
    console.log('Testing PostHog API connection (events endpoint)...')
    
    try {
      // Fetch latest $pageview events (limit 5)
      const eventsUrl = `${HOST}/api/projects/${PROJECT_ID}/events/?event=%24pageview&limit=5&orderBy=%5B%22-timestamp%22%5D`
      const response = await fetch(eventsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PERSONAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('PostHog API Response Status:', response.status)
      console.log('PostHog API Response Headers:', Object.fromEntries(response.headers.entries()))
      
      const rawData = await response.json()
      console.log('=== RAW POSTHOG RESPONSE ===')
      console.log(JSON.stringify(rawData, null, 2))
      console.log('=== END RAW RESPONSE ===')

      return NextResponse.json({
        success: true,
        message: 'PostHog API test successful (events endpoint). Raw response logged to console.',
        data: {
          configuration: {
            personalApiKey: 'Set',
            projectId: PROJECT_ID,
            host: HOST,
            configured: true
          },
          testResults: {
            endpoint: 'events',
            rawPostHogResponse: rawData,
            responseStatus: response.status,
            requestUrl: eventsUrl
          },
          timestamp: new Date().toISOString()
        }
      })

    } catch (apiError) {
      console.error('PostHog API Error:', apiError)
      
      return NextResponse.json({
        success: false,
        error: 'PostHog API connection failed',
        details: {
          message: apiError.message,
          stack: apiError.stack,
          configuration: {
            apiKey: 'Set',
            host: HOST,
            configured: true
          }
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('PostHog test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
