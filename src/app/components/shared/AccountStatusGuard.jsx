'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const VALID_STATUSES = new Set(['approved', 'valid', 'active'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()

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

    const resolveAdminStatus = async () => {
      if (loading) return

      if (!user) {
        if (isMounted) {
          setAdminStatus('')
          setStatusLoading(false)
        }
        return
      }

      const currentUserType = user?.user_type

      if (currentUserType === entityType) {
        if (isMounted) {
          setAdminStatus(user?.profile?.admin_status || user?.profile?.status || '')
          setStatusLoading(false)
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
              .select('admin_status, status')
              .eq('agency_id', user?.profile?.organization_id)
              .maybeSingle()
            data = response.data
          }

          if (isMounted) {
            setAdminStatus(data?.admin_status || data?.status || '')
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
        setAdminStatus(user?.profile?.admin_status || user?.profile?.status || '')
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
