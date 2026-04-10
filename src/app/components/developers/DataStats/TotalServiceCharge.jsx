'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CreditCard, Filter, ChevronRight, List, Calendar, CalendarClock, AlertCircle, Printer, MapPin, ImageOff } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import DataCard from '@/app/components/developers/DataCard'
import {
  buildServiceChargeFullPageReportHtml,
  openPrintableHtmlDocument,
  getExportTimestampLabel,
} from '@/lib/developerExportDocuments'

const TotalServiceCharge = () => {
  const { user, developerToken } = useAuth()
  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const [charges, setCharges] = useState([])
  const [clients, setClients] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [overdueFilter, setOverdueFilter] = useState('all')

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

    let totalEntries = 0
    let totalDueThisMonth = 0
    let totalDueNextMonth = 0
    let totalOverdue = 0

    charges.forEach((c) => {
      totalEntries += 1
      const paid = (c.status || '').toLowerCase() === 'paid'
      if (paid) return

      const dueDate = c.nextDueDate ? new Date(c.nextDueDate) : null
      if (!dueDate) return

      dueDate.setHours(0, 0, 0, 0)
      if (dueDate < today) {
        totalOverdue += c.amount || 0
      } else if (dueDate >= thisMonthStart && dueDate <= thisMonthEnd) {
        totalDueThisMonth += c.amount || 0
      } else if (dueDate >= nextMonthStart && dueDate <= nextMonthEnd) {
        totalDueNextMonth += c.amount || 0
      }
    })

    return { totalEntries, totalDueThisMonth, totalDueNextMonth, totalOverdue }
  }, [charges, today])

  const currency = useMemo(() => {
    let locations = user?.profile?.company_locations
    if (typeof locations === 'string') {
      try {
        locations = JSON.parse(locations)
      } catch {
        return 'GHS'
      }
    }
    if (Array.isArray(locations)) {
      const primary = locations.find((loc) => loc.primary_location === true)
      if (primary?.currency) return primary.currency
    }
    return 'GHS'
  }, [user?.profile?.company_locations])

  const loadCharges = useCallback(async () => {
    if (!user?.id || !token()) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (clientFilter) params.set('clientId', clientFilter)
      if (propertyFilter) params.set('unitId', propertyFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (overdueFilter !== 'all') params.set('filter', overdueFilter)

      const response = await fetch(`/api/clients/service-charges/all?${params}`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {}
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setCharges(result.data || [])
        setClients(result.clients || [])
        setProperties(result.properties || [])
      } else {
        setError(result.error || 'Failed to load service charges')
        setCharges([])
        setClients([])
        setProperties([])
      }
    } catch (err) {
      console.error('Error loading service charges:', err)
      setError('Failed to load service charges')
      setCharges([])
      setClients([])
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, developerToken, clientFilter, propertyFilter, statusFilter, overdueFilter])

  useEffect(() => {
    if (!user?.id || !token()) {
      setLoading(false)
      return
    }
    loadCharges()
  }, [user?.id, developerToken, loadCharges])

  useEffect(() => {
    setPropertyFilter('')
  }, [clientFilter])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (charge) => {
    if (charge.isOverdue) {
      return (
        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
          Overdue
        </span>
      )
    }
    if (charge.isDueSoon) {
      return (
        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
          Due soon
        </span>
      )
    }
    return (
      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-primary_color">
        {charge.status || 'Pending'}
      </span>
    )
  }

  const developerSlug = user?.profile?.slug || user?.profile?.id || user?.profile?.organization_slug
  const organizationName =
    user?.profile?.name ||
    user?.profile?.organization_name ||
    'Developer account'

  const filterSummaryParts = useMemo(() => {
    const parts = []
    const clientName = clients.find((c) => c.id === clientFilter)?.name
    const propName = properties.find((p) => p.id === propertyFilter)?.name
    parts.push(clientFilter && clientName ? `Client: ${clientName}` : 'Client: All')
    parts.push(propertyFilter && propName ? `Property: ${propName}` : 'Property: All')
    if (statusFilter) {
      parts.push(`Status: ${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)}`)
    } else {
      parts.push('Status: All')
    }
    parts.push(overdueFilter === 'overdue' ? 'Due: Overdue only' : 'Due: All')
    return parts.join(' · ')
  }, [clients, clientFilter, properties, propertyFilter, statusFilter, overdueFilter])

  const selectFieldClass =
    'text-sm w-full min-w-0 rounded-lg border border-gray-300/80 bg-white/35 px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary_color/25 focus:border-primary_color backdrop-blur-sm'

  const handleExportPdf = () => {
    if (exportingPdf) return
    setExportingPdf(true)
    try {
      const html = buildServiceChargeFullPageReportHtml({
        organizationName,
        generatedAtLabel: getExportTimestampLabel(),
        currency,
        filterSummary: filterSummaryParts,
        stats,
        charges,
      })
      openPrintableHtmlDocument(html, `${organizationName} — Service charges`)
    } catch (e) {
      console.error('PDF export failed:', e)
      alert('Could not open the print view. Allow pop-ups and try again.')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      {/* Heading & Subheading */}
      <div className="mb-2">
        <h1 className="text-primary_color  mb-1">Service Charge</h1>
        <p className="text-gray-600 text-sm">
          Track and manage service charges across your clients. Filter by client, property, status, or due date, then
          use <span className="font-medium text-primary_color/90">Export PDF</span> for a report that includes summary
          totals and the detailed table.
        </p>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="Total Entries"
          value={loading ? '—' : stats.totalEntries.toLocaleString()}
          icon={List}
        />
        <DataCard
          title="Total Due This Month"
          value={loading ? '—' : formatCurrency(stats.totalDueThisMonth, currency)}
          icon={Calendar}
        />
        <DataCard
          title="Total Due Next Month"
          value={loading ? '—' : formatCurrency(stats.totalDueNextMonth, currency)}
          icon={CalendarClock}
        />
        <DataCard
          title="Total Overdue"
          value={loading ? '—' : formatCurrency(stats.totalOverdue, currency)}
          icon={AlertCircle}
        />
      </div>

      {/* Table Section */}
      <div className="secondary_bg p-4 rounded-2xl shadow-sm flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary_color" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary_color">All Service Charges</h2>
            <p className="text-sm text-gray-500">View and filter all service charges</p>
          </div>
        </div>

        {/* Filters + export — full width grid */}
        <div className="rounded-xl p-5 bg-white/30 mb-6 border border-gray-200/40 w-full">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary_color mb-4">
            <Filter className="w-4 h-4 text-primary_color shrink-0" />
            Filters
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <label htmlFor="sc-filter-client" className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75">
                Client
              </label>
              <select
                id="sc-filter-client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className={selectFieldClass}
              >
                <option value="">All clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <label htmlFor="sc-filter-property" className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75">
                Property
              </label>
              <select
                id="sc-filter-property"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className={selectFieldClass}
              >
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <label htmlFor="sc-filter-status" className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75">
                Status
              </label>
              <select
                id="sc-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectFieldClass}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <label htmlFor="sc-filter-due" className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75">
                Due
              </label>
              <select
                id="sc-filter-due"
                value={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.value)}
                className={selectFieldClass}
              >
                <option value="all">All</option>
                <option value="overdue">Overdue only</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full min-w-0 xl:max-w-none">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75">
                Export
              </span>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf || loading}
                className="primary_button w-full flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Printer className="w-4 h-4 shrink-0" />
                )}
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary_color" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-600">{error}</div>
        ) : charges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 font-semibold text-gray-700">Amount</th>
                  <th className="pb-3 font-semibold text-gray-700">Client</th>
                  <th className="pb-3 font-semibold text-gray-700 min-w-[220px]">Property</th>
                  <th className="pb-3 font-semibold text-gray-700">Period</th>
                  <th className="pb-3 font-semibold text-gray-700">Next due</th>
                  <th className="pb-3 font-semibold text-gray-700">Status</th>
                  <th className="pb-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr
                    key={charge.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 font-medium text-primary_color">
                      {formatCurrency(charge.amount, currency)}
                    </td>
                    <td className="py-4 text-gray-700">{charge.clientName}</td>
                    <td className="py-4 align-top">
                      <div className="flex items-start gap-3 min-w-0 max-w-[320px]">
                        <div className="relative h-[4.5rem] w-[5.5rem] shrink-0 rounded-lg overflow-hidden bg-gray-100/90 border border-gray-200/90">
                          {charge.unitCoverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={charge.unitCoverImage}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-gray-400 px-1">
                              <ImageOff className="w-5 h-5 opacity-70" aria-hidden />
                              <span className="text-[9px] uppercase tracking-wide text-center leading-tight">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="font-medium text-gray-800 text-sm leading-snug">
                            {charge.unitName && charge.unitName !== '—' ? charge.unitName : '—'}
                          </p>
                          {charge.unitLocation && charge.unitLocation !== '—' ? (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary_color/60" aria-hidden />
                              <span className="leading-relaxed">{charge.unitLocation}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600">
                      {charge.periodStart && charge.periodEnd
                        ? `${formatDate(charge.periodStart)} – ${formatDate(charge.periodEnd)}`
                        : '—'}
                    </td>
                    <td className="py-4">
                      {charge.nextDueDate ? (
                        <span
                          className={
                            charge.isOverdue
                              ? 'text-red-600 font-medium'
                              : charge.isDueSoon
                              ? 'text-amber-700'
                              : 'text-gray-700'
                          }
                        >
                          {charge.isOverdue
                            ? `Overdue since ${formatDate(charge.nextDueDate)}`
                            : formatDate(charge.nextDueDate)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4">{getStatusBadge(charge)}</td>
                    <td className="py-4">
                      {developerSlug && (
                        <Link
                          href={`/developer/${developerSlug}/clientManagement/${charge.clientId}`}
                          className="inline-flex items-center gap-1 text-primary_color hover:underline font-medium"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No service charges found</p>
            <p className="text-sm text-gray-500 mt-1">
              {clientFilter || propertyFilter || statusFilter || overdueFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Service charges will appear here when added to clients'}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default TotalServiceCharge
