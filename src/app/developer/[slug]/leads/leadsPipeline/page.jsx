'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'
import { FiPlus, FiArrowLeft } from 'react-icons/fi'
import LeadsPipelineList from '@/app/components/developers/leads/LeadsPipelineList'
import CreatePipelineStageModal from '@/app/components/developers/leads/CreatePipelineStageModal'

const LeadsPipelinePage = () => {
  const params = useParams()
  const slug = params.slug || ''
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const canManage =
    user?.user_type === 'developer' || userHasPermission(user, 'leads.update_status')

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="w-full min-h-screen p-6">
      <div className=" mx-auto">
        <Link
          href={`/developer/${slug}/leads`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary_color mb-4"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to leads
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary_color mb-2">Leads Pipeline</h1>
            <p className="text-gray-600">
              Configure your middle pipeline stages. <strong>New</strong> is always first and{' '}
              <strong>Unspecified</strong> is always last for leads that do not match a custom stage.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90"
            >
              <FiPlus className="w-5 h-5" />
              Add stage
            </button>
          )}
        </div>

        <LeadsPipelineList key={refreshKey} onRefresh={handleRefresh} />

        {showCreateModal && (
          <CreatePipelineStageModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              handleRefresh()
              toast.success('Pipeline stage added')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default LeadsPipelinePage
