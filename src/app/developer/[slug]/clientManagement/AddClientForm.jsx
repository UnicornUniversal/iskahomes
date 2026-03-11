'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FiUser, FiMail, FiPhone, FiMapPin, FiPlus, FiTrash2, FiSearch, FiX } from 'react-icons/fi'
import { Input } from '@/app/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { CLIENT_STATUSES, CLIENT_SOURCE_CHANNELS, CLIENT_TYPES } from './dummyClients'

export default function AddClientForm({ basePath, onSuccess, onCancel }) {
  const router = useRouter()
  const { developerToken } = useAuth()
  const [form, setForm] = useState({
    name: '',
    clientType: 'Individual',
    emails: [''],
    phones: [''],
    address: {},
    status: 'Qualified',
    sourceChannel: 'Website',
    sourceUserId: '',
    firstContactDate: '',
    convertedDate: '',
    notes: '',
    tags: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [assignableUsers, setAssignableUsers] = useState([])
  const [gmPlacesLoaded, setGmPlacesLoaded] = useState(false)
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)
  const addressTimerRef = useRef(null)

  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const initPlaces = () => {
      try {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'))
          setGmPlacesLoaded(true)
        }
      } catch (e) { console.error('Google Places init error:', e) }
    }
    if (window.google?.maps?.places) { initPlaces(); return }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API
    if (!apiKey) return
    const existing = document.getElementById('gmaps-script')
    if (existing) {
      const h = setInterval(() => { if (window.google?.maps?.places) { clearInterval(h); initPlaces() } }, 100)
      return () => clearInterval(h)
    }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    s.async = true
    s.defer = true
    s.onload = initPlaces
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!token()) return
    fetch('/api/clients/assignable-users', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (data.success) setAssignableUsers(data.data || []) })
  }, [developerToken])

  const onAddressSearch = useCallback((value) => {
    setAddressQuery(value)
    if (!gmPlacesLoaded || !autocompleteServiceRef.current) return
    if (addressTimerRef.current) clearTimeout(addressTimerRef.current)
    addressTimerRef.current = setTimeout(() => {
      if (!value.trim()) { setAddressSuggestions([]); return }
      autocompleteServiceRef.current.getPlacePredictions({ input: value }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setAddressSuggestions(predictions.slice(0, 6))
        } else { setAddressSuggestions([]) }
      })
    }, 250)
  }, [gmPlacesLoaded])

  const onAddressSuggestionSelect = useCallback((prediction) => {
    if (!placesServiceRef.current) return
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
          setForm(f => ({ ...f, address: { ...f.address, fullAddress: place.formatted_address } }))
          setAddressQuery(place.formatted_address)
          setAddressSuggestions([])
        }
      }
    )
  }, [])

  const addEmail = () => setForm(f => ({ ...f, emails: [...f.emails, ''] }))
  const removeEmail = (i) => setForm(f => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }))
  const setEmail = (i, v) => setForm(f => ({ ...f, emails: f.emails.map((e, idx) => idx === i ? v : e) }))
  const addPhone = () => setForm(f => ({ ...f, phones: [...f.phones, ''] }))
  const removePhone = (i) => setForm(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))
  const setPhone = (i, v) => setForm(f => ({ ...f, phones: f.phones.map((p, idx) => idx === i ? v : p) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!token()) return
    setSubmitError(null)
    setSubmitting(true)
    fetch('/api/clients', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        clientType: form.clientType,
        emails: form.emails.filter(Boolean),
        phones: form.phones.filter(Boolean),
        address: form.address,
        status: form.status,
        sourceChannel: form.sourceChannel,
        sourceUserId: form.sourceUserId || null,
        firstContactDate: form.firstContactDate || null,
        convertedDate: form.convertedDate || null,
        notes: form.notes || '',
        tags: form.tags
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.id) {
          if (onSuccess) onSuccess(data.data.id)
          else router.push(`${basePath}/${data.data.id}`)
        } else {
          setSubmitError(data.error || 'Failed to create client')
          setSubmitting(false)
        }
      })
      .catch(() => {
        setSubmitError('Failed to create client')
        setSubmitting(false)
      })
  }

  return (
    <div className="default_bg rounded-xl border border-white/40 p-6 mb-6">
      <h2 className="text-lg font-semibold text-primary_color mb-4">Add new client</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-primary_color mb-3 flex items-center gap-2"><FiUser /> Basic information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Name / Company name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name or company" required className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Client type</label>
              <select value={form.clientType} onChange={e => setForm(f => ({ ...f, clientType: e.target.value }))} className="w-full default_bg border border-white/40 rounded-lg px-3 py-2 text-primary_color">
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-primary_color mb-3 flex items-center gap-2"><FiMail /> Emails</h3>
          <div className="space-y-2">
            {form.emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <Input type="email" value={email} onChange={e => setEmail(i, e.target.value)} placeholder="email@example.com" className="flex-1" />
                {form.emails.length > 1 && <button type="button" onClick={() => removeEmail(i)} className="secondary_button p-2"><FiTrash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button type="button" onClick={addEmail} className="secondary_button text-sm py-2 px-3"><FiPlus className="w-4 h-4 inline mr-1" /> Add email</button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-primary_color mb-3 flex items-center gap-2"><FiPhone /> Phone numbers</h3>
          <div className="space-y-2">
            {form.phones.map((phone, i) => (
              <div key={i} className="flex gap-2">
                <Input type="tel" value={phone} onChange={e => setPhone(i, e.target.value)} placeholder="+233 XX XXX XXXX" className="flex-1" />
                {form.phones.length > 1 && <button type="button" onClick={() => removePhone(i)} className="secondary_button p-2"><FiTrash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button type="button" onClick={addPhone} className="secondary_button text-sm py-2 px-3"><FiPlus className="w-4 h-4 inline mr-1" /> Add phone</button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-primary_color mb-3 flex items-center gap-2"><FiMapPin /> Location / Address</h3>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary_color/50 z-10" />
            <input
              type="text"
              value={addressQuery || form.address?.fullAddress || form.address?.full_address || ''}
              onChange={e => { const v = e.target.value; setAddressQuery(v); setForm(f => ({ ...f, address: { ...f.address, fullAddress: v } })); onAddressSearch(v) }}
              placeholder={gmPlacesLoaded ? 'Search address (Google Maps)' : 'Loading...'}
              disabled={!gmPlacesLoaded}
              className="w-full pl-9 pr-9 py-2 default_bg border border-white/40 rounded-lg text-sm text-primary_color placeholder:text-primary_color/50"
            />
            {(form.address?.fullAddress || form.address?.full_address) && (
              <button type="button" onClick={() => { setForm(f => ({ ...f, address: {} })); setAddressQuery('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary_color/70 hover:text-primary_color p-1"><FiX className="w-4 h-4" /></button>
            )}
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-white/40 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                {addressSuggestions.map(p => (
                  <li key={p.place_id}>
                    <button type="button" onClick={() => onAddressSuggestionSelect(p)} className="w-full text-left px-4 py-2 text-sm text-primary_color hover:bg-gray-100">{p.description}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-primary_color mb-3">Status & source</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full default_bg border border-white/40 rounded-lg px-3 py-2 text-primary_color">
                {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Source channel</label>
              <select value={form.sourceChannel} onChange={e => setForm(f => ({ ...f, sourceChannel: e.target.value }))} className="w-full default_bg border border-white/40 rounded-lg px-3 py-2 text-primary_color">
                {CLIENT_SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary_color mb-1">Source user</label>
              <select value={form.sourceUserId} onChange={e => setForm(f => ({ ...f, sourceUserId: e.target.value }))} className="w-full default_bg border border-white/40 rounded-lg px-3 py-2 text-primary_color">
                <option value="">— None —</option>
                {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">First contact date</label>
              <Input type="date" value={form.firstContactDate} onChange={e => setForm(f => ({ ...f, firstContactDate: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary_color mb-1">Converted to client date</label>
              <Input type="date" value={form.convertedDate} onChange={e => setForm(f => ({ ...f, convertedDate: e.target.value }))} className="w-full" />
            </div>
          </div>
        </section>

        <section>
          <label className="block text-sm font-medium text-primary_color mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full default_bg border border-white/40 rounded-lg px-3 py-2 text-primary_color placeholder:text-primary_color/50" placeholder="Internal notes..." />
        </section>
        <section>
          <label className="block text-sm font-medium text-primary_color mb-1">Tags (comma-separated)</label>
          <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. VIP, Investor" className="w-full" />
        </section>

        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="primary_button" disabled={submitting}>{submitting ? 'Saving...' : 'Save client'}</button>
          <button type="button" onClick={onCancel} className="secondary_button">Cancel</button>
        </div>
      </form>
    </div>
  )
}
