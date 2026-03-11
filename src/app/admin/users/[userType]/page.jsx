'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiSearch, FiHome, FiUsers, FiUser, FiEye } from 'react-icons/fi'

const USER_TYPE_CONFIG = {
  developer: { label: 'Developers', icon: FiHome, idField: 'developer_id' },
  agent: { label: 'Agents', icon: FiUsers, idField: 'agent_id' },
  agency: { label: 'Agencies', icon: FiHome, idField: 'agency_id' },
  property_seeker: { label: 'Property Seekers', icon: FiUser, idField: 'id' }
}

const URL_TO_API_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

export default function UsersListPage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_API_TYPE[urlType] || 'developer'
  const config = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG.developer

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      type: userType,
      page: '1',
      limit: '20',
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter !== 'all' && { status: statusFilter })
    })
    fetch(`/api/admin/users?${params}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setUsers(result.data)
          setPagination(result.pagination || {})
        }
      })
      .finally(() => setLoading(false))
  }, [userType, debouncedSearch, statusFilter])

  const getStatusBadge = (user) => {
    const status = userType === 'property_seeker' ? user.status : (user.verified ? 'verified' : user.account_status || 'pending')
    const isActive = ['verified', 'active'].includes(status)
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-primary_color/20 text-primary_color' : 'bg-secondary_color/20 text-secondary_color'}`}>
        {status || 'pending'}
      </span>
    )
  }

  const getId = (user) => user[config.idField] || user.id

  const statusOptions = userType === 'property_seeker'
    ? ['all', 'active', 'inactive']
    : ['all', 'verified', 'pending', 'active', 'suspended']

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-primary_color mb-2">{config.label}</h1>
      <p className="text-primary_color/80 text-sm mb-4">Manage {config.label.toLowerCase()} on the platform.</p>

      <div className="secondary_bg p-4 rounded-2xl mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg"
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="secondary_bg p-8 rounded-2xl text-center text-primary_color/70">Loading...</div>
      ) : (
        <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary_color/20">
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Status</th>
                  {userType !== 'property_seeker' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Listings</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={getId(user)} className="border-b border-primary_color/10 hover:bg-primary_color/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary_color/20 flex items-center justify-center">
                          <config.icon className="w-5 h-5 text-primary_color" />
                        </div>
                        <div>
                          <div className="font-medium text-primary_color">{user.name || '—'}</div>
                          <div className="text-xs text-primary_color/60">{user.slug || getId(user)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary_color">{user.email || '—'}</div>
                      <div className="text-sm text-primary_color/60">{user.phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(user)}</td>
                    {userType !== 'property_seeker' && (
                      <td className="px-6 py-4 text-sm text-primary_color">
                        {user.total_listings ?? user.total_units ?? '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${urlType}/${encodeURIComponent(getId(user))}`}
                        className="primary_button inline-flex items-center gap-1 text-sm px-3 py-2"
                      >
                        <FiEye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-primary_color/70">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}
