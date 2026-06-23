'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'
import RolesList from '@/app/components/developers/team/RolesList'
import CreateRoleModal from '@/app/components/developers/team/CreateRoleModal'
import { FiUsers, FiShield, FiPlus } from 'react-icons/fi'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import SubscriptionLimitButton from '@/app/components/shared/SubscriptionLimitButton'

const RolesPage = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { canCreateMore, usageSummary } = useSubscriptionLimits()
  const canCreateRole = canCreateMore('total_roles_limit')

  const slug = pathname?.split('/')[2] || 'agency'

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="w-full min-h-screen h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary_color mb-2">Team Management</h1>
          <p className="text-gray-600">Manage your team members, roles, and permissions</p>
          {usageSummary.rolesLimit != null && (
            <p className="text-sm text-gray-500">Plan: {usageSummary.roles}/{usageSummary.rolesLimit} roles</p>
          )}
        </div>
        <div className="flex gap-3">
          {(user?.user_type === 'agency' || userHasPermission(user, 'team.manage_roles')) && (
            <SubscriptionLimitButton
              onClick={() => setShowCreateRoleModal(true)}
              enabled={canCreateRole}
              limitKey="total_roles_limit"
              className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              Create Role
            </SubscriptionLimitButton>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <Link
          href={`/agency/${slug}/team`}
          prefetch={false}
          className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
            pathname === `/agency/${slug}/team`
              ? 'text-primary_color border-b-2 border-primary_color'
              : 'text-gray-600 hover:text-primary_color'
          }`}
        >
          <FiUsers className="w-5 h-5" />
          Team Members
        </Link>
        <Link
          href={`/agency/${slug}/team/roles`}
          prefetch={false}
          className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
            pathname === `/agency/${slug}/team/roles`
              ? 'text-primary_color border-b-2 border-primary_color'
              : 'text-gray-600 hover:text-primary_color'
          }`}
        >
          <FiShield className="w-5 h-5" />
          Roles & Permissions
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <RolesList key={refreshKey} onRefresh={handleRefresh} organizationType="agency" />
      </div>

      {/* Modals */}
      {showCreateRoleModal && (
        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          onSuccess={() => {
            setShowCreateRoleModal(false)
            handleRefresh()
            toast.success('Role created successfully!')
          }}
          organizationType="agency"
        />
      )}
    </div>
  )
}

export default RolesPage
