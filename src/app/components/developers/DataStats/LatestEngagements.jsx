'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
const LatestEngagements = ({ limit = 10 }) => {
  const { user, developerToken } = useAuth()
  const token = () => developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : null)
  const [engagements, setEngagements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id || !token()) {
      setLoading(false)
      return
    }

    loadEngagements()
  }, [user?.id, developerToken, limit])

  async function loadEngagements() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/engagements/latest?limit=${limit}`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {}
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setEngagements(result.data || [])
      } else {
        setError(result.error || 'Failed to load engagements')
        setEngagements([])
      }
    } catch (err) {
      console.error('Error loading engagements:', err)
      setError('Failed to load engagements')
      setEngagements([])
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return null
    try {
      const d = new Date(dateTime)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      return `${dateStr} ${timeStr}`
    } catch {
      return dateTime
    }
  }

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-gray-100 text-primary_color'
    if (status === 'Overdue') return 'bg-red-50 text-red-700'
    return 'bg-yellow-50 text-yellow-700'
  }

  const developerSlug = user?.profile?.slug || user?.profile?.id || user?.profile?.organization_slug

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-bold text-primary_color">Latest Engagements</h3>
        </div>
        {engagements.length > 0 && (
          <span className="text-sm text-primary_color">{engagements.length}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-primary_color">{error}</div>
      ) : engagements.length > 0 ? (
        <div className="flex flex-col gap-4">
          {engagements.map((eng) => (
            <Link
              key={eng.id}
              href={developerSlug ? `/developer/${developerSlug}/clientManagement/${eng.clientId}` : '#'}
              className="block"
            >
              <div className="bg-white/30 rounded-lg p-4 border border-gray-100/50 hover:border-primary_color/30 transition-colors">
                <div className="mb-3">
                  <p className="text-xs mb-1 font-medium text-primary_color">{eng.heading || 'Reminder'}</p>
                  {eng.note && (
                    <p className="text-xs leading-relaxed text-primary_color line-clamp-2">{eng.note}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-primary_color">{formatDateTime(eng.dateTime)}</p>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(eng.status)}`}>
                    {eng.status || 'Pending'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <p className="text-xs font-medium text-primary_color">{eng.clientName}</p>
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
            <Bell className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-primary_color">No reminder engagements yet</p>
        </div>
      )}
    </div>
  )
}

export default LatestEngagements
