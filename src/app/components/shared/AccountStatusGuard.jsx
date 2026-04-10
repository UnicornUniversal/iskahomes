'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const VALID_STATUSES = new Set(['approved', 'valid', 'active'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const hasStatusValue = (value) => normalizeStatus(value).length > 0
const getStatusFromProfile = (profile) =>
  profile?.admin_status || profile?.status || profile?.account_status || profile?.agent_status || ''

const isObjectWithValues = (obj) => !!obj && typeof obj === 'object' && Object.keys(obj).length > 0

export default function AccountStatusGuard({ children, entityType }) {
  const { user, loading } = useAuth()
  const [adminStatus, setAdminStatus] = useState('')
  const [statusLoading, setStatusLoading] = useState(true)

  const isValidAccount = useMemo(
    () => VALID_STATUSES.has(normalizeStatus(adminStatus)),
    [adminStatus]
  )

  useEffect(() => {
    let isMounted = true

    const fetchEntityStatus = async () => {
      if (entityType === 'developer') {
        const developerProfileId = user?.profile?.id
        const developerId = user?.profile?.developer_id || user?.id

        // Prefer primary key lookup when available, fallback to developer_id.
        let response = null
        if (developerProfileId) {
          response = await supabase
            .from('developers')
            .select('admin_status, status')
            .eq('id', developerProfileId)
            .maybeSingle()
        } else if (developerId) {
          response = await supabase
            .from('developers')
            .select('admin_status, status')
            .eq('developer_id', developerId)
            .maybeSingle()
        }

        return response?.data || null
      }

      if (entityType === 'agency') {
        const agencyId = user?.profile?.agency_id || user?.id
        if (!agencyId) return null

        const response = await supabase
          .from('agencies')
          .select('admin_status, status, account_status')
          .eq('agency_id', agencyId)
          .maybeSingle()

        return response?.data || null
      }

      if (entityType === 'agent') {
        const agentId = user?.profile?.agent_id || user?.id
        if (!agentId) return null

        const response = await supabase
          .from('agents')
          .select('admin_status, account_status, agent_status, status')
          .eq('agent_id', agentId)
          .maybeSingle()

        return response?.data || null
      }

      return null
    }

    const fetchTeamMemberContext = async () => {
      const authUserId = user?.id
      const teamMemberId = user?.profile?.team_member_id || user?.profile?.id

      let member = null

      if (teamMemberId) {
        const { data } = await supabase
          .from('organization_team_members')
          .select('id, status, organization_type, organization_id')
          .eq('id', teamMemberId)
          .eq('status', 'active')
          .maybeSingle()
        member = data
      }

      // Fallback: JWT/profile may not carry team_member_id; RLS may differ on id vs user_id.
      if (!member && authUserId) {
        let q = supabase
          .from('organization_team_members')
          .select('id, status, organization_type, organization_id')
          .eq('user_id', authUserId)
          .eq('status', 'active')

        if (entityType === 'developer' || entityType === 'agency') {
          q = q.eq('organization_type', entityType)
        }

        const { data: rows } = await q.limit(1)
        member = rows?.[0] || null
      }

      if (!member) return { member: null, organization: null }

      // Check both possible PK variants for resilience across schemas.
      if (member.organization_type === 'developer') {
        const byId = await supabase
          .from('developers')
          .select('admin_status, status')
          .eq('id', member.organization_id)
          .maybeSingle()

        if (isObjectWithValues(byId?.data)) {
          return { member, organization: byId.data }
        }

        const byDeveloperId = await supabase
          .from('developers')
          .select('admin_status, status')
          .eq('developer_id', member.organization_id)
          .maybeSingle()

        return { member, organization: byDeveloperId?.data || null }
      }

      if (member.organization_type === 'agency') {
        const byId = await supabase
          .from('agencies')
          .select('admin_status, status, account_status')
          .eq('id', member.organization_id)
          .maybeSingle()

        if (isObjectWithValues(byId?.data)) {
          return { member, organization: byId.data }
        }

        const byAgencyId = await supabase
          .from('agencies')
          .select('admin_status, status, account_status')
          .eq('agency_id', member.organization_id)
          .maybeSingle()

        return { member, organization: byAgencyId?.data || null }
      }

      return { member, organization: null }
    }

    const resolveAdminStatus = async () => {
      if (isMounted) {
        setStatusLoading(true)
      }

      if (loading) return

      if (!user) {
        if (isMounted) {
          setAdminStatus('')
          setStatusLoading(false)
        }
        return
      }

      const currentUserType = normalizeStatus(user?.user_type)
      const profileStatus = getStatusFromProfile(user?.profile)

      // Invited / org team users MUST run before the primary-account branch.
      // Otherwise a wrong/missing user_type can make us treat profile.id as developers.id and get empty status → UNKNOWN.
      const isTeamMemberSession =
        currentUserType === 'team_member' || Boolean(user?.profile?.team_member_id)

      if (isTeamMemberSession) {
        try {
          const { member, organization } = await fetchTeamMemberContext()

          if (member && member.organization_type && normalizeStatus(member.organization_type) !== normalizeStatus(entityType)) {
            if (isMounted) {
              setAdminStatus('')
              setStatusLoading(false)
            }
            return
          }

          const memberStatus = getStatusFromProfile(member)
          const orgStatus = getStatusFromProfile(organization)

          const resolvedStatus = hasStatusValue(orgStatus)
            ? orgStatus
            : hasStatusValue(memberStatus)
              ? memberStatus
              : 'active'

          if (isMounted) setAdminStatus(resolvedStatus)
        } catch (error) {
          if (isMounted) {
            setAdminStatus('active')
          }
        } finally {
          if (isMounted) {
            setStatusLoading(false)
          }
        }
        return
      }

      if (currentUserType === normalizeStatus(entityType)) {
        if (hasStatusValue(profileStatus)) {
          if (isMounted) {
            setAdminStatus(profileStatus)
            setStatusLoading(false)
          }
          return
        }

        try {
          const data = await fetchEntityStatus()
          const fromDb = getStatusFromProfile(data)
          // Many org rows use null/legacy status; treat as active so the dashboard is usable.
          const resolved = hasStatusValue(fromDb) ? fromDb : 'active'
          if (isMounted) {
            setAdminStatus(resolved)
          }
        } catch (error) {
          if (isMounted) {
            setAdminStatus('active')
          }
        } finally {
          if (isMounted) {
            setStatusLoading(false)
          }
        }
        return
      }

      if (isMounted) {
        const fallback = hasStatusValue(profileStatus) ? profileStatus : 'active'
        setAdminStatus(fallback)
        setStatusLoading(false)
      }
    }

    resolveAdminStatus()

    return () => {
      isMounted = false
    }
  }, [entityType, loading, user])

  if (loading || statusLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isValidAccount) {
    return children
  }

  const statusLabel = String(adminStatus || 'unknown').toUpperCase()

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2">
        <p>Account Status:</p>
        <h3 className="text-primary_color text-4xl font-bold">{statusLabel}</h3>
      </div>
    </div>
  )
}
