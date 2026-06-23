'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const getHashParams = () => {
  if (typeof window === 'undefined' || !window.location.hash) return null
  return new URLSearchParams(window.location.hash.substring(1))
}

export default function AuthHashRedirect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const hashParams = getHashParams()
    const type = hashParams?.get('type') || searchParams.get('type')
    const accessToken = hashParams?.get('access_token') || searchParams.get('access_token')
    const hash = window.location.hash || ''
    const query = window.location.search || ''

    if (type === 'recovery' && pathname !== '/reset-password') {
      window.location.replace(`/reset-password${query}${hash}`)
      return
    }

    if (type === 'signup' && accessToken && pathname !== '/verify-email') {
      window.location.replace(`/verify-email${query}${hash}`)
    }
  }, [pathname, searchParams])

  return null
}
