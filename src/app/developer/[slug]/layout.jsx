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
  
  // Check if we're adding a new unit
  const isAddingNewUnit = pathname?.includes('/units/addNewUnit')
  
  // Protect route - check authentication
  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated and is a developer
      const hasDeveloperToken = localStorage.getItem('developer_token')
      
      if (!hasDeveloperToken || !isAuthenticated || user?.user_type !== 'developer') {
        console.log('Developer route protection: No valid developer token, redirecting to signin')
        handleAuthFailure('/home/signin')
        return
      }
      
      // Verify token is valid
      if (!developerToken && !hasDeveloperToken) {
        console.log('Developer route protection: Token missing, redirecting to signin')
        handleAuthFailure('/home/signin')
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
  if (!isAuthenticated || user?.user_type !== 'developer') {
    return null // Will redirect via handleAuthFailure
  }
  
  return (
    <>
      {!isAddingNewUnit && <DeveloperTopNav />}

    
    <div className='flex gap-[1em] md:px-[1em] overflow-hidden template_body_bg'>
    
      <DeveloperNav />
      <div className='flex-1 flex flex-col p-2  default_bg md:!p-[2em] mt-[3em] h-full min-h-[700px]  md:mt-[7em] overflow-hidden lg:transition-all lg:duration-300' style={{marginLeft: 'clamp(0px, var(--nav-width, 0px), 300px)'}}>
    

        {children}
      </div>
      
    </div>
  
    </>
  )
}

