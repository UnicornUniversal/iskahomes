'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'
import { FiMail, FiPhone, FiUser, FiEdit, FiTrash2, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import EditMemberModal from './EditMemberModal'

const TeamMembersList = ({ onRefresh }) => {
  const { user, developerToken } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/developers/team/members', {
        headers: {
          'Authorization': `Bearer ${developerToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch team members')
      }

      const result = await response.json()
      setMembers(result.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error(error.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (memberId) => {
    // Prevent removing Super Admin team member
    const memberToRemove = members.find(m => m.id === memberId)
    if (memberToRemove?.role?.name === 'Super Admin') {
      toast.error('Super Admin team member cannot be removed')
      return
    }

    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      const response = await fetch(`/api/developers/team/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${developerToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove team member')
      }

      toast.success('Team member removed successfully')
      fetchMembers()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error(error.message || 'Failed to remove team member')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock, label: 'Pending' },
      active: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle, label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle, label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', icon: FiXCircle, label: 'Suspended' },
      deleted: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle, label: 'Deleted' }
    }

    const config = statusConfig[status] || statusConfig.inactive
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  return (
    <div className="secondary_bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary_color uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary_color uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary_color uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary_color uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-primary_color uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="secondary_bg divide-y divide-gray-200">
            {members.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No team members found. Invite someone to get started!
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary_color/10 flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-primary_color" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name || member.last_name 
                            ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                            : 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FiMail className="w-3 h-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <FiPhone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-medium">
                      {member.role?.name || 'No role'}
                    </span>
                    {member.role?.is_system_role && (
                      <span className="ml-2 text-xs text-gray-500">(System)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.accepted_at 
                      ? new Date(member.accepted_at).toLocaleDateString()
                      : member.invited_at 
                        ? `Invited ${new Date(member.invited_at).toLocaleDateString()}`
                        : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {!(member.role?.name === 'Super Admin') && (user?.user_type === 'agent' || userHasPermission(user, 'team.edit')) && (
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowEditModal(true)
                          }}
                          className="text-primary_color hover:text-primary_color/80 transition-colors"
                          title="Edit"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                      )}
                      {member.status !== 'deleted' && !(member.role?.name === 'Super Admin') && (user?.user_type === 'agent' || userHasPermission(user, 'team.remove')) && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Remove"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedMember && !(selectedMember.role?.name === 'Super Admin') && (
        <EditMemberModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedMember(null)
          }}
          member={selectedMember}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedMember(null)
            fetchMembers()
            if (onRefresh) onRefresh()
            toast.success('Team member updated successfully!')
          }}
        />
      )}
    </div>
  )
}

export default TeamMembersList

