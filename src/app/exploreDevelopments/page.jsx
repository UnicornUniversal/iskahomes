'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ExploreDevelopmentsRedirectContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const queryString = searchParams.toString()
    const redirectUrl = queryString
      ? `/home/exploreDevelopments?${queryString}`
      : '/home/exploreDevelopments'

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

export default function ExploreDevelopmentsRedirect() {
  return (
    <Suspense fallback={
      <div className='w-full h-screen flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
          <span className="text-primary_color">Loading...</span>
        </div>
      </div>
    }>
      <ExploreDevelopmentsRedirectContent />
    </Suspense>
  )
}
