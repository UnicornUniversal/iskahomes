'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CreditCard, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const LatestServiceCharge = ({ limit = 10 }) => {
  const { user, developerToken } = useAuth()
  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const currency = 'GHS' // Default; could be derived from user profile
  const developerSlug = user?.profile?.slug || user?.profile?.id || user?.profile?.organization_slug

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-bold text-primary_color">Latest Service Charges</h3>
        </div>
        {charges.length > 0 && (
          <span className="text-sm text-primary_color">{charges.length}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-primary_color">{error}</div>
      ) : charges.length > 0 ? (
        <div className="flex flex-col gap-4">
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
