'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  FiActivity,
  FiUser,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiEye,
  FiFilter,
  FiClock,
} from 'react-icons/fi'

const EVENT_LABELS = {
  auth_signup: 'Account created',
  auth_signin: 'Signed in',
  auth_signout: 'Signed out',
  auth_email_verified: 'Email verified',
  auth_password_reset: 'Password reset',
  auth_password_changed: 'Password changed',
  auth_password_reset_requested: 'Password reset requested',
  auth_admin_created: 'Admin created',
  agent_invitation_sent: 'Agent invitation sent',
  agent_invitation_accepted: 'Agent invitation accepted',
  team_invitation_sent: 'Team invitation sent',
  team_invitation_accepted: 'Team invitation accepted',
  developer_profile_updated: 'Profile updated',
  agency_profile_updated: 'Profile updated',
  agent_profile_updated: 'Profile updated',
  seeker_profile_updated: 'Profile updated',
  listing_updated: 'Listing updated',
  listing_deleted: 'Listing deleted',
  development_created: 'Development created',
  lead_created: 'Lead created',
  saved_listing_added: 'Saved listing',
  saved_listing_removed: 'Removed saved listing',
  team_member_updated: 'Team member updated',
  team_member_removed: 'Team member removed',
  agent_updated: 'Agent updated',
  message_sent: 'Message sent',
  conversation_created: 'Conversation created',
  subscription_created: 'Subscription created',
  lead_listed: 'Leads listed',
  lead_viewed: 'Lead viewed',
  lead_updated: 'Lead updated',
  appointment_created: 'Appointment created',
  appointment_listed: 'Appointments listed',
  appointment_updated: 'Appointment updated',
  appointment_latest_viewed: 'Latest appointments viewed',
  reminder_listed: 'Reminders listed',
  reminder_created: 'Reminder created',
  reminder_updated: 'Reminder updated',
  reminder_deleted: 'Reminder deleted',
  subscription_cancelled: 'Subscription cancelled',
  subscription_history_viewed: 'Subscription history viewed',
  invoice_listed: 'Invoices listed',
  billing_viewed: 'Billing viewed',
  billing_created: 'Billing created',
  billing_updated: 'Billing updated',
  conversation_viewed: 'Conversation viewed',
  conversation_marked_read: 'Conversation marked as read',
  analytics_viewed: 'Analytics viewed',
  development_stats_viewed: 'Development stats viewed',
  listing_by_user_listed: 'User listings listed',
  listing_listed: 'Listings listed',
  listing_created: 'Listing created',
  subscription_listed: 'Subscription listed',
  message_listed: 'Messages listed',
  conversation_listed: 'Conversations listed',
  team_listed: 'Team listed',
  unit_listed: 'Units listed',
  unit_viewed: 'Unit viewed',
  unit_updated: 'Unit updated',
  unit_deleted: 'Unit deleted',
  client_listed: 'Clients listed',
  client_created: 'Client created',
  client_viewed: 'Client viewed',
  client_updated: 'Client updated',
  client_deleted: 'Client deleted',
  transaction_record_listed: 'Transaction records listed',
  transaction_record_created: 'Transaction record created',
  transaction_record_viewed: 'Transaction record viewed',
  transaction_record_updated: 'Transaction record updated',
  transaction_record_deleted: 'Transaction record deleted',
  subscription_request_listed: 'Subscription requests listed',
  subscription_request_created: 'Subscription request created',
  subscription_request_updated: 'Subscription request updated',
  search_performed: 'Search performed',
  development_searched: 'Development searched',
  upload_completed: 'Upload completed',
  listing_step_saved: 'Listing step saved',
  development_viewed: 'Development viewed',
  development_updated: 'Development updated',
  development_deleted: 'Development deleted',
  subscription_request_viewed: 'Subscription request viewed',
  client_assignment_listed: 'Client assignments listed',
  client_assignment_created: 'Client assignment created',
  client_assignment_updated: 'Client assignment updated',
  client_assignment_removed: 'Client assignment removed',
  client_document_listed: 'Client documents listed',
  client_document_uploaded: 'Client document uploaded',
  client_document_removed: 'Client document removed',
  service_charge_listed: 'Service charges listed',
  service_charge_created: 'Service charge created',
  service_charge_updated: 'Service charge updated',
  service_charge_deleted: 'Service charge deleted',
  transaction_listed: 'Transactions listed',
  transaction_created: 'Transaction created',
  transaction_updated: 'Transaction updated',
  transaction_deleted: 'Transaction deleted',
  developer_profile_viewed: 'Developer profile viewed',
  developer_analytics_viewed: 'Developer analytics viewed',
  developer_public_profile_viewed: 'Developer public profile viewed',
  developer_team_listed: 'Developer team listed',
  listing_viewed: 'Listing viewed',
  listing_resume_checked: 'Listing resume checked',
  development_listed: 'Developments listed',
  message_viewed: 'Message viewed',
  reminder_viewed: 'Reminder viewed',
  sales_viewed: 'Sales viewed',
  agency_profile_viewed: 'Agency profile viewed',
  agency_agents_listed: 'Agency agents listed',
  agency_agent_invitation_sent: 'Agency agent invitation sent',
  agency_agent_invitation_accepted: 'Agency agent invitation accepted',
  agency_agent_viewed: 'Agency agent viewed',
  agency_agent_updated: 'Agency agent updated',
  agency_agent_removed: 'Agency agent removed',
  agency_listings_listed: 'Agency listings listed',
  agent_profile_viewed: 'Agent profile viewed',
  user_listings_listed: 'User listings listed',
  unit_created: 'Unit created',
}

const UserTypeBadge = ({ type }) => {
  const config = {
    developer: { label: 'Developer', className: 'bg-slate-100 text-slate-700' },
    agency: { label: 'Agency', className: 'bg-indigo-100 text-indigo-700' },
    agent: { label: 'Agent', className: 'bg-violet-100 text-violet-700' },
    team_member: { label: 'Team', className: 'bg-amber-100 text-amber-700' },
    property_seeker: { label: 'Seeker', className: 'bg-emerald-100 text-emerald-700' },
  }
  const { label, className } = config[type] || { label: type, className: 'bg-gray-100 text-gray-700' }
  return <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>{label}</span>
}

const AuditTrail = () => {
  const { developerToken, agencyToken } = useAuth()
  const token = developerToken || agencyToken

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState('')
  const [exportFormat, setExportFormat] = useState('csv')
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!token) return

    let isMounted = true
    const controller = new AbortController()

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/audit/users', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (isMounted && data.users) setUsers(data.users)
      } catch {
        // Ignore - users dropdown will be empty
      }
    }
    fetchUsers()
    return () => { isMounted = false; controller.abort() }
  }, [token])

  useEffect(() => {
    setPage(0)
  }, [dateFrom, dateTo, selectedUserId])

  useEffect(() => {
    if (!token) return

    let isMounted = true
    const controller = new AbortController()

    const fetchAuditEvents = async () => {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        if (selectedUserId) params.set('userId', selectedUserId)
        params.set('page', String(page))
        params.set('page_size', '15')

        const query = params.toString()
        const response = await fetch(`/api/audit/events${query ? `?${query}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load audit events')
        }

        const result = await response.json()
        if (isMounted) {
          setEvents(Array.isArray(result.events) ? result.events : [])
          setHasMore(!!result?.pagination?.has_more)
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (isMounted) {
          setEvents([])
          setHasMore(false)
          setError(err?.message || 'Failed to load audit events')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAuditEvents()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [token, dateFrom, dateTo, selectedUserId, page])

  const usersFromEvents = useMemo(() => {
    const byId = new Map()
    events.forEach((evt) => {
      const userId = evt.user_id || evt.distinct_id
      if (!userId || userId === 'anonymous' || byId.has(userId)) return
      const u = users.find(x => x.user_id === userId)
      byId.set(userId, {
        user_id: userId,
        name: u?.name || evt.properties?.user_name || evt.properties?.name || (userId.length > 24 ? `${userId.slice(0, 8)}…` : userId),
        role: u?.role || evt.user_type || 'User',
      })
    })
    return Array.from(byId.values())
  }, [events, users])

  const dropdownUsers = users.length > 0 ? users : usersFromEvents

  const filteredEvents = useMemo(() => events, [events])

  const getActionIcon = (eventName) => {
    if (eventName?.includes('deleted') || eventName?.includes('removed')) return FiTrash2
    if (eventName?.includes('created') || eventName?.includes('invitation') || eventName?.includes('added')) return FiPlus
    if (eventName?.includes('updated') || eventName?.includes('changed')) return FiEdit2
    return FiEye
  }

  const formatEventTime = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return '—'
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/\s/g, '-')
    const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return `${datePart} ${timePart}`
  }

  const getUserName = (userId, evt) => {
    if (!userId) return '—'
    if (userId === 'anonymous' || userId === 'unknown') {
      return evt?.event === 'lead_created' ? 'Visitor' : 'Anonymous'
    }
    const u = dropdownUsers.find((x) => x.user_id === userId)
    return u?.name || (userId.length > 24 ? userId.slice(0, 8) + '…' : userId)
  }

  const handleExport = async () => {
    if (!token || exporting) return
    try {
      setExporting(exportFormat)
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (selectedUserId) params.set('userId', selectedUserId)
      params.set('export', exportFormat)

      const response = await fetch(`/api/audit/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = exportFormat === 'excel' ? 'xls' : exportFormat
      link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.message || 'Failed to export audit trail')
    } finally {
      setExporting('')
    }
  }

  if (!token) {
    return (
      <div className="p-12 text-center">
        <p className="text-primary_color">Please sign in to view the audit trail.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="rounded-xl p-3 bg-white/30 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary_color">
          <FiFilter className="w-4 h-4 text-primary_color" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-medium text-primary_color">Team member</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full"
            >
              <option value="">All</option>
              {dropdownUsers.map((u, i) => (
                <option key={`${u.user_id}-${i}`} value={u.user_id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-medium text-primary_color">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={today}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-medium text-primary_color">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={today}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-medium text-primary_color">Export</label>
            <div className="flex items-center gap-2 w-full">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
              <button type="button" onClick={handleExport} disabled={!!exporting} className="secondary_button whitespace-nowrap">
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-primary_color uppercase tracking-wide flex items-center gap-2">
          <FiActivity className="w-4 h-4" />
          Activity log
        </h2>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-primary_color/80">Loading activity...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-primary_color/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiActivity className="w-8 h-8 text-primary_color" />
            </div>
            <h3 className="text-lg font-medium text-primary_color mb-2">No activity yet</h3>
            <p className="text-primary_color/80 text-sm max-w-sm mx-auto">
              {dateFrom || dateTo || selectedUserId
                ? 'No events match your filters. Try adjusting date range or team member.'
                : 'Activity will appear here as you make changes.'}
            </p>
          </div>
        ) : (
          <>
          <div className="divide-y divide-primary_color/20">
            {filteredEvents.map((evt, index) => {
              const ActionIcon = getActionIcon(evt.event)
              const uniqueKey = evt.uuid ? `${evt.uuid}-${index}` : `evt-${index}-${evt.timestamp || ''}-${evt.event}`
              const label = evt.event ? (EVENT_LABELS[evt.event] || evt.event.replace(/_/g, ' ')) : 'Unknown action'
              const userName = getUserName(evt.user_id || evt.distinct_id, evt)
              return (
                <div key={uniqueKey} className="flex items-start gap-3 py-3 px-1 hover:bg-primary_color/10 rounded-lg transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary_color/10 text-primary_color flex items-center justify-center">
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-primary_color">{label}</span>
                      {evt.user_type && <UserTypeBadge type={evt.user_type} />}
                    </div>
                    {evt.event === 'lead_created' && (evt.properties?.context_type || evt.properties?.lead_type) && (
                      <p className="text-xs text-primary_color/70 mb-1">
                        {evt.properties.context_type === 'development' && 'Development'}
                        {evt.properties.context_type === 'listing' && 'Listing'}
                        {evt.properties.context_type === 'profile' && 'Profile'}
                        {evt.properties.lead_type ? ` • ${evt.properties.lead_type}` : ''}
                      </p>
                    )}
                    {/* {evt.api_route && evt.event !== 'lead_created' && (
                      <p className="text-xs text-primary_color/70 font-mono mb-1 truncate">{evt.api_route}</p>
                    )} */}
                    {evt.metadata?.updated_fields?.length > 0 && (
                      <p className="text-sm text-primary_color/80 mb-1">
                        Updated: {evt.metadata.updated_fields.join(', ')}
                      </p>
                    )}
                    {(evt.metadata?.listing_id || evt.properties?.listing_id) && (
                      <p className="text-xs text-primary_color/70">Listing ID: {evt.metadata?.listing_id || evt.properties?.listing_id}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-primary_color/70">
                      <span className="flex items-center gap-1">
                        <FiUser className="w-3.5 h-3.5" />
                        {userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5" />
                        {formatEventTime(evt.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-primary_color/70">Page {page + 1}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={loading || page === 0}
                className="secondary_button disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || !hasMore}
                className="secondary_button disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AuditTrail
