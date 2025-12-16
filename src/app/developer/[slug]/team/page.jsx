'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import TeamMembersList from '@/app/components/developers/team/TeamMembersList'
import InviteMemberModal from '@/app/components/developers/team/InviteMemberModal'
import { FiUsers, FiShield, FiPlus } from 'react-icons/fi'

const TeamPage = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Get the developer slug from the pathname
  const slug = pathname?.split('/')[2] || 'developer'

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">Manage your team members, roles, and permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <Link
          href={`/developer/${slug}/team`}
          className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
            pathname === `/developer/${slug}/team`
              ? 'text-primary_color border-b-2 border-primary_color'
              : 'text-gray-600 hover:text-primary_color'
          }`}
        >
          <FiUsers className="w-5 h-5" />
          Team Members
        </Link>
        <Link
          href={`/developer/${slug}/team/roles`}
          className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
            pathname === `/developer/${slug}/team/roles`
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
        <TeamMembersList key={refreshKey} onRefresh={handleRefresh} />
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            handleRefresh()
            toast.success('Invitation sent successfully!')
          }}
        />
      )}
    </div>
  )
}

export default TeamPage

