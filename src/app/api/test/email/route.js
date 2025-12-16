import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { Resend } from 'resend'

// Helper function to create email HTML content
function createEmailHTML(email, message, provider, fromEmail) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📧 Test Email</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
                      This is a test email from Iska Homes to verify email functionality.
                    </p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                      <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0; font-weight: bold;">
                        Your Message:
                      </p>
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                        ${message.replace(/\n/g, '<br>')}
                      </p>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                        ✅ <strong>Email sent successfully!</strong> If you're reading this, ${provider} is working correctly.
                      </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
                      <strong>Test Details:</strong><br>
                      Sent to: ${email}<br>
                      Sent at: ${new Date().toLocaleString()}<br>
                      From: ${fromEmail}<br>
                      Provider: ${provider}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 12px; color: #999999; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} Iska Homes. All rights reserved.
                    </p>
                    <p style="font-size: 12px; color: #999999; margin: 0;">
                      This is a test email sent from the Iska Homes development environment.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

// Helper function to create email text content
function createEmailText(email, message, provider, fromEmail) {
  return `
    Test Email from Iska Homes
    
    This is a test email to verify email functionality.
    
    Your Message:
    ${message}
    
    ✅ Email sent successfully! If you're reading this, ${provider} is working correctly.
    
    Test Details:
    Sent to: ${email}
    Sent at: ${new Date().toLocaleString()}
    From: ${fromEmail}
    Provider: ${provider}
    
    © ${new Date().getFullYear()} Iska Homes. All rights reserved.
    This is a test email sent from the Iska Homes development environment.
  `
}

export async function POST(request) {
  try {
    const { email, message } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Determine FROM email and name
    // For SendGrid: use SENDGRID_FROM_EMAIL and SENDGRID_FROM_NAME
    // For Resend: prefer RESEND_FROM_NAME, fallback to SENDGRID_FROM_NAME
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL
    const sendGridFromName = process.env.SENDGRID_FROM_NAME || 'Iska Homes'
    const resendFromName = process.env.RESEND_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Iska Homes'

    // Try SendGrid first
    let sendGridSuccess = false
    let sendGridError = null

    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)

        const msg = {
          to: email,
          from: {
            email: sendGridFromEmail,
            name: sendGridFromName
          },
          subject: 'Test Email from Iska Homes',
          html: createEmailHTML(email, message, 'SendGrid', sendGridFromEmail),
          text: createEmailText(email, message, 'SendGrid', sendGridFromEmail)
        }

        await sgMail.send(msg)
        sendGridSuccess = true

        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${email} via SendGrid!`,
          provider: 'SendGrid',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('❌ SendGrid error:', error)
        sendGridError = error
        
        // Check for specific SendGrid errors
        if (error.response && error.response.body) {
          const sendGridErrorDetails = error.response.body.errors?.[0]
          if (sendGridErrorDetails) {
            console.error('SendGrid error details:', sendGridErrorDetails)
          }
        }
      }
    }

    // If SendGrid failed or not configured, try Resend
    if (!sendGridSuccess) {
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
          { 
            error: 'Both SendGrid and Resend are not configured',
            details: sendGridError ? `SendGrid failed: ${sendGridError.message}. Please set RESEND_API_KEY in your environment variables.` : 'Please set RESEND_API_KEY in your environment variables.',
            sendGridError: sendGridError?.message
          },
          { status: 500 }
        )
      }

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Resend requires the FROM email to be verified in their system
        // Gmail and other public email domains are not allowed - must use verified domain or onboarding@resend.dev
        let resendFromEmail = process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'onboarding@resend.dev'
        
        // Check if the email is from a public email provider (Gmail, Yahoo, Outlook, etc.)
        const publicEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com']
        const emailDomain = resendFromEmail.split('@')[1]?.toLowerCase()
        const isPublicEmail = publicEmailDomains.some(domain => emailDomain === domain)
        
        // If it's a public email domain, use Resend's default test email
        if (isPublicEmail && resendFromEmail !== 'onboarding@resend.dev') {
          console.warn(`⚠️ Resend doesn't allow public email domains. Using onboarding@resend.dev instead of ${resendFromEmail}`)
          resendFromEmail = 'onboarding@resend.dev'
        }

        const { data, error: resendError } = await resend.emails.send({
          from: `${resendFromName} <${resendFromEmail}>`,
          to: [email],
          subject: 'Test Email from Iska Homes',
          html: createEmailHTML(email, message, 'Resend', resendFromEmail),
          text: createEmailText(email, message, 'Resend', resendFromEmail)
        })

        if (resendError) {
          throw resendError
        }

        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${email} via Resend!${sendGridError ? ' (SendGrid failed, used Resend as fallback)' : ''}`,
          provider: 'Resend',
          sendGridFallback: !!sendGridError,
          sendGridError: sendGridError?.message,
          timestamp: new Date().toISOString(),
          resendId: data?.id,
          fromEmail: resendFromEmail
        })
      } catch (error) {
        console.error('❌ Resend error:', error)
        
        // Provide helpful error messages for common Resend errors
        let errorMessage = error.message || error.toString()
        let helpfulMessage = ''
        
        if (errorMessage.includes('domain is not verified') || errorMessage.includes('not verified')) {
          helpfulMessage = 'Resend requires a verified domain. For testing, use onboarding@resend.dev. For production, verify your domain at https://resend.com/domains'
        } else if (error.statusCode === 403) {
          helpfulMessage = 'Resend API key may not have the required permissions, or the sender email domain is not verified.'
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to send email with both SendGrid and Resend',
            details: errorMessage,
            helpfulMessage: helpfulMessage,
            sendGridError: sendGridError?.message,
            resendError: errorMessage,
            suggestion: 'Try using onboarding@resend.dev for testing, or verify your domain in Resend dashboard'
          },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send email',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

