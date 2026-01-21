'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DeveloperNav from '@/app/components/developers/DeveloperNav'
import Layout1 from '@/app/layout/Layout1'
import DeveloperTopNav from '@/app/components/developers/DeveloperTopNav'
import { handleAuthFailure } from '@/lib/authFailureHandler'

export default function DeveloperLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, isAuthenticated, developerToken } = useAuth()
  
  // Protect route - check authentication
  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated and has developer token
      const hasDeveloperToken = localStorage.getItem('developer_token')
      
      // Allow developers OR team members with developer organization
      const isDeveloper = user?.user_type === 'developer'
      const isTeamMemberWithDeveloperOrg = user?.user_type === 'team_member' && user?.profile?.organization_type === 'developer'
      const hasValidUser = isDeveloper || isTeamMemberWithDeveloperOrg
      
      // Check authentication: either state says authenticated OR we have token in localStorage
      const isAuth = isAuthenticated || (hasDeveloperToken && user)
      
      if (!hasDeveloperToken || !isAuth || !hasValidUser) {
        console.log('Developer route protection: No valid access, redirecting to signin', {
          hasToken: !!hasDeveloperToken,
          isAuthenticated,
          isAuth,
          userType: user?.user_type,
          orgType: user?.profile?.organization_type,
          hasUser: !!user
        })
        // Only redirect if we're sure - don't redirect if still loading
        if (!loading) {
          handleAuthFailure('/home/signin')
        }
        return
      }
    }
  }, [loading, isAuthenticated, user, developerToken])
  
  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Don't render protected content if not authenticated
  const isDeveloper = user?.user_type === 'developer'
  const isTeamMemberWithDeveloperOrg = user?.user_type === 'team_member' && user?.profile?.organization_type === 'developer'
  
  if (!isAuthenticated || (!isDeveloper && !isTeamMemberWithDeveloperOrg)) {
    return null // Will redirect via handleAuthFailure
  }
  
  return (
    <>
      <DeveloperTopNav />

    
    <div className='flex gap-[1em] md:px-[1em] overflow-hidden template_body_bg'>
    
      <DeveloperNav />
      <div className='flex-1 flex flex-col p-2  default_bg md:!p-[2em] mt-[3em] h-full min-h-[700px]  md:mt-[7em] overflow-hidden lg:transition-all lg:duration-300' style={{marginLeft: 'clamp(0px, var(--nav-width, 0px), 300px)'}}>
    

        {children}
      </div>
      
    </div>
  
    </>
  )
}

