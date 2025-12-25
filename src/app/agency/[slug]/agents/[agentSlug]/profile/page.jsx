'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiUser, FiBarChart2, FiLoader } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import AgentProfile from '@/app/components/agency/AgentProfile'

export default function AgentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { slug, agentSlug } = params
  
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pathname = usePathname()
  
  // Determine active tab from pathname
  const activeTab = pathname?.includes('/agentMetrics') ? 'metrics' : 'profile'

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'metrics', label: 'Agent Metrics', icon: FiBarChart2 }
  ]

  useEffect(() => {
    if (!user?.id || !agentSlug) {
      setLoading(false)
      return
    }

         const fetchAgent = async () => {
           try {
             setLoading(true)
             setError(null)

             const token = localStorage.getItem('agency_token')
             if (!token) {
               setError('Authentication required')
               return
             }

             const response = await fetch(`/api/agencies/agents/${agentSlug}`, {
               headers: {
                 'Authorization': `Bearer ${token}`
               }
             })

             if (!response.ok) {
               if (response.status === 404) {
                 setError('Agent not found')
               } else {
                 setError('Failed to fetch agent')
               }
               return
             }

             const result = await response.json()
             if (result.success && result.data) {
               setAgent(result.data)
             } else {
               setError('Agent not found')
             }
           } catch (err) {
             console.error('Error fetching agent:', err)
             setError('Failed to load agent data')
           } finally {
             setLoading(false)
           }
         }

         fetchAgent()
       }, [user?.id, agentSlug])

       const handleAgentUpdate = (updatedAgent) => {
         setAgent(updatedAgent)
       }

  // Get currency from agency profile
  const currency = user?.profile?.default_currency || 'GHS'

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 text-primary_color animate-spin" />
          <p className="text-gray-600">Loading agent data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/agency/${slug}/agents`)}
            className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
          >
            Back to Agents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              const href = tab.id === 'profile' 
                ? `/agency/${slug}/agents/${agentSlug}/profile`
                : `/agency/${slug}/agents/${agentSlug}/agentMetrics`
              
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary_color text-primary_color'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          <AgentProfile 
            agent={agent} 
            loading={loading} 
            isEditable={false}
            onUpdate={handleAgentUpdate}
          />
        </div>
      </div>
    </div>
  )
}
