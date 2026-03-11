'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function UserDetailIndexPage() {
  const params = useParams()
  const router = useRouter()
  const { userType, userId } = params || {}

  useEffect(() => {
    if (userType && userId) {
      router.replace(`/admin/users/${userType}/${userId}/profile`)
    }
  }, [userType, userId, router])

  return <div className="text-primary_color/70">Redirecting...</div>
}
