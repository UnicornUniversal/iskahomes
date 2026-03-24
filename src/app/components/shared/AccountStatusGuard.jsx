'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const VALID_STATUSES = new Set(['approved', 'valid', 'active'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const hasStatusValue = (value) => normalizeStatus(value).length > 0
const getStatusFromProfile = (profile) =>
  profile?.admin_status || profile?.status || profile?.account_status || profile?.agent_status || ''

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

      const currentUserType = user?.user_type
      const profileStatus = getStatusFromProfile(user?.profile)

      if (currentUserType === entityType) {
        if (hasStatusValue(profileStatus)) {
          if (isMounted) {
            setAdminStatus(profileStatus)
            setStatusLoading(false)
          }
          return
        }

        try {
          const data = await fetchEntityStatus()
          if (isMounted) {
            setAdminStatus(getStatusFromProfile(data))
          }
        } catch (error) {
          if (isMounted) {
            setAdminStatus('')
          }
        } finally {
          if (isMounted) {
            setStatusLoading(false)
          }
        }
        return
      }

      if (currentUserType === 'team_member' && user?.profile?.organization_type === entityType) {
        try {
          let data = null

          if (entityType === 'developer') {
            const response = await supabase
              .from('developers')
              .select('admin_status, status')
              .eq('id', user?.profile?.organization_id)
              .maybeSingle()
            data = response.data
          } else if (entityType === 'agency') {
            const response = await supabase
              .from('agencies')
              .select('admin_status, status, account_status')
              .eq('id', user?.profile?.organization_id)
              .maybeSingle()
            data = response.data
          }

          if (isMounted) {
            setAdminStatus(getStatusFromProfile(data))
          }
        } catch (error) {
          if (isMounted) {
            setAdminStatus('')
          }
        } finally {
          if (isMounted) {
            setStatusLoading(false)
          }
        }
        return
      }

      if (isMounted) {
        setAdminStatus(profileStatus)
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
