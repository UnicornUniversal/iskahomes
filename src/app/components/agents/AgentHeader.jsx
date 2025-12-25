'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AgentSearch from './AgentSearch'

const AgentHeader = () => {
  const { user, agentToken } = useAuth()
  const [agent, setAgent] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    const fetchAgentProfile = async () => {
      try {
        const token = user?.token || agentToken
        
        if (!token) return

        const response = await fetch('/api/agents/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (isMounted && result.success) {
            setAgent(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching agent profile:', error)
      }
    }

    fetchAgentProfile()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.token, agentToken])

  const agentName = agent?.name || user?.profile?.name || 'Agent'

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-center bg-primary_color/5 p-[2em] rounded-lg">
      <div className="w-full flex flex-col gap-2">
        <h6 className="text-sm text-gray-600">Welcome</h6>
        <h2 className="text-primary_color text-2xl font-bold">{agentName}</h2>
      </div>
      <AgentSearch />
    </div>
  )
}

export default AgentHeader
