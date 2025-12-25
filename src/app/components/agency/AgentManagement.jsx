'use client'

import React, { useState, useEffect } from 'react'
import { 
  FiSearch, 
  FiPlus, 
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiGrid,
  FiList,
  FiLoader
} from 'react-icons/fi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AddAgentModal from './AddAgentModal'
import { formatCurrency } from '@/lib/utils'

const AgentManagement = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'list'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pathname = usePathname()
  
  // Extract slug from pathname
  const getSlug = () => {
    const parts = pathname?.split('/') || []
    if (parts.length >= 3 && parts[1] === 'agency') {
      return parts[2]
    }
    return user?.profile?.slug || 'premier-realty'
  }
  
  const slug = getSlug()

  // Fetch agents
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchAgents = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('agency_token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const params = new URLSearchParams()
        if (selectedStatus !== 'all') {
          params.append('status', selectedStatus)
        }
        if (searchQuery) {
          params.append('search', searchQuery)
        }

        const response = await fetch(`/api/agencies/agents?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }

        const result = await response.json()
        
        if (isMounted) {
          if (result.success) {
            setAgents(result.data || [])
          } else {
            setError(result.error || 'Failed to fetch agents')
          }
        }
      } catch (err) {
        console.error('Error fetching agents:', err)
        if (isMounted) {
          setError(err.message || 'Error loading agents')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAgents()

    return () => {
      isMounted = false
    }
  }, [user?.id, selectedStatus, searchQuery])

  // Get currency from agency profile
  const currency = user?.profile?.default_currency || 'GHS'

  // Filter agents (search is now handled by API, but we can add client-side filtering if needed)
  const filteredAgents = agents

  const activeCount = agents.filter(a => a.status === 'active').length
  const inactiveCount = agents.filter(a => a.status === 'inactive').length
  const pendingCount = agents.filter(a => a.invitation_status === 'pending' || a.invitation_status === 'sent').length

  return (
    <div className='w-full flex flex-col gap-6'>
      {/* Header Actions */}
      <div className='flex flex-col md:flex-row gap-4 justify-between items-start md:items-center'>
        <div>
          <h2 className='text-2xl font-bold text-primary_color mb-1'>Agent Management</h2>
          <p className='text-sm text-gray-600'>Manage your agency agents and their performance</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className='flex items-center gap-2 bg-primary_color text-white px-6 py-3 rounded-lg hover:bg-primary_color/90 transition-colors duration-300 shadow-lg shadow-primary_color/20'
        >
          <FiPlus className='w-5 h-5' />
          <span className='font-medium'>Add New Agent</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 mb-1'>Total Agents</p>
              <p className='text-3xl font-bold text-primary_color'>{agents.length}</p>
            </div>
            <div className='p-3 rounded-lg bg-primary_color/10'>
              <FiUser className='w-6 h-6 text-primary_color' />
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 mb-1'>Active Agents</p>
              <p className='text-3xl font-bold text-primary_color'>{activeCount}</p>
            </div>
            <div className='p-3 rounded-lg bg-primary_color/10'>
              <FiCheckCircle className='w-6 h-6 text-primary_color' />
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 mb-1'>Pending Invitations</p>
              <p className='text-3xl font-bold text-orange-500'>{pendingCount}</p>
            </div>
            <div className='p-3 rounded-lg bg-orange-100'>
              <FiMail className='w-6 h-6 text-orange-500' />
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 mb-1'>Inactive Agents</p>
              <p className='text-3xl font-bold text-gray-400'>{inactiveCount}</p>
            </div>
            <div className='p-3 rounded-lg bg-gray-100'>
              <FiXCircle className='w-6 h-6 text-gray-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          <div className='flex flex-1 flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search agents by name or email...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color'
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className='px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='pending'>Pending</option>
            </select>
          </div>
          <div className='flex items-center gap-2 bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary_color text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title='Table View'
            >
              <FiGrid className='w-5 h-5' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary_color text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title='List View'
            >
              <FiList className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center'>
          <FiLoader className='w-8 h-8 animate-spin text-primary_color mx-auto mb-4' />
          <p className='text-gray-600'>Loading agents...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className='bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center'>
          <FiXCircle className='w-8 h-8 text-red-500 mx-auto mb-4' />
          <p className='text-red-600 font-medium'>{error}</p>
        </div>
      )}

      {/* Agents Table/List View */}
      {!loading && !error && viewMode === 'table' ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Agent</th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Contact</th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Properties</th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Deals</th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Revenue</th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Status</th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className='hover:bg-gray-50 transition-colors duration-150'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <Link href={`/agency/${slug}/agents/${agent.id}/profile`}>
                      <div className='flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity'>
                        <div className='w-10 h-10 rounded-full bg-primary_color/10 flex items-center justify-center flex-shrink-0'>
                          <span className='text-sm font-semibold text-primary_color'>{agent.avatar}</span>
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>{agent.name}</p>
                          <p className='text-xs text-gray-500'>Joined {new Date(agent.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <FiMail className='w-4 h-4 text-gray-400' />
                        <span className='truncate max-w-[200px]'>{agent.email}</span>
                      </div>
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <FiPhone className='w-4 h-4 text-gray-400' />
                        <span>{agent.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-medium text-gray-900'>{agent.properties}</span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-medium text-gray-900'>{agent.deals}</span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-semibold text-secondary_color'>
                      {formatCurrency(agent.revenue, currency)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {agent.invitation_status === 'pending' || agent.invitation_status === 'sent' ? (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600'>
                        <FiMail className='w-3 h-3 mr-1' />
                        Pending
                      </span>
                    ) : agent.status === 'active' ? (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary_color/10 text-primary_color'>
                        <FiCheckCircle className='w-3 h-3 mr-1' />
                        Active
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                        <FiXCircle className='w-3 h-3 mr-1' />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <button className='p-2 hover:bg-primary_color/10 rounded-lg transition-colors' title='Edit'>
                        <FiEdit className='w-4 h-4 text-primary_color' />
                      </button>
                      <button className='p-2 hover:bg-red-50 rounded-lg transition-colors' title='Delete'>
                        <FiTrash2 className='w-4 h-4 text-red-500' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredAgents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agency/${slug}/agents/${agent.id}/profile`}
              className='bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary_color/20 transition-all duration-300'
            >
              <div className='flex items-center space-x-4 mb-4'>
                <div className='w-12 h-12 rounded-full bg-primary_color/10 flex items-center justify-center flex-shrink-0'>
                  <span className='text-lg font-semibold text-primary_color'>{agent.avatar}</span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-base font-semibold text-gray-900 truncate'>{agent.name}</p>
                  <p className='text-xs text-gray-500 truncate'>{agent.email}</p>
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Properties</span>
                  <span className='font-medium text-gray-900'>{agent.properties}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Deals</span>
                  <span className='font-medium text-gray-900'>{agent.deals}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Revenue</span>
                  <span className='font-semibold text-secondary_color'>
                    {formatCurrency(agent.revenue, currency)}
                  </span>
                </div>
                <div className='pt-2 border-t border-gray-100'>
                  {agent.invitation_status === 'pending' || agent.invitation_status === 'sent' ? (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600'>
                      <FiMail className='w-3 h-3 mr-1' />
                      Pending
                    </span>
                  ) : agent.status === 'active' ? (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary_color/10 text-primary_color'>
                      <FiCheckCircle className='w-3 h-3 mr-1' />
                      Active
                    </span>
                  ) : (
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                      <FiXCircle className='w-3 h-3 mr-1' />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && filteredAgents.length === 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center'>
          <FiUser className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-500 font-medium'>No agents found</p>
          <p className='text-sm text-gray-400 mt-1'>
            {searchQuery || selectedStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start by inviting your first agent'}
          </p>
        </div>
      )}

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(agentData) => {
          // Refresh agents list
          if (user?.id) {
            const token = localStorage.getItem('agency_token')
            if (token) {
              fetch(`/api/agencies/agents?status=${selectedStatus}${searchQuery ? `&search=${searchQuery}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    setAgents(result.data || [])
                  }
                })
                .catch(err => console.error('Error refreshing agents:', err))
            }
          }
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}

export default AgentManagement

