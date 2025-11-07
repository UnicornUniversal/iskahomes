import { NextResponse } from 'next/server'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/sendgrid'
import sgMail from '@sendgrid/mail'

export async function POST(request) {
  try {
    const { email, name, emailType } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      )
    }

    let result

    switch (emailType) {
      case 'verification':
        // Send verification email
        const testToken = 'test-token-' + Date.now()
        result = await sendVerificationEmail(email, name, testToken)
        break

      case 'welcome':
        // Send welcome email
        result = await sendWelcomeEmail(email, name, 'property_seeker')
        break

      case 'test':
        // Send simple test email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME
          },
          subject: 'SendGrid Test Email - Iska Homes',
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                  <h1 style="color: #2563eb;">🎉 Test Email Successful!</h1>
                  <p style="font-size: 16px; color: #333;">Hi ${name},</p>
                  <p style="font-size: 16px; color: #333;">
                    This is a test email from Iska Homes. If you're seeing this, your SendGrid configuration is working correctly!
                  </p>
                  <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">
                      <strong>✅ SendGrid is configured correctly</strong>
                    </p>
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    Sent at: ${new Date().toLocaleString()}
                  </p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    Iska Homes - Property Management Platform
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
            Test Email Successful!
            
            Hi ${name},
            
            This is a test email from Iska Homes. If you're seeing this, your SendGrid configuration is working correctly!
            
            Sent at: ${new Date().toLocaleString()}
            
            Iska Homes - Property Management Platform
          `
        }
        
        await sgMail.send(msg)
        result = { success: true }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email sent successfully to ${email}!`
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
    
    // Check for specific SendGrid errors
    if (error.response && error.response.body) {
      const sendGridError = error.response.body.errors?.[0]
      if (sendGridError) {
        return NextResponse.json(
          { 
            error: `SendGrid Error: ${sendGridError.message}`,
            details: sendGridError
          },
          { status: error.code || 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

