'use client'

import React, { useState } from 'react'
// import BackfillLeads from '../components/test/BackfillLeads'

const SimsPage = () => {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('Test SMS from Iska Homes')
  const [status, setStatus] = useState('')
  const [isSending, setIsSending] = useState(false)

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

  return (
    <div className="max-w-xl p-6">
      {/* <BackfillLeads /> */}
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
    </div>
  )
}

export default SimsPage
