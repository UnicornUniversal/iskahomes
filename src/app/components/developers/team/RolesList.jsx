'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'
import { FiShield, FiEdit, FiTrash2, FiUsers, FiLock } from 'react-icons/fi'
import EditRoleModal from './EditRoleModal'

const RolesList = ({ onRefresh }) => {
  const { user, developerToken } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/developers/team/roles', {
        headers: {
          'Authorization': `Bearer ${developerToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch roles')
      }

      const result = await response.json()
      setRoles(result.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error(error.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roleId, roleName) => {
    // Prevent deleting Super Admin
    const roleToDelete = roles.find(r => r.id === roleId)
    if (roleToDelete?.is_system_role && roleToDelete?.name === 'Super Admin') {
      toast.error('Super Admin role cannot be deleted')
      return
    }

    // Using toast for feedback instead of browser confirm
    try {
      const response = await fetch(`/api/developers/team/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${developerToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete role')
      }

      toast.success(`Role "${roleName}" deleted successfully`)
      fetchRoles()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error(error.message || 'Failed to delete role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No roles found. Create a role to get started!
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="secondary_bg rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary_color/10 flex items-center justify-center">
                    {role.is_system_role ? (
                      <FiLock className="w-6 h-6 text-primary_color" />
                    ) : (
                      <FiShield className="w-6 h-6 text-primary_color" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary_color">{role.name}</h3>
                    {role.is_system_role && (
                      <span className="text-xs text-gray-500">System Role</span>
                    )}
                    {role.is_default && (
                      <span className="ml-2 text-xs text-blue-600">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!(role.is_system_role && role.name === 'Super Admin') && (user?.user_type === 'agent' || userHasPermission(user, 'team.manage_roles')) && (
                    <>
                      {!role.is_system_role && (
                        <button
                          onClick={() => {
                            setSelectedRole(role)
                            setShowEditModal(true)
                          }}
                          className="text-primary_color hover:text-primary_color/80 transition-colors"
                          title="Edit"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                      )}
                      {!role.is_system_role && (
                        <button
                          onClick={() => handleDelete(role.id, role.name)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiUsers className="w-4 h-4" />
                  <span>Permissions configured</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditModal && selectedRole && !(selectedRole.is_system_role && selectedRole.name === 'Super Admin') && (
        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedRole(null)
          }}
          role={selectedRole}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedRole(null)
            fetchRoles()
            if (onRefresh) onRefresh()
            toast.success('Role updated successfully!')
          }}
          organizationType="developer"
        />
      )}
    </>
  )
}

export default RolesList

