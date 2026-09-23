'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthTokenForUser } from '@/lib/authTokens'
import { formatCurrency } from '@/lib/utils'
import { addDays, addInterval, formatChargeableDate, formatChargeableInterval, getOwnerDefaultCurrency } from '@/lib/chargeables'
import { Input } from '@/app/components/ui/input'
import DataCard from '@/app/components/developers/DataCard'
import PropertySearchField from '@/app/components/chargeables/PropertySearchField'
import { openPrintableHtmlDocument, escapeHtml } from '@/lib/developerExportDocuments'
import { toast } from 'react-toastify'
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { CreditCard, Calendar, CalendarClock, AlertCircle, Loader2, ImageOff, MapPin, Printer, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dueStatusLabel(entry) {
  if (entry.nextDueStatus === 'overdue' || entry.isOverdue) return 'Overdue'
  if (entry.nextDueStatus === 'due') return 'Due'
  if (entry.nextDueStatus === 'paid') return 'Paid'
  return 'Not due'
}

function EventSeriesTimeline({ series }) {
  if (!Array.isArray(series) || series.length === 0) {
    return <p className="text-xs text-gray-400 mt-2">No history logged yet.</p>
  }
  return (
    <ol className="mt-3 space-y-2 border-l border-gray-200 pl-3">
      {series.map((event, index) => {
        const at = event?.at ? String(event.at) : ''
        const datePart = at.slice(0, 10)
        let timePart = ''
        try {
          if (at) {
            timePart = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        } catch { /* ignore */ }
        return (
          <li key={`${event?.event || 'event'}-${index}`} className="text-xs text-gray-600">
            <span className="font-semibold text-primary_color capitalize">{String(event?.event || 'event').replace(/_/g, ' ')}</span>
            {datePart ? ` · ${formatChargeableDate(datePart)}${timePart ? ` ${timePart}` : ''}` : ''}
            {event?.next_due_status ? ` · ${String(event.next_due_status).replace('_', ' ')}` : ''}
            {event?.status ? ` · ${event.status}` : ''}
            {event?.amount != null && event.amount !== '' ? ` · ${event.amount}` : ''}
          </li>
        )
      })}
    </ol>
  )
}

function DueStatusBadge({ entry }) {
  const label = dueStatusLabel(entry)
  const className =
    label === 'Overdue'
      ? 'bg-red-50 text-red-700'
      : label === 'Due'
        ? 'bg-amber-50 text-amber-800'
        : label === 'Paid'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-gray-100 text-primary_color'
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>
  )
}

const PAGE_SIZE = 10

const emptyEntry = {
  unitId: '',
  chargeableType: '',
  amount: '',
  intervalValue: 1,
  intervalUnit: 'month',
  periodStart: todayStr(),
  periodEnd: todayStr(),
  nextDueDate: '',
  nextDueTime: '08:00',
  status: 'Pending',
  paidAt: '',
  billingReference: ''
}

export default function ChargeableEntriesBoard({
  lockedUnit = null,
  hideFilters = false,
  showEventSeries = false,
  heading = 'Charges',
  description = 'Billing periods for your chargeables. Adding a type to a unit does not create an entry — use Add Chargeable Entry to open a cycle.'
}) {
  const { user, developerToken, agencyToken, agentToken } = useAuth()
  const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    || (typeof window !== 'undefined' && (localStorage.getItem('developer_token') || localStorage.getItem('agency_token')))
  const [entries, setEntries] = useState([])
  const [types, setTypes] = useState([])
  const [clients, setClients] = useState([])
  const [typeCatalog, setTypeCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [selectedFilterProperty, setSelectedFilterProperty] = useState(null)
  const [clientFilter, setClientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [overdueFilter, setOverdueFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showDesktopFilters, setShowDesktopFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form, setForm] = useState(emptyEntry)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [serverStats, setServerStats] = useState({ totalDueThisMonth: 0, totalDueNextMonth: 0, totalOverdue: 0 })

  const currency = useMemo(() => getOwnerDefaultCurrency(user?.profile), [user?.profile])

  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}

  const buildParams = (extra = {}) => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('typeId', typeFilter)
    if (lockedUnit?.id) params.set('unitId', lockedUnit.id)
    else if (propertyFilter) params.set('unitId', propertyFilter)
    if (clientFilter) params.set('clientId', clientFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (overdueFilter !== 'all') params.set('filter', overdueFilter)
    if (!hideFilters && fromDate) params.set('fromDate', fromDate)
    if (!hideFilters && toDate) params.set('toDate', toDate)
    Object.entries(extra).forEach(([k, v]) => { if (v != null) params.set(k, String(v)) })
    return params
  }

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = buildParams({ page, limit: PAGE_SIZE })
      const res = await fetch(`/api/chargeables/entries?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const result = await res.json()
      if (res.ok && result.success) {
        setEntries(result.data || [])
        setTypes(result.types || [])
        setClients(result.clients || [])
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
        if (result.stats) setServerStats(result.stats)
      } else {
        toast.error(result.error || 'Failed to load charges')
      }
    } catch {
      toast.error('Failed to load charges')
    } finally {
      setLoading(false)
    }
  }, [token, typeFilter, propertyFilter, clientFilter, statusFilter, overdueFilter, fromDate, toDate, page, lockedUnit?.id, hideFilters])

  useEffect(() => { load() }, [load])

  useEffect(() => { setPage(1) }, [typeFilter, propertyFilter, clientFilter, statusFilter, overdueFilter, fromDate, toDate, lockedUnit?.id])

  useEffect(() => {
    if (!lockedUnit?.id) return
    setPropertyFilter(lockedUnit.id)
    setSelectedFilterProperty(lockedUnit)
    setSelectedUnit(lockedUnit)
  }, [lockedUnit])

  const clearFilters = () => {
    if (!lockedUnit?.id) {
      setPropertyFilter('')
      setSelectedFilterProperty(null)
    }
    setTypeFilter('')
    setClientFilter('')
    setStatusFilter('')
    setOverdueFilter('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const hasActiveFilters = !!(
    (!lockedUnit?.id && propertyFilter) ||
    typeFilter ||
    clientFilter ||
    statusFilter ||
    overdueFilter !== 'all' ||
    fromDate ||
    toDate
  )

  useEffect(() => {
    if (!token) return
    fetch('/api/chargeables/types', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setTypeCatalog(result.data || [])
      })
      .catch(() => {})
  }, [token])

  const stats = useMemo(() => ({
    totalEntries: total,
    totalDueThisMonth: serverStats.totalDueThisMonth || 0,
    totalDueNextMonth: serverStats.totalDueNextMonth || 0,
    totalOverdue: serverStats.totalOverdue || 0
  }), [total, serverStats])

  const unitTypes = (selectedUnit?.chargeables || [])
    .map((item) => typeCatalog.find((t) => t.id === item.id))
    .filter(Boolean)
  const selectedType = typeCatalog.find((t) => t.id === form.chargeableType)
  const listingOverride = (selectedUnit?.chargeables || []).find((item) => item.id === form.chargeableType)
  const cadenceFromUnit = !!(listingOverride?.new_interval_value && listingOverride?.new_interval_unit)
  const cadenceLabel = selectedType
    ? `${formatChargeableInterval(form.intervalValue, form.intervalUnit)} (${cadenceFromUnit ? 'from this unit' : 'from type default'})`
    : null

  const applyDefaults = (unit, typeId) => {
    const type = typeCatalog.find((t) => t.id === typeId)
    const override = (unit?.chargeables || []).find((item) => item.id === typeId) || {}
    if (!type) return
    const intervalValue = override.new_interval_value || type.defaultIntervalValue
    const intervalUnit = override.new_interval_unit || type.defaultIntervalUnit
    const amount = override.new_amount ?? type.defaultAmount
    const periodStart = form.periodStart || todayStr()
    const periodEnd = addInterval(periodStart, intervalValue, intervalUnit)
    setForm((prev) => ({
      ...prev,
      unitId: unit.id,
      chargeableType: typeId,
      amount: String(amount ?? ''),
      intervalValue,
      intervalUnit,
      periodEnd,
      nextDueDate: addDays(periodEnd, 1)
    }))
  }

  const occupantLabel = (() => {
    if (!selectedUnit) return 'Unassigned'
    const match = clients.find((client) => {
      const props = Array.isArray(client.clients_properties) ? client.clients_properties : []
      return props.some((prop) => String(typeof prop === 'string' ? prop : prop?.id) === String(selectedUnit.id))
    })
    return match?.name || 'Unassigned'
  })()

  const selectFieldClass =
    'text-sm w-full min-w-0 rounded-lg border border-gray-300/80 bg-white/35 px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary_color/25 focus:border-primary_color'

  const formatDate = formatChargeableDate

  const fetchExportRows = async () => {
    const params = buildParams({ export: '1', page: 1 })
    const res = await fetch(`/api/chargeables/entries?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const result = await res.json()
    return result.success ? result.data || [] : entries
  }

  const rowToCells = (e) => ([
    e.unitName || '—',
    e.typeName || '—',
    e.clientName || '—',
    formatCurrency(e.amount, currency),
    `${formatDate(e.periodStart)} – ${formatDate(e.periodEnd)}`,
    formatDate(e.nextDueDate),
    e.isOverdue ? 'Overdue' : dueStatusLabel(e)
  ])

  const downloadBlob = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (format) => {
    if (exporting) return
    setExportMenuOpen(false)
    setExporting(true)
    try {
      const rows = await fetchExportRows()
      const org = user?.profile?.name || user?.profile?.organization_name || 'Charges'
      const headersRow = ['Property', 'Type', 'Occupant', 'Amount', 'Period', 'Next due', 'Status']
      if (format === 'pdf') {
        const html = `<!DOCTYPE html><html><head><title>${org} — Charges</title>
          <style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a}
          h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
          th,td{border-bottom:1px solid #e2e8f0;text-align:left;padding:8px}</style></head><body>
          <h1>${escapeHtml(org)} — Chargeable entries</h1>
          <p>${rows.length} result${rows.length === 1 ? '' : 's'}</p>
          <table><thead><tr>${headersRow.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
          ${rows.map((e) => `<tr>${rowToCells(e).map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}
          </tbody></table></body></html>`
        openPrintableHtmlDocument(html, `${org} — Charges`)
      } else if (format === 'excel') {
        const table = `<table><tr>${headersRow.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((e) => `<tr>${rowToCells(e).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`
        downloadBlob(`charges-${todayStr()}.xls`, table, 'application/vnd.ms-excel')
      } else {
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
        const csv = [headersRow.map(escape).join(','), ...rows.map((e) => rowToCells(e).map(escape).join(','))].join('\n')
        downloadBlob(`charges-${todayStr()}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8;')
      }
    } catch {
      toast.error('Could not export results')
    } finally {
      setExporting(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyEntry,
      periodStart: todayStr(),
      unitId: lockedUnit?.id || ''
    })
    setSelectedUnit(lockedUnit || null)
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setSelectedUnit({
      id: entry.unitId,
      name: entry.unitName,
      cover: entry.unitCover,
      location: entry.unitLocation,
      chargeables: [{ id: entry.chargeableType }]
    })
    setForm({
      unitId: entry.unitId,
      chargeableType: entry.chargeableType,
      amount: String(entry.amount ?? ''),
      intervalValue: entry.intervalValue || 1,
      intervalUnit: entry.intervalUnit || 'month',
      periodStart: entry.periodStart || todayStr(),
      periodEnd: entry.periodEnd || todayStr(),
      nextDueDate: entry.nextDueDate || '',
      nextDueTime: entry.nextDueTime || '08:00',
      status: entry.status || 'Pending',
      paidAt: entry.paidAt || '',
      billingReference: entry.billingReference || ''
    })
    setModalOpen(true)
  }

  const submit = async () => {
    if (!form.unitId || !form.chargeableType) {
      toast.error('Select a unit and chargeable type')
      return
    }
    setSaving(true)
    try {
      const type = selectedType
      const override = listingOverride || {}
      const defaultAmount = override.new_amount ?? type?.defaultAmount
      const payload = {
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        nextDueTime: form.nextDueTime,
        status: form.status,
        paidAt: form.status === 'Paid' ? form.paidAt || todayStr() : null,
        billingReference: form.billingReference || null,
        amount: Number(form.amount)
      }
      if (!editingId) {
        payload.unitId = form.unitId
        payload.chargeableType = form.chargeableType
        if (Number(form.amount) !== Number(defaultAmount)) payload.newAmount = Number(form.amount)
      }
      const res = await fetch(editingId ? `/api/chargeables/entries/${editingId}` : '/api/chargeables/entries', {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error || (editingId ? 'Could not update entry' : 'Could not create entry'))
        return
      }
      toast.success(editingId ? 'Chargeable entry updated' : 'Chargeable entry added')
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyEntry)
      setSelectedUnit(null)
      load()
    } catch {
      toast.error(editingId ? 'Could not update entry' : 'Could not create entry')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/chargeables/entries/${deleteTarget.id}`, { method: 'DELETE', headers })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Could not delete entry')
        return
      }
      toast.success('Chargeable entry deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Could not delete entry')
    } finally {
      setDeleting(false)
    }
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const filterFields = (
    <>
      <div className="mb-6">
        <PropertySearchField
          token={token}
          label="Search property"
          value={propertyFilter}
          selected={selectedFilterProperty}
          attachedOnly
          placeholder="Search properties or units…"
          onSelect={(item) => { setSelectedFilterProperty(item); setPropertyFilter(item.id) }}
          onClear={() => { setSelectedFilterProperty(null); setPropertyFilter('') }}
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Type</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectFieldClass}>
          <option value="">All types</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {clients.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Client</label>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={selectFieldClass}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Status</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectFieldClass}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Due</label>
        <select value={overdueFilter} onChange={(e) => setOverdueFilter(e.target.value)} className={selectFieldClass}>
          <option value="all">All</option>
          <option value="overdue">Overdue only</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Start date</label>
        <Input
          type="date"
          lang="en-GB"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full py-2 border-gray-200"
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">End date</label>
        <Input
          type="date"
          lang="en-GB"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full py-2 border-gray-200"
        />
        <p className="text-xs text-gray-500 mt-1.5">Filters by next due date.</p>
      </div>
    </>
  )

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-primary_color mb-1">{heading}</h1>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openCreate}
            className="primary_button text-sm py-2 px-3"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Add Chargeable Entry
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exporting || loading}
              className="secondary_button text-sm py-2 px-3 flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Export
            </button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 mt-1 z-50 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <button type="button" onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">CSV</button>
                  <button type="button" onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Excel</button>
                  <button type="button" onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">PDF</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard title="Total Entries" value={loading ? '—' : stats.totalEntries.toLocaleString()} icon={CreditCard} />
        <DataCard title="Due This Month" value={loading ? '—' : formatCurrency(stats.totalDueThisMonth, currency)} icon={Calendar} />
        <DataCard title="Due Next Month" value={loading ? '—' : formatCurrency(stats.totalDueNextMonth, currency)} icon={CalendarClock} />
        <DataCard title="Total Overdue" value={loading ? '—' : formatCurrency(stats.totalOverdue, currency)} icon={AlertCircle} />
      </div>

      <div className="w-full flex items-start gap-6 relative">
        {!hideFilters && (
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed top-20 right-4 z-30 w-12 h-12 rounded-full bg-primary_color text-white shadow-lg hover:bg-primary_color/90 transition-colors flex items-center justify-center"
            title="Show Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {!hideFilters && !showDesktopFilters && (
            <div className="hidden lg:flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowDesktopFilters(true)}
                className="flex items-center justify-center w-10 h-10 !p-2 secondary_button !rounded-md hover:bg-gray-50 transition-colors"
                title="Show Filters"
              >
                <Filter className="w-5 h-5 text-primary_color" />
              </button>
            </div>
          )}

          <div className="secondary_bg p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary_color/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary_color" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary_color">{hideFilters ? 'Unit chargeable entries' : 'All chargeable entries'}</h2>
                <p className="text-sm text-gray-500">
                  {hideFilters
                    ? 'Entries for this listing only. Totals above are for this unit.'
                    : 'Use the filter icon to search, set a date range, and narrow results'}
                </p>
              </div>
            </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            {hideFilters ? 'No chargeable entries for this listing yet.' : 'No chargeable entries match these filters.'}
          </p>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-primary_color/70 border-b border-gray-200">
                    <th className="py-2 pr-3">Property</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Occupant</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Period</th>
                    <th className="py-2 pr-3">Next due</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <React.Fragment key={entry.id}>
                    <tr className="border-b border-gray-100/80">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2 min-w-[12rem]">
                          {entry.unitCover ? (
                            <img src={entry.unitCover} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center"><ImageOff className="w-4 h-4 text-gray-400" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-primary_color truncate">{entry.unitName}</p>
                            {entry.unitLocation && (
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1"><MapPin className="w-3 h-3" />{entry.unitLocation}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-primary_color">{entry.typeName}</td>
                      <td className="py-3 pr-3 text-gray-600">{entry.clientName}</td>
                      <td className="py-3 pr-3 font-medium text-primary_color">{formatCurrency(entry.amount, currency)}</td>
                      <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}</td>
                      <td className={`py-3 pr-3 whitespace-nowrap ${entry.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(entry.nextDueDate)}
                        {entry.isOverdue && entry.overdueTime > 0 ? (
                          <span className="block text-xs"> {entry.overdueTime} day{entry.overdueTime === 1 ? '' : 's'} overdue</span>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <DueStatusBadge entry={entry} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded-md text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(entry)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showEventSeries && (
                      <tr className="border-b border-gray-100/80 bg-gray-50/60">
                        <td colSpan={8} className="px-3 pb-4 pt-0">
                          <p className="text-[11px] uppercase tracking-wide text-primary_color/70 pt-2">History</p>
                          <EventSeriesTimeline series={entry.eventSeries} />
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200/80 bg-white p-3">
                  <div className="flex items-start gap-3">
                    {entry.unitCover ? (
                      <img src={entry.unitCover} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><ImageOff className="w-4 h-4 text-gray-400" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-primary_color text-sm leading-snug">{entry.unitName}</p>
                          {entry.unitLocation && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{entry.unitLocation}</p>
                          )}
                        </div>
                        <DueStatusBadge entry={entry} />
                      </div>
                      <p className="text-sm font-semibold text-primary_color mt-2">{formatCurrency(entry.amount, currency)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.typeName} · {entry.clientName}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide">Period</p>
                      <p className="text-primary_color mt-0.5">{formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide">Next due</p>
                      <p className={`mt-0.5 ${entry.isOverdue ? 'text-red-600 font-medium' : 'text-primary_color'}`}>
                        {formatDate(entry.nextDueDate)}
                        {entry.isOverdue && entry.overdueTime > 0 ? ` · ${entry.overdueTime}d overdue` : ''}
                      </p>
                    </div>
                  </div>
                  {showEventSeries && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">History</p>
                      <EventSeriesTimeline series={entry.eventSeries} />
                    </div>
                  )}
                  <div className="mt-3 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="p-2 rounded-md text-primary_color/70 hover:text-primary_color hover:bg-primary_color/10"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(entry)}
                      className="p-2 rounded-md text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-gray-200/70">
              <p className="text-sm text-gray-500">Showing {from}–{to} of {total}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="secondary_button text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Previous
                </button>
                <span className="text-sm text-primary_color">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="secondary_button text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          </>
        )}
          </div>
        </div>

        {showDesktopFilters && !hideFilters && (
          <div className="hidden lg:block w-80 flex-shrink-0 sticky top-20 self-start">
            <div className="lg:bg-white/50 border-l border-gray-200 p-4 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} className="secondary_button text-sm">Clear All</button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDesktopFilters(false)}
                    className="secondary_button text-sm !p-2"
                    title="Hide Filters"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {filterFields}
            </div>
          </div>
        )}

        {showMobileFilters && !hideFilters && (
          <div className="fixed inset-0 bg-white/70 z-50 lg:hidden overflow-y-auto">
            <div className="w-full mt-20 p-4">
              <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button type="button" onClick={() => setShowMobileFilters(false)} className="secondary_button text-sm flex items-center gap-2">
                    <FiX className="w-4 h-4" /> Cancel
                  </button>
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="secondary_button text-sm mb-4 w-full">Clear All</button>
                )}
                {filterFields}
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-primary_color">{editingId ? 'Edit Chargeable Entry' : 'Add Chargeable Entry'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-primary_color/70 hover:bg-primary_color/10">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {types.length === 0 && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  Create a chargeable type first from Chargeable types.
                </p>
              )}

              {lockedUnit?.id ? (
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-1">Unit / Property</label>
                  <p className="text-sm text-primary_color bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {lockedUnit.name || lockedUnit.title || 'This listing'}
                  </p>
                </div>
              ) : (
              <PropertySearchField
                token={token}
                label="Unit / Property"
                value={form.unitId}
                selected={selectedUnit}
                attachedOnly
                placeholder="Search and select a property or unit…"
                onSelect={(item) => {
                  if (editingId) return
                  setSelectedUnit(item)
                  setForm((prev) => ({ ...prev, unitId: item.id, chargeableType: '' }))
                }}
                onClear={() => {
                  if (editingId) return
                  setSelectedUnit(null)
                  setForm((prev) => ({ ...prev, unitId: '', chargeableType: '' }))
                }}
              />
              )}

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Chargeable type</label>
                <select
                  value={form.chargeableType}
                  disabled={!form.unitId || !!editingId}
                  onChange={(e) => applyDefaults(selectedUnit, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-primary_color disabled:opacity-50"
                >
                  <option value="">Select type</option>
                  {unitTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {selectedUnit && unitTypes.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">This property has no chargeables attached yet.</p>
                )}
              </div>

              <p className="text-sm text-gray-500">Occupant · {occupantLabel || 'Unassigned'}</p>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Amount</label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <span className="px-3 text-sm text-gray-500 border-r border-gray-200 shrink-0">{currency}</span>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full py-2 border-0 rounded-none focus-visible:ring-0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{cadenceLabel || 'Select a type to see the billing cycle'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Period start</label>
                <Input
                  type="date"
                  lang="en-GB"
                  value={form.periodStart}
                  onChange={(e) => {
                    const periodStart = e.target.value
                    const periodEnd = addInterval(periodStart, form.intervalValue, form.intervalUnit)
                    setForm((p) => ({ ...p, periodStart, periodEnd, nextDueDate: addDays(periodEnd, 1) }))
                  }}
                  className="w-full py-2 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Period end</label>
                <Input
                  type="date"
                  lang="en-GB"
                  value={form.periodEnd}
                  onChange={(e) => setForm((p) => ({ ...p, periodEnd: e.target.value, nextDueDate: addDays(e.target.value, 1) }))}
                  className="w-full py-2 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Next due</label>
                <p className="text-sm text-primary_color">
                  {formatChargeableDate(form.nextDueDate || (form.periodEnd ? addDays(form.periodEnd, 1) : ''))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Notification time</label>
                <Input type="time" value={form.nextDueTime} onChange={(e) => setForm((p) => ({ ...p, nextDueTime: e.target.value }))} className="w-full py-2 border-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {form.status === 'Paid' && (
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-1">Paid at</label>
                  <Input type="date" lang="en-GB" value={form.paidAt} onChange={(e) => setForm((p) => ({ ...p, paidAt: e.target.value }))} className="w-full py-2 border-gray-200" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary_color mb-1">Billing reference</label>
                <Input value={form.billingReference} onChange={(e) => setForm((p) => ({ ...p, billingReference: e.target.value }))} className="w-full py-2 border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button type="button" onClick={() => setModalOpen(false)} className="secondary_button py-2 px-4 text-sm">Cancel</button>
              <button type="button" onClick={submit} disabled={saving || !form.unitId || !form.chargeableType} className="primary_button py-2 px-4 text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-base font-semibold text-primary_color">Delete this entry?</h3>
            <p className="text-sm text-gray-600 mt-2">
              {deleteTarget.typeName || 'This charge'} on {deleteTarget.unitName || 'this property'} will be removed.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setDeleteTarget(null)} className="secondary_button py-2 px-4 text-sm" disabled={deleting}>
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="primary_button py-2 px-4 text-sm disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
