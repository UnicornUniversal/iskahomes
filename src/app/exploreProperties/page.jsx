'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ExplorePropertiesRedirectContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Preserve all query parameters
    const queryString = searchParams.toString()
    const redirectUrl = queryString 
      ? `/home/exploreProperties?${queryString}`
      : '/home/exploreProperties'
    
    router.replace(redirectUrl)
  }, [router, searchParams])
  
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
        <span className="text-primary_color">Redirecting...</span>
      </div>
    </div>
  )
}

export default function ExplorePropertiesRedirect() {
  return (
    <Suspense fallback={
      <div className='w-full h-screen flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
          <span className="text-primary_color">Loading...</span>
        </div>
      </div>
    }>
      <ExplorePropertiesRedirectContent />
    </Suspense>
  )
}

