'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FiHome } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

export default function DeveloperDevelopmentsPage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const userId = params?.userId

  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userType !== 'developer') {
      setLoading(false)
      return
    }
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}/developments`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setDevelopments(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  if (loading) return <div className="text-primary_color/70">Loading developments...</div>
  if (userType !== 'developer') return <div className="text-primary_color/70">Developments are only available for developers.</div>

  return (
    <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-6 py-4 font-semibold text-primary_color border-b border-primary_color/20">Developments</h2>
      {developments.length === 0 ? (
        <div className="p-8 text-center text-primary_color/70">No developments found.</div>
      ) : (
        <div className="divide-y divide-primary_color/10">
          {developments.map((dev) => (
            <div key={dev.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary_color/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary_color/10 flex items-center justify-center">
                  <FiHome className="w-6 h-6 text-primary_color/60" />
                </div>
                <div>
                  <p className="font-medium text-primary_color">{dev.title}</p>
                  <p className="text-sm text-primary_color/70">
                    {[dev.city, dev.country].filter(Boolean).join(', ')} • {dev.total_units || 0} units • {dev.development_status || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
