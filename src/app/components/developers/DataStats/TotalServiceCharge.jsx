'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CreditCard, Filter, ChevronRight, List, Calendar, CalendarClock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import DataCard from '@/app/components/developers/DataCard'

const TotalServiceCharge = () => {
  const { user, developerToken } = useAuth()
  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const [charges, setCharges] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clientFilter, setClientFilter] = useState('')
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

  const loadCharges = useCallback(async () => {
    if (!user?.id || !token()) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (clientFilter) params.set('clientId', clientFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (overdueFilter !== 'all') params.set('filter', overdueFilter)

      const response = await fetch(`/api/clients/service-charges/all?${params}`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {}
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setCharges(result.data || [])
        setClients(result.clients || [])
      } else {
        setError(result.error || 'Failed to load service charges')
        setCharges([])
        setClients([])
      }
    } catch (err) {
      console.error('Error loading service charges:', err)
      setError('Failed to load service charges')
      setCharges([])
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, developerToken, clientFilter, statusFilter, overdueFilter])

  useEffect(() => {
    if (!user?.id || !token()) {
      setLoading(false)
      return
    }
    loadCharges()
  }, [user?.id, developerToken, loadCharges])

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

  const currency = 'GHS'
  const developerSlug = user?.profile?.slug || user?.profile?.id || user?.profile?.organization_slug

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      {/* Heading & Subheading */}
      <div className="mb-2">
        <h1 className="text-primary_color  mb-1">Service Charge</h1>
        <p className="text-gray-600 text-sm">Track and manage all service charges across your clients</p>
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

        {/* Filters */}
        <div className="rounded-xl p-5 bg-white/30 mb-6 overflow-x-auto">
          <div className=" gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary_color flex-shrink-0">
              <Filter className="w-4 h-4 text-primary_color" />
              Filters
            </div>
            <br/>
           <div className="grid grid-cols-3 items-center gap-2">
           <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color min-w-[140px] flex-shrink-0"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color min-w-[140px] flex-shrink-0"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={overdueFilter}
              onChange={(e) => setOverdueFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color min-w-[140px] flex-shrink-0"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue only</option>
            </select>
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
                  <th className="pb-3 font-semibold text-gray-700">Property</th>
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
                    <td className="py-4 text-gray-600">
                      {charge.unitName && charge.unitName !== '—' ? charge.unitName : '—'}
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
              {clientFilter || statusFilter || overdueFilter !== 'all'
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
