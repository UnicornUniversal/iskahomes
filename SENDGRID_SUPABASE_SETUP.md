# SendGrid + Supabase Integration Guide

## Overview

This guide shows how to integrate **SendGrid** for email delivery while using **Supabase Auth** for authentication.

---

## 🔐 Authentication Strategy

**You NEED passwords in Supabase Auth because:**
- Supabase Auth handles password hashing (bcrypt)
- Supabase Auth manages user sessions and JWT tokens
- SendGrid only **delivers emails** (not authentication)

**Flow:**
```
User Signs Up → Supabase creates auth.users record → 
SendGrid sends verification email → User clicks link → 
Supabase verifies email → User can log in
```

---

## 📧 SendGrid Setup

### 1. Get SendGrid API Key

1. Sign up at [SendGrid](https://sendgrid.com)
2. Go to **Settings** → **API Keys**
3. Create a new API key with **Mail Send** permissions
4. Copy the API key

### 2. Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Verify a single sender email OR
3. Authenticate your domain

### 3. Add Environment Variables

Add to your `.env.local`:

```env
# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
FRONTEND_LINK=http://localhost:3000

# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Iska Homes

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 🔧 Supabase Configuration

### Option 1: Use Supabase Auth with Custom Email Template (Recommended)

**Supabase can use SendGrid as the SMTP provider!**

#### Configure Supabase to use SendGrid SMTP:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Go to **Settings** → **Auth** → **SMTP Settings**
4. Enable custom SMTP and add:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: YOUR_SENDGRID_API_KEY
Sender Email: noreply@yourdomain.com
Sender Name: Iska Homes
```

5. Customize email templates for:
   - Confirmation email
   - Password reset
   - Magic link
   - Email change

**Benefits:**
- ✅ Supabase handles auth logic
- ✅ SendGrid delivers emails
- ✅ No custom code needed for basic flows
- ✅ Built-in rate limiting and security

---

### Option 2: Custom Email Sending (Full Control)

Use this if you need custom email templates with your branding.

We'll create API routes that:
1. Use Supabase Auth for user management
2. Use SendGrid API for custom email sending

---

## 📝 Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @sendgrid/mail
```

### Step 2: Create SendGrid Utility

Create `src/lib/sendgrid.js`:

```javascript
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
    console.log('✅ Verification email sent to:', email)
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
  const dashboardLink = `${process.env.FRONTEND_LINK}/signin`
  
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
                      
                      ${userType === 'seeker' ? `
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
                              Go to Dashboard
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
    console.log('✅ Welcome email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, name, resetToken) {
  const resetLink = `${process.env.FRONTEND_LINK}/reset-password?token=${resetToken}`
  
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: 'Reset Your Iska Homes Password',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-bottom: 20px;">Password Reset Request</h2>
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
                        Hi ${name},
                      </p>
                      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 30px;">
                        We received a request to reset your password. Click the button below to create a new password:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background-color: #dc2626; 
                                      color: #ffffff; text-decoration: none; padding: 15px 40px; 
                                      border-radius: 6px; font-weight: bold; font-size: 16px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
                        This link will expire in 1 hour for security reasons.
                      </p>
                      
                      <p style="font-size: 14px; color: #dc2626; line-height: 1.6; margin-top: 20px; font-weight: bold;">
                        If you didn't request a password reset, please ignore this email or contact support if you're concerned.
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
    console.log('✅ Password reset email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error)
    return { success: false, error: error.message }
  }
}

export default sgMail
```

---

## 🎯 Next Steps

1. ✅ Run the SQL file to create tables
2. ✅ Add environment variables
3. ✅ Install `@sendgrid/mail`
4. ✅ Create SendGrid utility file
5. ⏳ Update signup API route (next step)
6. ⏳ Create email verification API route
7. ⏳ Test the flow

---

## 📚 Resources

- [SendGrid Node.js Documentation](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Recommendation:** Use **Option 1** (Supabase Auth with SendGrid SMTP) for simplicity, then move to custom emails if you need more control.

