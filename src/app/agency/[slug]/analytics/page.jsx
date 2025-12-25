'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    router.replace(`${pathname}/overview`)
  }, [router, pathname])
  
  return null
}

