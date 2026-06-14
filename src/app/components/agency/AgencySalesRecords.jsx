'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import CustomDropdown from '@/app/components/developers/units/CustomDropdown'
import { formatCurrency } from '@/lib/utils'
import { User } from 'lucide-react'

const FALLBACK_IMAGE = '/bg.jpg'

const getDefaultDateRange = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  }
}

function formatSaleDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function AgentCell({ name, imageUrl }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary_color/50">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-primary_color truncate">{name}</span>
    </div>
  )
}

function PropertyCell({ name, imageUrl }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
        <img
          src={imageUrl || FALLBACK_IMAGE}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
      </div>
      <span className="text-sm font-medium text-primary_color line-clamp-2">{name}</span>
    </div>
  )
}

export default function AgencySalesRecords({ agencyId, currency = 'GHS' }) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [agentId, setAgentId] = useState('')
  const [purposeId, setPurposeId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [filterOptions, setFilterOptions] = useState({
    agents: [],
    purposes: [],
    types: []
  })

  const pageSize = 15

  const fetchRecords = useCallback(async () => {
    if (!agencyId || !dateRange.startDate || !dateRange.endDate) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        agency_id: agencyId,
        date_from: dateRange.startDate,
        date_to: dateRange.endDate,
        page: String(page),
        page_size: String(pageSize)
      })
      if (agentId) params.append('agent_id', agentId)
      if (purposeId) params.append('purpose_id', purposeId)
      if (typeId) params.append('type_id', typeId)

      const response = await fetch(`/api/sales/agency-records?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setRecords(result.data || [])
        setTotal(result.total || 0)
        if (result.filters) {
          setFilterOptions(result.filters)
        }
      } else {
        setRecords([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Error fetching agency sales records:', error)
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [agencyId, dateRange.startDate, dateRange.endDate, agentId, purposeId, typeId, page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    setPage(1)
  }, [agentId, purposeId, typeId, dateRange.startDate, dateRange.endDate])

  const agentOptions = useMemo(
    () => [
      { value: '', label: 'All agents' },
      ...(filterOptions.agents || []).map((agent) => ({
        value: agent.agent_id,
        label: agent.name
      }))
    ],
    [filterOptions.agents]
  )

  const purposeOptions = useMemo(
    () => [
      { value: '', label: 'All purposes' },
      ...(filterOptions.purposes || []).map((purpose) => ({
        value: purpose.id,
        label: purpose.name
      }))
    ],
    [filterOptions.purposes]
  )

  const typeOptions = useMemo(
    () => [
      { value: '', label: 'All types' },
      ...(filterOptions.types || []).map((type) => ({
        value: type.id,
        label: type.name
      }))
    ],
    [filterOptions.types]
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <div className="secondary_bg rounded-xl border border-gray-100 overflow-hidden text-primary_color">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold">Sales Records</h3>
        <p className="text-sm text-primary_color/70 mt-1">
          Property sales with agent, price, commission, and sale date
        </p>
      </div>

      <div className="px-5 py-4 border-b border-gray-100 bg-white/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CustomDropdown
            options={agentOptions}
            value={agentId}
            onChange={setAgentId}
            placeholder="Filter by agent"
          />
          <CustomDropdown
            options={purposeOptions}
            value={purposeId}
            onChange={setPurposeId}
            placeholder="Filter by purpose"
          />
          <CustomDropdown
            options={typeOptions}
            value={typeId}
            onChange={setTypeId}
            placeholder="Filter by type"
          />
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center text-sm text-primary_color/60">
          No sales found for the selected filters.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-primary_color/70 uppercase tracking-wide">
                    Property
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-primary_color/70 uppercase tracking-wide">
                    Agent
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-primary_color/70 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-primary_color/70 uppercase tracking-wide">
                    Commission
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-primary_color/70 uppercase tracking-wide">
                    Sale Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/40">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-primary_color/5">
                    <td className="px-5 py-4">
                      <PropertyCell name={record.property_name} imageUrl={record.property_image} />
                    </td>
                    <td className="px-5 py-4">
                      <AgentCell name={record.agent_name} imageUrl={record.agent_image} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold">
                      {formatCurrency(record.sale_price, record.currency || currency)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold">
                      {formatCurrency(record.commission_amount, record.currency || currency)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-primary_color/80">
                      {formatSaleDate(record.sale_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {records.map((record) => (
              <div key={record.id} className="p-4 space-y-3 bg-white/40">
                <PropertyCell name={record.property_name} imageUrl={record.property_image} />
                <AgentCell name={record.agent_name} imageUrl={record.agent_image} />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-primary_color/60">Price</p>
                    <p className="font-semibold">
                      {formatCurrency(record.sale_price, record.currency || currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary_color/60">Commission</p>
                    <p className="font-semibold">
                      {formatCurrency(record.commission_amount, record.currency || currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary_color/60">Date</p>
                    <p className="font-medium">{formatSaleDate(record.sale_date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-sm text-primary_color/70">
          {total} sale{total === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPrevPage || loading}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-primary_color disabled:opacity-50 hover:bg-primary_color/5"
          >
            Previous
          </button>
          <span className="text-sm text-primary_color/70">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || loading}
            className="px-3 py-1.5 text-sm rounded-lg bg-primary_color text-white disabled:opacity-50 hover:bg-primary_color/90"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
