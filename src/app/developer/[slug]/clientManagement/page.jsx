'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiPlus, FiSearch, FiBriefcase, FiUser, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { CLIENT_STATUSES, CLIENT_SOURCE_CHANNELS } from './dummyClients'

const ClientManagementPage = () => {
  const params = useParams()
  const slug = params?.slug || ''
  const { developerToken, user } = useAuth()
  const isAdminOrSuperAdmin = !user?.profile?.permissions || /^(super\s*admin|admin)$/i.test(String(user?.profile?.role_name || '').trim())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = developerToken || localStorage.getItem('developer_token')
    if (!token) return
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (statusFilter) qs.set('status', statusFilter)
    if (sourceFilter) qs.set('source', sourceFilter)
    fetch(`/api/clients?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setClients(data.data || [])
        else setError(data.error || 'Failed to load clients')
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [developerToken, search, statusFilter, sourceFilter])

  const filteredClients = clients
  const basePath = `/developer/${slug}/clientManagement`

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-primary_color">Client Management</h1>
            <p className="text-primary_color/80 mt-1">Manage your clients, assignments, and engagement</p>
          </div>
          {isAdminOrSuperAdmin && (
          <Link
            href={`${basePath}/addNewClient`}
            className="primary_button inline-flex items-center justify-center gap-2 text-sm py-2 px-4"
          >
            <FiPlus className="w-5 h-5" />
            Add New Client
          </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 default_bg rounded-xl border border-white/40">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary_color/60" />
            <input
              type="text"
              placeholder="Search by name, code, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 default_bg border border-white/40 rounded-lg text-sm text-primary_color placeholder:text-primary_color/50 focus:outline-none focus:ring-2 focus:ring-primary_color/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 default_bg border border-white/40 rounded-lg text-sm text-primary_color focus:outline-none focus:ring-2 focus:ring-primary_color/30"
          >
            <option value="">All statuses</option>
            {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-2 default_bg border border-white/40 rounded-lg text-sm text-primary_color focus:outline-none focus:ring-2 focus:ring-primary_color/30"
          >
            <option value="">All sources</option>
            {CLIENT_SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="default_bg rounded-xl border border-white/40 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-primary_color/80">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary_color border-t-transparent mx-auto mb-3" />
              <p>Loading clients...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center text-primary_color/80">
              <FiBriefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No clients match your filters.</p>
              {isAdminOrSuperAdmin && (
              <Link href={`${basePath}/addNewClient`} className="text-primary_color font-medium mt-2 inline-block hover:underline">Add your first client</Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredClients.map(client => (
                <Link
                  key={client.id}
                  href={`${basePath}/${client.id}`}
                  className="default_bg rounded-xl border border-white/40 overflow-hidden hover:border-primary_color/30 transition-colors p-4 flex flex-col min-w-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary_color/10 flex items-center justify-center flex-shrink-0 border border-white/40">
                      {client.avatarUrl ? (
                        <img src={client.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <FiUser className="w-6 h-6 text-primary_color" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary_color truncate">{client.name}</p>
                      <p className="text-sm text-primary_color/70">{client.clientType}</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary_color/60 mt-2 line-clamp-2">
                    {client.address?.fullAddress || [client.address?.town, client.address?.city, client.address?.state, client.address?.country].filter(Boolean).join(', ') || '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      client.status === 'Active' ? 'bg-primary_color/20 text-primary_color' :
                      client.status === 'Qualified' ? 'bg-primary_color/15 text-primary_color' :
                      client.status === 'Lead' ? 'bg-primary_color/10 text-primary_color' :
                      'default_bg text-primary_color/80'
                    }`}>
                      {client.status}
                    </span>
                    <span className="text-sm text-primary_color/70">
                      {(client.units || client.clientsProperties || []).length} unit{((client.units || client.clientsProperties || []).length) !== 1 ? 's' : ''} purchased
                    </span>
                  </div>
                  {(client.assignedUsers || []).length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-sm text-primary_color/70">
                      <FiUsers className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{(client.assignedUsers || []).map(u => u.name).join(', ')}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientManagementPage
