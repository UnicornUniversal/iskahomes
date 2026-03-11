import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { to, message, sender } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: 'to and message are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.MNOTIFY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MNOTIFY_API_KEY must be set' },
        { status: 500 }
      )
    }

    const normalizedRecipient = String(to).replace(/\D/g, '')
    if (!normalizedRecipient) {
      return NextResponse.json(
        { error: 'Recipient phone number is invalid' },
        { status: 400 }
      )
    }

    const senderId = sender || process.env.MNOTIFY_SENDER_ID || 'mNotify'
    const response = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: [normalizedRecipient],
        sender: senderId,
        message,
        is_schedule: false,
        schedule_date: ''
      })
    })

    const rawBody = await response.text()
    let data = null
    try {
      data = rawBody ? JSON.parse(rawBody) : null
    } catch {
      data = { rawBody }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            'mNotify request failed while sending SMS',
          providerResponse: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      provider: 'mNotify',
      sender: senderId,
      recipient: normalizedRecipient,
      providerResponse: data
    })
  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
