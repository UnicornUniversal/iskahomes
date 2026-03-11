'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FiSave } from 'react-icons/fi'
import { toast } from 'react-toastify'

const DEFAULT_SETTINGS = {
  two_factor: { sms: false },
  reminders: { sms: false, email: false },
  appointments: { sms: false, email: false },
  service_charges: { sms: false, email: false },
  engagements: { sms: false, email: false }
}

const SETTING_ROWS = [
  { key: 'two_factor', label: '2FA', channels: ['sms'] },
  { key: 'reminders', label: 'Reminders', channels: ['sms', 'email'] },
  { key: 'appointments', label: 'Appointments', channels: ['sms', 'email'] },
  { key: 'service_charges', label: 'Service Charges', channels: ['sms', 'email'] },
  { key: 'engagements', label: 'Engagements', channels: ['sms', 'email'] }
]

function normalizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {}
  const normalized = {}
  for (const row of SETTING_ROWS) {
    normalized[row.key] = {}
    for (const channel of row.channels) {
      normalized[row.key][channel] = source?.[row.key]?.[channel] === true
    }
  }
  return normalized
}

export default function ProfileSettings({ token, title = 'Settings' }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const hasToken = useMemo(() => Boolean(token), [token])

  useEffect(() => {
    async function fetchSettings() {
      if (!hasToken) return
      setLoading(true)
      try {
        const response = await fetch('/api/profile/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const result = await response.json()
        if (response.ok && result.success) {
          setSettings(normalizeSettings(result.settings))
          setDirty(false)
        } else {
          toast.error(result.error || 'Failed to load settings')
        }
      } catch (error) {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [hasToken, token])

  const toggleSetting = (feature, channel) => {
    setSettings(prev => ({
      ...prev,
      [feature]: {
        ...(prev[feature] || {}),
        [channel]: !(prev?.[feature]?.[channel] === true)
      }
    }))
    setDirty(true)
  }

  const saveSettings = async () => {
    if (!hasToken) {
      toast.error('Authentication required')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setSettings(normalizeSettings(result.settings))
        setDirty(false)
        toast.success('Settings updated successfully')
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl shadow-sm border border-gray-100 text-primary_color p-2 md:p-2 md:p-6">
      <div className="mb-6">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-70 mt-1">Choose which notifications come via SMS and email.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center opacity-70">Loading settings...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">Notification</th>
                  <th className="text-center p-3 text-sm font-semibold">SMS</th>
                  <th className="text-center p-3 text-sm font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {SETTING_ROWS.map((row) => (
                  <tr key={row.key} className="border-t border-gray-200">
                    <td className="p-3 text-sm">{row.label}</td>
                    <td className="p-3 text-center">
                      {row.channels.includes('sms') ? (
                        <input
                          type="checkbox"
                          checked={settings?.[row.key]?.sms === true}
                          onChange={() => toggleSetting(row.key, 'sms')}
                          className="w-4 h-4"
                        />
                      ) : (
                        <span className="opacity-40">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.channels.includes('email') ? (
                        <input
                          type="checkbox"
                          checked={settings?.[row.key]?.email === true}
                          onChange={() => toggleSetting(row.key, 'email')}
                          className="w-4 h-4"
                        />
                      ) : (
                        <span className="opacity-40">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving || !dirty}
              className="primary_button flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

