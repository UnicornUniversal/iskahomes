import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(request) {
  try {
    const { fullName, email, phone, inquiryType, subject, message } = await request.json()

    if (!fullName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Full name, email, subject, and message are required.' },
        { status: 400 }
      )
    }

    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      return NextResponse.json(
        { error: 'SendGrid is not configured for contact messages.' },
        { status: 500 }
      )
    }

    const toEmail = process.env.SENDGRID_CONTACT_TO_EMAIL || process.env.SENDGRID_FROM_EMAIL
    const fromName = process.env.SENDGRID_FROM_NAME || 'Iska Homes'

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const safeFullName = escapeHtml(fullName)
    const safeEmail = escapeHtml(email)
    const safePhone = escapeHtml(phone || 'Not provided')
    const safeInquiryType = escapeHtml(inquiryType || 'General inquiry')
    const safeSubject = escapeHtml(subject)
    const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')

    await sgMail.send({
      to: toEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: fromName,
      },
      replyTo: {
        email,
        name: fullName,
      },
      subject: `Contact form: ${subject}`,
      text: [
        'New contact form submission from Iska Homes website.',
        '',
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        `Inquiry Type: ${inquiryType || 'General inquiry'}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #16313a; line-height: 1.6;">
          <h2 style="margin-bottom: 16px; color: #17637C;">New contact form submission</h2>
          <p><strong>Name:</strong> ${safeFullName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          <p><strong>Inquiry Type:</strong> ${safeInquiryType}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="margin-top: 24px;">
            <p style="margin-bottom: 8px;"><strong>Message:</strong></p>
            <div style="padding: 16px; background: #f6f9fa; border-radius: 12px;">${safeMessage}</div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    })
  } catch (error) {
    console.error('Contact form email error:', error)

    return NextResponse.json(
      { error: 'Failed to send your message. Please try again.' },
      { status: 500 }
    )
  }
}
