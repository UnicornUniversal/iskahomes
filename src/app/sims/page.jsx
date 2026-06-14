'use client'

import React, { useState } from 'react'
// import BackfillLeads from '../components/test/BackfillLeads'

const SimsPage = () => {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('Test SMS from ISKA Homes')
  const [status, setStatus] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('SendGrid test email from ISKA Homes')
  const [emailMessage, setEmailMessage] = useState('Hello, this is a test email from ISKA Homes via SendGrid.')
  const [emailStatus, setEmailStatus] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [redisKey, setRedisKey] = useState('')
  const [redisValue, setRedisValue] = useState('')
  const [redisTtl, setRedisTtl] = useState('300')
  const [redisStatus, setRedisStatus] = useState('')
  const [isSavingRedis, setIsSavingRedis] = useState(false)
  const [isGettingRedis, setIsGettingRedis] = useState(false)

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

  const handleSaveRedis = async (event) => {
    event.preventDefault()
    setIsSavingRedis(true)
    setRedisStatus('')

    try {
      const response = await fetch('/api/sims/redis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: redisKey,
          value: redisValue,
          ttl: redisTtl ? Number(redisTtl) : undefined
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save Redis key/value')
      }

      setRedisStatus(`Saved key "${data?.data?.key}" successfully.`)
    } catch (error) {
      setRedisStatus(error.message || 'Redis save request failed')
    } finally {
      setIsSavingRedis(false)
    }
  }

  const handleGetRedis = async () => {
    if (!redisKey.trim()) {
      setRedisStatus('Please enter a key first.')
      return
    }

    setIsGettingRedis(true)
    setRedisStatus('')

    try {
      const response = await fetch(`/api/sims/redis?key=${encodeURIComponent(redisKey.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch Redis key')
      }

      setRedisValue(typeof data?.data?.value === 'string' ? data.data.value : JSON.stringify(data.data.value))
      setRedisStatus(`Fetched key "${data?.data?.key}" successfully.`)
    } catch (error) {
      setRedisStatus(error.message || 'Redis get request failed')
    } finally {
      setIsGettingRedis(false)
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

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Redis Key/Value Test</h2>
        <form onSubmit={handleSaveRedis} className="space-y-4">
          <input
            type="text"
            placeholder="Key"
            value={redisKey}
            onChange={(event) => setRedisKey(event.target.value)}
            className="w-full rounded border p-2"
            required
          />
          <textarea
            placeholder="Value"
            value={redisValue}
            onChange={(event) => setRedisValue(event.target.value)}
            className="w-full rounded border p-2"
            rows={4}
            required
          />
          <input
            type="number"
            placeholder="TTL in seconds (optional)"
            value={redisTtl}
            onChange={(event) => setRedisTtl(event.target.value)}
            className="w-full rounded border p-2"
            min={1}
          />
          <p className="text-sm text-gray-600">
            Uses <code>REDIS_HOST</code>, <code>REDIS_PORT</code>, and <code>REDIS_PASSWORD</code>.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSavingRedis}
              className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {isSavingRedis ? 'Saving...' : 'Save to Redis'}
            </button>
            <button
              type="button"
              onClick={handleGetRedis}
              disabled={isGettingRedis}
              className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-60"
            >
              {isGettingRedis ? 'Fetching...' : 'Get from Redis'}
            </button>
          </div>
        </form>
        {redisStatus && <p className="mt-4 text-sm">{redisStatus}</p>}
      </section>
    </div>
  )
}

export default SimsPage
