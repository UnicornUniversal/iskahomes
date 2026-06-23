'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const AgencyHeader = () => {
  const { user, isAuthenticated } = useAuth()

  const { personName, agencyName, accountStatus, roleName } = useMemo(() => {
    if (!user?.profile) {
      return {
        personName: 'Loading...',
        agencyName: '',
        accountStatus: 'unknown',
        roleName: '',
      }
    }

    const profile = user.profile
    const isTeamMember = user.user_type === 'team_member'

    const personName = isTeamMember
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        profile.email ||
        'Team Member'
      : profile.name || 'Agency'

    const agencyName = isTeamMember
      ? profile.organization_name || 'Agency'
      : profile.name || 'Agency'

    const accountStatus =
      profile.account_status ||
      profile.admin_status ||
      profile.organization_profile_status ||
      profile.organization_admin_status ||
      'unknown'

    const roleName = profile.role_name || (isTeamMember ? 'Team Member' : 'Agency Owner')

    return { personName, agencyName, accountStatus, roleName }
  }, [user])

  const statusLabel = accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)

  return (
    <div className='w-full flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-sm p-6 pr-16 lg:pr-6 rounded-xl shadow-sm border border-gray-100 mb-6'>
      <div className='w-full flex flex-col gap-1'>
        <h6 className='text-sm text-gray-500 font-medium'>Welcome back</h6>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl md:text-3xl font-bold text-primary_color'>
            {!isAuthenticated || !user ? 'Loading...' : personName}
          </h2>
          {user?.user_type === 'team_member' && agencyName && (
            <p className='text-base font-medium text-gray-700'>{agencyName}</p>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2 mt-1'>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            accountStatus === 'active' || accountStatus === 'approved'
              ? 'bg-green-100 text-green-800'
              : accountStatus === 'suspended'
              ? 'bg-red-100 text-red-800'
              : accountStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {!isAuthenticated || !user ? 'Loading' : statusLabel}
          </span>
          {user && roleName && (
            <span className='px-3 py-1 rounded-full text-xs font-medium bg-primary_color/10 text-primary_color'>
              {roleName}
            </span>
          )}
        </div>
        <p className='text-sm text-gray-600 mt-1'>
          {user?.user_type === 'team_member'
            ? `You are signed in to ${agencyName}`
            : 'Manage your agents, properties, and business operations'}
        </p>
      </div>
      <div />
    </div>
  )
}

export default AgencyHeader
