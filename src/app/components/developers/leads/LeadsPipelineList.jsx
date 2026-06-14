'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'
import { FiEdit2, FiTrash2, FiGitBranch, FiMenu } from 'react-icons/fi'
import EditPipelineStageModal from './EditPipelineStageModal'
import {
  getMiddlePipelineStages,
  SYSTEM_PIPELINE_STAGE_NEW,
  SYSTEM_PIPELINE_STAGE_UNSPECIFIED,
} from '@/lib/leadsPipelineHelper'

function SystemPipelineRow({ stage, position }) {
  return (
    <tr className="border-b border-gray-100 bg-gray-50/80">
      <td className="px-4 py-3 text-sm text-gray-400 w-12">{position}</td>
      <td className="px-4 py-3">
        <span className="font-medium text-gray-500">{stage.value}</span>
        <span className="ml-2 text-xs text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
          System
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 font-mono">{stage.status}</td>
      <td className="px-4 py-3 text-sm text-gray-400 text-right">Fixed</td>
    </tr>
  )
}

const LeadsPipelineList = ({ onRefresh }) => {
  const { user, developerToken, agencyToken } = useAuth()
  const authToken = developerToken || agencyToken
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [draggedStageId, setDraggedStageId] = useState(null)
  const [dragOverStageId, setDragOverStageId] = useState(null)

  const canManage =
    user?.user_type === 'developer' ||
    user?.user_type === 'agency' ||
    userHasPermission(user, 'leads.update_status')

  const fetchStages = useCallback(
    async (seedDefaults = false) => {
      try {
        setLoading(true)
        const qs = seedDefaults ? '?seed_defaults=true' : ''
        const response = await fetch(`/api/leads-pipeline${qs}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to load pipeline stages')
        }

        const result = await response.json()
        setStages(getMiddlePipelineStages(result.data || []))
      } catch (error) {
        console.error(error)
        toast.error(error.message || 'Failed to load pipeline stages')
      } finally {
        setLoading(false)
      }
    },
    [authToken]
  )

  useEffect(() => {
    if (authToken) {
      fetchStages()
    }
  }, [authToken, fetchStages])

  const handleSeedDefaults = async () => {
    setSeeding(true)
    await fetchStages(true)
    setSeeding(false)
    toast.success('Default pipeline stages loaded')
    if (onRefresh) onRefresh()
  }

  const handleDelete = async (stage) => {
    try {
      const response = await fetch(`/api/leads-pipeline/${stage.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete stage')
      }

      toast.success(`"${stage.value}" removed`)
      fetchStages()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error(error.message || 'Failed to delete stage')
    }
  }

  const persistStageOrder = async (orderedStages) => {
    const updates = orderedStages
      .map((stage, index) => {
        const nextOrder = index + 1
        if (stage.sort_order === nextOrder) return null
        return fetch(`/api/leads-pipeline/${stage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ sort_order: nextOrder }),
        })
      })
      .filter(Boolean)

    if (updates.length === 0) return

    setReordering(true)
    try {
      const results = await Promise.all(updates)
      const failed = results.find((r) => !r.ok)
      if (failed) {
        const err = await failed.json()
        throw new Error(err.error || 'Failed to reorder stages')
      }
      setStages(orderedStages.map((s, i) => ({ ...s, sort_order: i + 1 })))
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error(error.message || 'Failed to reorder stages')
      await fetchStages()
    } finally {
      setReordering(false)
    }
  }

  const handleDropOnStage = async (targetStageId) => {
    if (!draggedStageId || draggedStageId === targetStageId) {
      setDraggedStageId(null)
      setDragOverStageId(null)
      return
    }

    const fromIndex = stages.findIndex((s) => s.id === draggedStageId)
    const toIndex = stages.findIndex((s) => s.id === targetStageId)
    if (fromIndex < 0 || toIndex < 0) {
      setDraggedStageId(null)
      setDragOverStageId(null)
      return
    }

    const next = [...stages]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    setStages(next)
    setDraggedStageId(null)
    setDragOverStageId(null)

    await persistStageOrder(next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 secondary_bg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-12" />
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">Label</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">Status key</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <SystemPipelineRow stage={SYSTEM_PIPELINE_STAGE_NEW} position={1} />

            {stages.length === 0 ? (
              <tr className="border-b border-gray-100">
                <td colSpan={4} className="px-4 py-10 text-center">
                  <FiGitBranch className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-3">No custom pipeline stages yet.</p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={handleSeedDefaults}
                      disabled={seeding || reordering}
                      className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 disabled:opacity-50"
                    >
                      {seeding ? 'Loading...' : 'Load default stages'}
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              stages.map((stage, index) => {
                const isDragging = draggedStageId === stage.id
                const isDragOver = dragOverStageId === stage.id && draggedStageId !== stage.id

                return (
                  <tr
                    key={stage.id}
                    onDragOver={(e) => {
                      if (!draggedStageId || draggedStageId === stage.id) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverStageId(stage.id)
                    }}
                    onDragLeave={() => {
                      if (dragOverStageId === stage.id) setDragOverStageId(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDropOnStage(stage.id)
                    }}
                    className={`border-b border-gray-100 last:border-0 transition-colors ${
                      isDragging ? 'opacity-50' : ''
                    } ${isDragOver ? 'bg-primary_color/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-400 w-12">
                      {canManage ? (
                        <span
                          draggable={!reordering}
                          onDragStart={(e) => {
                            if (reordering) return
                            setDraggedStageId(stage.id)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', String(stage.id))
                          }}
                          onDragEnd={() => {
                            setDraggedStageId(null)
                            setDragOverStageId(null)
                          }}
                          className="inline-flex cursor-grab active:cursor-grabbing text-gray-400 hover:text-primary_color"
                          title="Drag to reorder"
                        >
                          <FiMenu className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">{index + 2}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-primary_color">{stage.value}</span>
                      {stage.is_default && (
                        <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{stage.status}</td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStage(stage)
                              setShowEditModal(true)
                            }}
                            disabled={reordering}
                            className="p-2 text-gray-500 hover:text-primary_color disabled:opacity-40"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(stage)}
                            disabled={reordering}
                            className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-40"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}

            <SystemPipelineRow
              stage={SYSTEM_PIPELINE_STAGE_UNSPECIFIED}
              position={stages.length + 2}
            />
          </tbody>
        </table>
      </div>

      {canManage && stages.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Drag custom stages to reorder. New and Unspecified stay fixed at the top and bottom.
        </p>
      )}

      {showEditModal && editingStage && (
        <EditPipelineStageModal
          isOpen={showEditModal}
          stage={editingStage}
          onClose={() => {
            setShowEditModal(false)
            setEditingStage(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingStage(null)
            fetchStages()
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </>
  )
}

export default LeadsPipelineList
