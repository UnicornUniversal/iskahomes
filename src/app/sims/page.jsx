'use client'

import React, { useState } from 'react'
// import BackfillLeads from '../components/test/BackfillLeads'

const SimsPage = () => {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('Test SMS from Iska Homes')
  const [status, setStatus] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('SendGrid test email from Iska Homes')
  const [emailMessage, setEmailMessage] = useState('Hello, this is a test email from Iska Homes via SendGrid.')
  const [emailStatus, setEmailStatus] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const handleSendSms = async (event) => {
    event.preventDefault()
    setIsSending(true)
    setStatus('')

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send SMS')
      }

      setStatus('SMS sent successfully via mNotify.')
    } catch (error) {
      setStatus(error.message || 'SMS request failed')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendEmail = async (event) => {
    event.preventDefault()
    setIsSendingEmail(true)
    setEmailStatus('')

    try {
      const response = await fetch('/api/sims/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: emailMessage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || data?.details?.message || 'Failed to send email')
      }

      setEmailStatus('Email sent successfully via SendGrid.')
    } catch (error) {
      setEmailStatus(error.message || 'Email request failed')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="max-w-xl space-y-10 p-6">
      {/* <BackfillLeads /> */}
      <section>
        <h1 className="mb-4 text-2xl font-semibold">mNotify SMS Test</h1>
        <form onSubmit={handleSendSms} className="space-y-4">
          <input
            type="text"
            placeholder="To number (e.g. +2348012345678)"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="w-full rounded border p-2"
            required
          />
          <p className="text-sm text-gray-600">
            API uses <code>MNOTIFY_API_KEY</code>. Sender defaults to{' '}
            <code>MNOTIFY_SENDER_ID</code> (or "mNotify" if not set).
          </p>
          <textarea
            placeholder="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded border p-2"
            rows={4}
            required
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {isSending ? 'Sending...' : 'Send SMS'}
          </button>
        </form>
        {status && <p className="mt-4 text-sm">{status}</p>}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">SendGrid Email Test</h2>
        <form onSubmit={handleSendEmail} className="space-y-4">
          <input
            type="email"
            placeholder="To email (e.g. test@example.com)"
            value={emailTo}
            onChange={(event) => setEmailTo(event.target.value)}
            className="w-full rounded border p-2"
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={emailSubject}
            onChange={(event) => setEmailSubject(event.target.value)}
            className="w-full rounded border p-2"
            required
          />
          <textarea
            placeholder="Email message"
            value={emailMessage}
            onChange={(event) => setEmailMessage(event.target.value)}
            className="w-full rounded border p-2"
            rows={6}
            required
          />
          <p className="text-sm text-gray-600">
            API uses <code>SENDGRID_API_KEY</code>, <code>SENDGRID_FROM_EMAIL</code>, and{' '}
            <code>SENDGRID_FROM_NAME</code>.
          </p>
          <button
            type="submit"
            disabled={isSendingEmail}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {isSendingEmail ? 'Sending...' : 'Send Email'}
          </button>
        </form>
        {emailStatus && <p className="mt-4 text-sm">{emailStatus}</p>}
      </section>
    </div>
  )
}

export default SimsPage
