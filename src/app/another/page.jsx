'use client'
import React, { useState } from 'react'
import AlbumGallery from '../components/propertyManagement/modules/AlbumGallery'
import IskaServices from '../components/general/IskaServices'
import SimpleServices from '../components/general/SimpleServices'
import Notifications from '../components/general/Notifications'
import BackfillLeads from '../components/test/BackfillLeads'

const page = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ 
          success: true, 
          message: data.message,
          provider: data.provider,
          sendGridFallback: data.sendGridFallback,
          sendGridError: data.sendGridError
        })
        setEmail('')
        setMessage('')
      } else {
        setResult({ 
          success: false, 
          error: data.error, 
          details: data.details,
          sendGridError: data.sendGridError,
          resendError: data.resendError
        })
      }
    } catch (error) {
      setResult({ success: false, error: 'Network error. Please try again.', details: error.message })
    } finally {
      setLoading(false)
    }
  }

  const container1 = 'bg-white w-full h-[20em]  mx-auto lg:w-[30em] lg:h-[30em] break-inside-avoid border border-primary_color/10 p-4'
  const container2 = 'bg-white w-full h-[30em] mx-auto md:w-[15em] md:h-[20em] break-inside-avoid border border-secondary_color/20 p-4'
  const container3 = 'bg-white w-full h-[25em] mx-auto md:w-[25em] md:h-[15em] break-inside-avoid border border-secondary_color/20 p-4'
  const container4 = 'bg-white w-full h-[15em] mx-auto md:w-[20em] md:h-[20em] break-inside-avoid border border-secondary_color/20 p-4'

  return (
    <div className='w-full min-h-screen p-4'>
      {/* Email Test Form */}
      <div className="max-w-[600px] mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📧 Email Test (SendGrid + Resend)</h2>
          <p className="text-gray-600 mb-6">
            Enter an email address and message to test email functionality. The system will try SendGrid first, and automatically fallback to Resend if SendGrid fails.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your test message here..."
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
          </form>

          {/* Result Messages */}
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div>
                  <p className="text-green-800 font-medium">✅ {result.message}</p>
                  {result.provider && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-green-700 text-sm">
                        <strong>Provider:</strong> {result.provider}
                      </p>
                      {result.sendGridFallback && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 text-xs">
                            ⚠️ <strong>Fallback Used:</strong> SendGrid failed, so Resend was used instead.
                          </p>
                          {result.sendGridError && (
                            <p className="text-yellow-700 text-xs mt-1">
                              SendGrid error: {result.sendGridError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-800 font-medium">❌ Error: {result.error}</p>
                  
                  {result.helpfulMessage && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 text-sm font-medium mb-1">💡 Helpful Tip:</p>
                      <p className="text-blue-700 text-sm">{result.helpfulMessage}</p>
                    </div>
                  )}
                  
                  {result.suggestion && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-xs">
                        <strong>💡 Suggestion:</strong> {result.suggestion}
                      </p>
                    </div>
                  )}
                  
                  {result.details && (
                    <p className="text-red-600 text-sm mt-2">
                      <strong>Details:</strong> {typeof result.details === 'object' ? JSON.stringify(result.details, null, 2) : result.details}
                    </p>
                  )}
                  
                  {result.sendGridError && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-orange-800 text-xs">
                        <strong>SendGrid Error:</strong> {result.sendGridError}
                      </p>
                    </div>
                  )}
                  
                  {result.resendError && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-orange-800 text-xs">
                        <strong>Resend Error:</strong> {result.resendError}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* <IskaServices /> */}
<div className="max-w-[500px] ">

  {/* <SimpleServices />
  <Notifications /> */}
  <BackfillLeads />
</div>

      {/* Truly automatic grid - browser decides everything */}
      {/* <div className='flex flex-wrap gap-4  items-center justify-center'>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container3}>
          <p>Container 3</p>
        </div>
        <div className={container4}>
          <p>Container 4</p>
        </div>
        <div className={container1}>
          <p>Container 1</p>
        </div>
        <div className={container2}>
          <p>Container 2</p>
        </div>

      </div> */}
    </div>
  )
}

export default page