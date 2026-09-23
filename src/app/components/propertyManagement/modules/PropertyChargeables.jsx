'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthTokenForUser } from '@/lib/authTokens'
import { INTERVAL_UNITS, getOwnerDefaultCurrency, parseChargeablesList } from '@/lib/chargeables'
import { Input } from '@/app/components/ui/input'
import { toast } from 'react-toastify'
import { FiPlus, FiTrash2, FiStar } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils'

function mergeWithDefaults(saved, types) {
  const items = parseChargeablesList(saved)
  const byId = new Map(items.map((item) => [item.id, item]))
  types.filter((type) => type.isDefault).forEach((type) => {
    if (!byId.has(type.id)) byId.set(type.id, { id: type.id })
  })
  return Array.from(byId.values())
}

export default function PropertyChargeables({ formData, updateFormData }) {
  const { user, developerToken, agencyToken, agentToken } = useAuth()
  const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    || (typeof window !== 'undefined' && (localStorage.getItem('developer_token') || localStorage.getItem('agency_token')))
  const listingId = formData?.id
  const [types, setTypes] = useState([])
  const [items, setItems] = useState(() => parseChargeablesList(formData?.chargeables))
  const [saving, setSaving] = useState(false)
  const [addId, setAddId] = useState('')
  const saveTimer = useRef(null)
  const seeded = useRef(false)

  const currency = useMemo(() => getOwnerDefaultCurrency(user?.profile), [user?.profile])

  useEffect(() => {
    if (!token) return
    fetch('/api/chargeables/types', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setTypes(result.data || [])
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!types.length) return
    const merged = mergeWithDefaults(formData?.chargeables, types)
    setItems(merged)
    if (!seeded.current && merged.length && parseChargeablesList(formData?.chargeables).length === 0) {
      seeded.current = true
      updateFormData?.({ chargeables: merged })
    }
  }, [formData?.chargeables, types])

  const persist = (next, immediate = false) => {
    setItems(next)
    updateFormData?.({ chargeables: next })
    if (!listingId || !token) return

    const write = async () => {
      setSaving(true)
      try {
        const res = await fetch(`/api/chargeables/listings/${listingId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ chargeables: next })
        })
        const result = await res.json()
        if (!res.ok || !result.success) toast.error(result.error || 'Could not save chargeables')
      } catch {
        toast.error('Could not save chargeables')
      } finally {
        setSaving(false)
      }
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (immediate) write()
    else saveTimer.current = setTimeout(write, 500)
  }

  const attachedIds = items.map((item) => item.id)
  const available = types.filter((t) => !attachedIds.includes(t.id))

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mb-4">
        These apply only to this property or unit. Leave override fields empty to use the type defaults. This does not create a billing entry.
      </p>

      {types.length === 0 && items.length === 0 && (
        <p className="text-sm text-gray-500 mb-3">No chargeable types yet. Create them under Chargeables first.</p>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const type = types.find((t) => t.id === item.id)
          return (
            <div key={item.id} className="rounded-xl border border-gray-200/70 bg-white/50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-primary_color">{type?.name || 'Chargeable'}</p>
                    {type?.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <FiStar className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Default {formatCurrency(type?.defaultAmount || 0, currency)} / {type?.defaultIntervalValue || 1} {type?.defaultIntervalUnit || 'month'}
                    {type?.description ? ` · ${type.description}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => persist(items.filter((row) => row.id !== item.id), true)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  title="Remove from this listing"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-primary_color/80">New amount</label>
                  <Input
                    type="number"
                    value={item.new_amount ?? ''}
                    placeholder={type ? String(type.defaultAmount) : 'Default'}
                    onChange={(e) => {
                      const value = e.target.value
                      persist(items.map((row) => (
                        row.id === item.id ? { ...row, new_amount: value === '' ? undefined : Number(value) } : row
                      )))
                    }}
                    className="w-full !text-sm py-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary_color/80">New interval</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.new_interval_value ?? ''}
                    placeholder={type ? String(type.defaultIntervalValue) : 'Default'}
                    onChange={(e) => {
                      const value = e.target.value
                      persist(items.map((row) => (
                        row.id === item.id ? { ...row, new_interval_value: value === '' ? undefined : Number(value) } : row
                      )))
                    }}
                    className="w-full !text-sm py-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary_color/80">Interval unit</label>
                  <select
                    value={item.new_interval_unit || ''}
                    onChange={(e) => persist(items.map((row) => (
                      row.id === item.id ? { ...row, new_interval_unit: e.target.value || undefined } : row
                    )))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-sm mt-1"
                  >
                    <option value="">{type?.defaultIntervalUnit || 'Use default'}</option>
                    {INTERVAL_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {available.length > 0 && (
        <div className="flex gap-2 mt-4">
          <select
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Add another chargeable…</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!addId}
            onClick={() => { persist([...items, { id: addId }], true); setAddId('') }}
            className="primary_button text-sm py-2 px-3 disabled:opacity-50"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add
          </button>
        </div>
      )}
      {saving && <p className="text-xs text-gray-400 mt-2">Saving…</p>}
    </div>
  )
}
