'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import AddClientForm from '../AddClientForm'

export default function AddNewClientPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug || ''
  const basePath = `/developer/${slug}/clientManagement`

  return (
    <div className="min-h-screen p-4 md:p-6">
      <AddClientForm
        basePath={basePath}
        onSuccess={(newId) => router.push(`${basePath}/${newId}`)}
        onCancel={() => router.push(basePath)}
      />
    </div>
  )
}
