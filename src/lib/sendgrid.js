import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(email, name, verificationToken) {
  const verificationLink = `${process.env.FRONTEND_LINK}/verify-email?token=${verificationToken}`
  
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: 'Verify Your Iska Homes Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to Iska Homes!</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
                        Hi ${name},
                      </p>
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 30px;">
                        Thank you for signing up! We're excited to have you join our community. 
                        Please verify your email address to get started.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${verificationLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: #ffffff; text-decoration: none; padding: 15px 40px; 
                                      border-radius: 6px; font-weight: bold; font-size: 16px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="font-size: 12px; color: #999999; word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 4px;">
                        ${verificationLink}
                      </p>
                      
                      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
                        This link will expire in 24 hours for security reasons.
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
                        If you didn't create an account, please ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
      Welcome to Iska Homes!
      
      Hi ${name},
      
      Thank you for signing up! Please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
      
      © ${new Date().getFullYear()} Iska Homes. All rights reserved.
    `
  }
  
  try {
    await sgMail.send(msg)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    if (error.response) {
      console.error('SendGrid error details:', error.response.body)
    }
    return { success: false, error: error.message }
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email, name, userType) {
  const dashboardLink = `${process.env.FRONTEND_LINK}/home/signin`
  
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: 'Welcome to Iska Homes - Your Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Account Verified!</h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
                        Hi ${name},
                      </p>
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 30px;">
                        Your email has been verified successfully! Welcome to Iska Homes.
                      </p>
                      
                      ${userType === 'property_seeker' ? `
                        <h3 style="color: #667eea; margin-bottom: 15px;">Get Started:</h3>
                        <ul style="font-size: 14px; color: #666666; line-height: 1.8;">
                          <li>Browse thousands of properties</li>
                          <li>Save your favorite listings</li>
                          <li>Set up property alerts</li>
                          <li>Connect with verified agents</li>
                        </ul>
                      ` : ''}
                      
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${dashboardLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: #ffffff; text-decoration: none; padding: 15px 40px; 
                                      border-radius: 6px; font-weight: bold; font-size: 16px;">
                              Sign In Now
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                      <p style="font-size: 12px; color: #999999; margin: 0;">
                        © ${new Date().getFullYear()} Iska Homes. All rights reserved.
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
  
  try {
    await sgMail.send(msg)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}

export default sgMail

