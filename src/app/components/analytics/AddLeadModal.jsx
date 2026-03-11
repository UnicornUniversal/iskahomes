'use client'

import React, { useState, useEffect } from 'react'
import { FiX, FiUser, FiMail, FiPhone } from 'react-icons/fi'

const LEAD_ORIGIN_OPTIONS = [
  { value: 'platform', label: 'Platform (our website)' },
  { value: 'their_website', label: 'Their website' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone_call', label: 'Phone call' },
  { value: 'event', label: 'Event' },
  { value: 'social_media', label: 'Social media' },
  { value: 'other', label: 'Other' }
]

export default function AddLeadModal({ isOpen, onClose, onSubmit, listerId, listerType, token }) {
  const [form, setForm] = useState({
    lead_name: '',
    lead_email: '',
    lead_phone: '',
    lead_origin: 'platform',
    listing_id: '',
    development_id: '',
    notes: ''
  })
  const [listings, setListings] = useState([])
  const [developments, setDevelopments] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && listerId && token) {
      fetchOptions()
    }
  }, [isOpen, listerId, listerType, token])

  const fetchOptions = async () => {
    setLoadingOptions(true)
    try {
      const res = await fetch(`/api/leads/manual?lister_id=${encodeURIComponent(listerId)}&lister_type=${listerType || 'developer'}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setListings(data.data?.listings || [])
        setDevelopments(data.data?.developments || [])
      }
    } catch (err) {
      console.error('Error fetching options:', err)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.lead_name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.lead_email?.trim() && !form.lead_phone?.trim()) {
      setError('At least one of email or phone is required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        lead_name: form.lead_name.trim(),
        lead_email: form.lead_email?.trim() || null,
        lead_phone: form.lead_phone?.trim() || null,
        lead_origin: form.lead_origin,
        listing_id: form.listing_id || null,
        development_id: form.development_id || null,
        lister_id: listerId,
        lister_type: listerType || 'developer',
        notes: form.notes?.trim() ? [form.notes.trim()] : [],
        context_type: form.listing_id ? 'listing' : form.development_id ? 'development' : 'profile'
      }
      const res = await fetch('/api/leads/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        onSubmit?.(data.lead)
        onClose?.()
        setForm({ lead_name: '', lead_email: '', lead_phone: '', lead_origin: 'platform', listing_id: '', development_id: '', notes: '' })
      } else {
        setError(data.error || 'Failed to create lead')
      }
    } catch (err) {
      setError(err.message || 'Failed to create lead')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="lead_name"
                value={form.lead_name}
                onChange={handleChange}
                placeholder="Lead name"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="lead_email"
                value={form.lead_email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="lead_phone"
                value={form.lead_phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">At least one of email or phone is required</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Where did this lead come from? *</label>
            <select
              name="lead_origin"
              value={form.lead_origin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
            >
              {LEAD_ORIGIN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property of interest</label>
            <select
              name="listing_id"
              value={form.listing_id}
              onChange={(e) => {
                handleChange(e)
                if (e.target.value) setForm(prev => ({ ...prev, development_id: '' }))
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
              disabled={loadingOptions}
            >
              <option value="">General inquiry</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>{l.title || l.slug}</option>
              ))}
            </select>
          </div>
          {listerType === 'developer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Development of interest</label>
              <select
                name="development_id"
                value={form.development_id}
                onChange={(e) => {
                  handleChange(e)
                  if (e.target.value) setForm(prev => ({ ...prev, listing_id: '' }))
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                disabled={loadingOptions}
              >
                <option value="">None</option>
                {developments.map(d => (
                  <option key={d.id} value={d.id}>{d.name || d.slug}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional notes..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
