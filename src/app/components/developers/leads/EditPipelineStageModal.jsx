'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiX } from 'react-icons/fi'
import { toPipelineStatusKey } from '@/lib/leadsPipelineHelper'

const EditPipelineStageModal = ({ isOpen, onClose, onSuccess, stage }) => {
  const { developerToken, agencyToken } = useAuth()
  const authToken = developerToken || agencyToken
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    if (stage) {
      setValue(stage.value || '')
      setStatus(stage.status || '')
      setSortOrder(stage.sort_order ?? 0)
    }
  }, [stage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stage?.id) return

    if (!value.trim()) {
      toast.error('Stage label is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/leads-pipeline/${stage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          value: value.trim(),
          status: status.trim() || toPipelineStatusKey(value),
          sort_order: Number(sortOrder),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update stage')
      }

      toast.success('Pipeline stage updated')
      onSuccess()
    } catch (error) {
      toast.error(error.message || 'Failed to update stage')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !stage) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto mt-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary_color">Edit Pipeline Stage</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status key</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Changing the key is blocked if leads already use this stage
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPipelineStageModal
