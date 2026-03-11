'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FiUsers } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

export default function UserTeamPage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const userId = params?.userId

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}/team`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setMembers(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  if (loading) return <div className="text-primary_color/70">Loading...</div>
  if (!['developer', 'agency'].includes(userType)) {
    return <div className="text-primary_color/70">This user type does not have team members.</div>
  }

  return (
    <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-6 py-4 font-semibold text-primary_color border-b border-primary_color/20">Team Members</h2>
      {members.length === 0 ? (
        <div className="p-8 text-center text-primary_color/70">No team members found.</div>
      ) : (
        <div className="divide-y divide-primary_color/10">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary_color/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary_color/20 flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-primary_color" />
                </div>
                <div>
                  <p className="font-medium text-primary_color">
                    {[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-sm text-primary_color/70">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary_color/80">{member.role?.name || '—'}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${member.status === 'active' ? 'bg-primary_color/20 text-primary_color' : 'bg-secondary_color/20 text-secondary_color'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
