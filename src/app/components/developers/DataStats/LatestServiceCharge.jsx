'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CreditCard, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { ExportDropdown } from '@/app/components/ui/export-dropdown'
import {
  buildServiceChargesExportHtml,
  openPrintableHtmlDocument,
  getExportTimestampLabel,
  csvEscape,
} from '@/lib/developerExportDocuments'

const LatestServiceCharge = ({ limit = 10, currency: currencyProp }) => {
  const { user, developerToken } = useAuth()
  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!user?.id || !token()) {
      setLoading(false)
      return
    }

    loadCharges()
  }, [user?.id, developerToken, limit])

  async function loadCharges() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/service-charges/latest?limit=${limit}`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {}
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setCharges(result.data || [])
      } else {
        setError(result.error || 'Failed to load service charges')
        setCharges([])
      }
    } catch (err) {
      console.error('Error loading service charges:', err)
      setError('Failed to load service charges')
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

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

  const currency = currencyProp || 'GHS'
  const developerSlug = user?.profile?.slug || user?.profile?.id || user?.profile?.organization_slug
  const organizationName =
    user?.profile?.name ||
    user?.profile?.organization_name ||
    'Developer account'

  const handleExport = async (format) => {
    if (!charges.length || exporting) return
    setExporting(true)
    try {
      const exportRows = [
        [
          'Amount',
          'Currency',
          'Status',
          'Property',
          'Client',
          'Period start',
          'Period end',
          'Next due',
        ],
        ...charges.map((c) => [
          c.amount,
          currency,
          c.isOverdue ? 'Overdue' : c.isDueSoon ? 'Due soon' : c.status || 'Pending',
          c.unitName && c.unitName !== '—' ? c.unitName : '—',
          c.clientName || '—',
          c.periodStart || '',
          c.periodEnd || '',
          c.nextDueDate || '',
        ]),
      ]

      const safeOrg = organizationName.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'service-charges'

      if (format === 'csv') {
        const csvContent = exportRows.map((row) => row.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `${safeOrg}-service-charges.csv`
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (format === 'excel') {
        const BOM = '\uFEFF'
        const excelContent = BOM + exportRows.map((row) => row.join('\t')).join('\n')
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `${safeOrg}-service-charges.xls`
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        const html = buildServiceChargesExportHtml({
          organizationName,
          generatedAtLabel: getExportTimestampLabel(),
          currency,
          charges,
        })
        openPrintableHtmlDocument(html, `${organizationName} — Service charges`)
      }
    } catch (err) {
      console.error('Service charge export failed:', err)
      alert('Failed to export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-bold text-primary_color">Latest Service Charges</h3>
        </div>
        <div className="flex items-center gap-3">
          {charges.length > 0 && (
            <span className="text-sm text-primary_color tabular-nums">{charges.length}</span>
          )}
          <ExportDropdown
            onExport={handleExport}
            disabled={exporting || loading || !!error || charges.length === 0}
            className="shrink-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-primary_color">{error}</div>
      ) : charges.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="summary_height flex flex-col gap-4">
            {charges.map((charge) => (
            <Link
              key={charge.id}
              href={developerSlug ? `/developer/${developerSlug}/clientManagement/${charge.clientId}` : '#'}
              className="block"
            >
              <div className="bg-white/30 rounded-lg p-4 border border-gray-100/50 hover:border-primary_color/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-primary_color">
                    {formatCurrency(charge.amount, currency)}
                  </p>
                  {getStatusBadge(charge)}
                </div>

                <div className="space-y-1.5 text-xs text-primary_color">
                  <div>
                    <span className="font-medium">Property: </span>
                    <span>{charge.unitName && charge.unitName !== '—' ? charge.unitName : '—'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Client: </span>
                    <span>{charge.clientName}</span>
                  </div>
                  {charge.periodStart && charge.periodEnd && (
                    <p>
                      Period: {formatDate(charge.periodStart)} – {formatDate(charge.periodEnd)}
                    </p>
                  )}
                  {charge.nextDueDate && (
                    <p className={charge.isOverdue ? 'text-red-600 font-medium' : charge.isDueSoon ? 'text-amber-700' : ''}>
                      {charge.isOverdue ? 'Overdue since ' : 'Due: '}{formatDate(charge.nextDueDate)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
            ))}
          </div>

          {developerSlug && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/developer/${developerSlug}/clientManagement`}
                className="flex items-center justify-center gap-1 text-sm font-medium text-primary_color hover:opacity-80 transition-opacity"
              >
                View All Clients
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-primary_color">No overdue service charges</p>
        </div>
      )}
    </div>
  )
}

export default LatestServiceCharge
