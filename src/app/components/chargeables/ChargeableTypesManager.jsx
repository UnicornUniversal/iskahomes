'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthTokenForUser } from '@/lib/authTokens'
import { formatCurrency } from '@/lib/utils'
import { INTERVAL_UNITS, getOwnerDefaultCurrency } from '@/lib/chargeables'
import { Input } from '@/app/components/ui/input'
import DataCard from '@/app/components/developers/DataCard'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiStar } from 'react-icons/fi'
import { CreditCard, TrendingUp, Clock, Loader2 } from 'lucide-react'

const emptyForm = {
  name: '',
  description: '',
  defaultAmount: '',
  defaultIntervalValue: 1,
  defaultIntervalUnit: 'month',
  isDefault: false
}

export default function ChargeableTypesManager() {
  const { user, developerToken, agencyToken, agentToken } = useAuth()
  const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    || (typeof window !== 'undefined' && (localStorage.getItem('developer_token') || localStorage.getItem('agency_token')))
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [initializingId, setInitializingId] = useState(null)

  const currency = getOwnerDefaultCurrency(user?.profile)

  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/chargeables/types', { headers })
      const result = await res.json()
      if (res.ok && result.success) setTypes(result.data || [])
      else toast.error(result.error || 'Failed to load chargeables')
    } catch {
      toast.error('Failed to load chargeables')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (type) => {
    setEditingId(type.id)
    setForm({
      name: type.name,
      description: type.description || '',
      defaultAmount: String(type.defaultAmount ?? ''),
      defaultIntervalValue: type.defaultIntervalValue || 1,
      defaultIntervalUnit: type.defaultIntervalUnit || 'month',
      isDefault: !!type.isDefault
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        defaultAmount: Number(form.defaultAmount) || 0,
        defaultIntervalValue: Number(form.defaultIntervalValue) || 1,
        defaultIntervalUnit: form.defaultIntervalUnit,
        isDefault: !!form.isDefault
      }
      const url = editingId ? `/api/chargeables/types/${editingId}` : '/api/chargeables/types'
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers, body: JSON.stringify(payload) })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Could not save')
        return
      }
      if (form.isDefault && editingId) {
        const initRes = await fetch(`/api/chargeables/types/${editingId}/initialize-default`, { method: 'POST', headers })
        const initResult = await initRes.json()
        if (initRes.ok && initResult.success) {
          toast.success(`Chargeable updated and attached to ${initResult.attachedCount || 0} listings.`)
        } else {
          toast.success('Chargeable updated')
        }
      } else if (form.isDefault && !editingId) {
        toast.success(`Chargeable created and attached to ${result.attachedCount || 0} listings.`)
      } else {
        toast.success(editingId ? 'Chargeable updated' : 'Chargeable created')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (type) => {
    if (!confirm(`Delete “${type.name}”? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/chargeables/types/${type.id}`, { method: 'DELETE', headers })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Could not delete')
        return
      }
      toast.success('Chargeable deleted')
      load()
    } catch {
      toast.error('Could not delete')
    }
  }

  const initializeDefault = async (type) => {
    if (!confirm(`Attach “${type.name}” to every existing property/unit and keep it as default for new ones?`)) return
    setInitializingId(type.id)
    try {
      const res = await fetch(`/api/chargeables/types/${type.id}/initialize-default`, { method: 'POST', headers })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Could not initialize')
        return
      }
      toast.success(`Default set. Attached to ${result.attachedCount || 0} listings.`)
      load()
    } catch {
      toast.error('Could not initialize')
    } finally {
      setInitializingId(null)
    }
  }

  const totalRevenue = types.reduce((sum, t) => sum + (t.totalRevenue || 0), 0)
  const incomingRevenue = types.reduce((sum, t) => sum + (t.incomingRevenue || 0), 0)

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-primary_color mb-1">Chargeables</h1>
          <p className="text-gray-600 text-sm">
            Define recurring payment types such as service charge, electricity, or property tax. Assign them to units, then open billing periods from Charges.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="primary_button text-sm py-2 px-3 shrink-0">
          <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add Chargeable
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <DataCard title="Types" value={loading ? '—' : types.length.toLocaleString()} icon={CreditCard} />
        <DataCard title="Total revenue" value={loading ? '—' : formatCurrency(totalRevenue, currency)} icon={TrendingUp} />
        <DataCard title="Incoming revenue" value={loading ? '—' : formatCurrency(incomingRevenue, currency)} icon={Clock} />
      </div>

      <div className="secondary_bg p-4 rounded-2xl shadow-sm flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary_color" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary_color">Chargeable types</h2>
            <p className="text-sm text-gray-500">Defaults used unless a unit or entry overrides them</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : types.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No chargeables yet. Add one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {types.map((type) => (
              <div key={type.id} className="rounded-xl border border-gray-200/60 bg-white/40 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary_color">{type.name}</p>
                    {type.isDefault && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <FiStar className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(type)} className="rounded-md p-1.5 text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10" title="Edit">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => remove(type)} className="rounded-md p-1.5 text-red-500/70 hover:text-red-600 hover:bg-red-50" title="Delete">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 min-h-[2.5rem]">{type.description || 'No description'}</p>
                <p className="text-sm text-primary_color">
                  {formatCurrency(type.defaultAmount, currency)} / {type.defaultIntervalValue} {type.defaultIntervalUnit}{type.defaultIntervalValue === 1 ? '' : 's'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white/60 p-2">
                    <p className="text-gray-500">Total revenue</p>
                    <p className="font-semibold text-primary_color">{formatCurrency(type.totalRevenue, currency)}</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-2">
                    <p className="text-gray-500">Incoming</p>
                    <p className="font-semibold text-primary_color">{formatCurrency(type.incomingRevenue, currency)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => initializeDefault(type)}
                  disabled={initializingId === type.id}
                  className="secondary_button text-sm py-2 px-3 disabled:opacity-50"
                >
                  {initializingId === type.id ? 'Initializing…' : type.isDefault ? 'Re-apply as default' : 'Initialize as default'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-primary_color">{editingId ? 'Edit chargeable' : 'Add chargeable'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-primary_color/70 hover:bg-primary_color/10">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Name</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full py-2 border-gray-200" placeholder="e.g. Service Charge" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Default amount</label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <span className="px-3 text-sm text-gray-500 border-r border-gray-200 shrink-0">{currency}</span>
                  <Input type="number" min="0" value={form.defaultAmount} onChange={(e) => setForm((p) => ({ ...p, defaultAmount: e.target.value }))} className="w-full py-2 border-0 rounded-none focus-visible:ring-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-1">Interval value</label>
                  <Input type="number" min="1" value={form.defaultIntervalValue} onChange={(e) => setForm((p) => ({ ...p, defaultIntervalValue: e.target.value }))} className="w-full py-2 border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-1">Interval unit</label>
                  <select
                    value={form.defaultIntervalUnit}
                    onChange={(e) => setForm((p) => ({ ...p, defaultIntervalUnit: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color"
                  >
                    {INTERVAL_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.isDefault}
                  onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-primary_color">Initialize as default</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Attach this type to every existing property or unit, and to new ones going forward.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button type="button" onClick={() => setModalOpen(false)} className="secondary_button py-2 px-4 text-sm">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="primary_button py-2 px-4 text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
