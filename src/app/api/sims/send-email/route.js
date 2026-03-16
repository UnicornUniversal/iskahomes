import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function POST(request) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'to, subject, and message are required' },
        { status: 400 }
      )
    }

    const sendGridApiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL
    const fromName = process.env.SENDGRID_FROM_NAME || 'Iska Homes'

    if (!sendGridApiKey || !fromEmail) {
      return NextResponse.json(
        {
          error:
            'SendGrid is not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.'
        },
        { status: 500 }
      )
    }

    sgMail.setApiKey(sendGridApiKey)

    await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${message}</div>`
    })

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to} via SendGrid.`
    })
  } catch (error) {
    const exactError = {
      message: error?.message,
      code: error?.code,
      statusCode: error?.response?.statusCode || error?.code,
      responseBody: error?.response?.body,
      responseHeaders: error?.response?.headers,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }

    console.error('❌ SendGrid email send failed (exact error):', exactError)

    return NextResponse.json(
      {
        error: 'Failed to send email through SendGrid.',
        details: exactError
      },
      { status: 500 }
    )
  }
}
