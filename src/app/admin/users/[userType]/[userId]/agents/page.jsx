'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiUsers } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

export default function AgencyAgentsPage() {
  const params = useParams()
  const urlType = params?.userType || 'agencies'
  const userType = URL_TO_TYPE[urlType] || 'agency'
  const userId = params?.userId

  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userType !== 'agency') {
      setLoading(false)
      return
    }
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}/agents`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setAgents(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  if (loading) return <div className="text-primary_color/70">Loading agents...</div>
  if (userType !== 'agency') return <div className="text-primary_color/70">Agents are only available for agencies.</div>

  return (
    <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-6 py-4 font-semibold text-primary_color border-b border-primary_color/20">Agents</h2>
      {agents.length === 0 ? (
        <div className="p-8 text-center text-primary_color/70">No agents found.</div>
      ) : (
        <div className="divide-y divide-primary_color/10">
          {agents.map((agent) => (
            <div key={agent.agent_id} className="px-6 py-4 flex items-center justify-between hover:bg-primary_color/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary_color/20 flex items-center justify-center overflow-hidden">
                  {agent.profile_image ? (
                    <img src={typeof agent.profile_image === 'object' ? agent.profile_image?.url : agent.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FiUsers className="w-5 h-5 text-primary_color" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-primary_color">{agent.name}</p>
                  <p className="text-sm text-primary_color/70">{agent.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary_color/80">{agent.total_listings || 0} listings</span>
                <span className={`px-2 py-1 text-xs rounded-full ${agent.account_status === 'active' ? 'bg-primary_color/20 text-primary_color' : 'bg-secondary_color/20 text-secondary_color'}`}>
                  {agent.account_status}
                </span>
                <Link
                  href={`/admin/users/agents/${agent.agent_id}/profile`}
                  className="primary_button text-sm px-3 py-2"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
