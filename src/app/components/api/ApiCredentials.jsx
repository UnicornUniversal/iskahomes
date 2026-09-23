'use client'

import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { FiCheck, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi'

function maskSecret(value) {
  if (!value || value.length < 10) return '••••••••'
  return `${value.slice(0, 8)}${'•'.repeat(16)}${value.slice(-4)}`
}

export default function ApiCredentials({
  publishableKey,
  secretKey,
  secretKeyPrefix,
  revealSecret = false,
  showSecretPlain = false
}) {
  const [shown, setShown] = useState(showSecretPlain)
  const [copiedValue, setCopiedValue] = useState(null)
  const secretDisplay = secretKey || (secretKeyPrefix ? `${secretKeyPrefix}${'•'.repeat(12)}` : '')
  const showFullSecret = !!secretKey && (shown || showSecretPlain)

  const copyToClipboard = async (text, label) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedValue(text)
      toast.success(`${label} copied`)
      setTimeout(() => setCopiedValue(null), 1200)
    } catch {
      toast.error('Could not copy')
    }
  }

  const rows = [
    { label: 'Publishable key', value: publishableKey, display: publishableKey, copyable: !!publishableKey },
    {
      label: 'Secret key',
      value: secretKey,
      display: showFullSecret ? secretKey : maskSecret(secretDisplay),
      copyable: !!secretKey,
      reveal: revealSecret && !!secretKey && !showSecretPlain
    }
  ]

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const copied = copiedValue === row.value
        return (
          <div
            key={row.label}
            className="flex items-start gap-3 bg-white/40 border border-gray-200 rounded-lg px-4 py-2"
          >
            <label className="w-36 shrink-0 text-sm font-medium text-gray-700 pt-0.5">{row.label}</label>
            <code className="flex-1 text-sm font-mono text-primary_color break-all">{row.display || '—'}</code>
            {row.reveal && (
              <button
                type="button"
                onClick={() => setShown((prev) => !prev)}
                className="p-1.5 text-primary_color/60 hover:text-primary_color shrink-0"
              >
                {shown ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            )}
            {row.copyable && (
              <button
                type="button"
                onClick={() => copyToClipboard(row.value, row.label)}
                className="p-1.5 text-primary_color/60 hover:text-primary_color shrink-0"
              >
                {copied ? <FiCheck className="w-4 h-4 text-primary_green" /> : <FiCopy className="w-4 h-4" />}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
