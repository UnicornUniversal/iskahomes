'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiX } from 'react-icons/fi'
import { toPipelineStatusKey } from '@/lib/leadsPipelineHelper'

const CreatePipelineStageModal = ({ isOpen, onClose, onSuccess }) => {
  const { developerToken, agencyToken } = useAuth()
  const authToken = developerToken || agencyToken
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')

  const derivedStatus = status.trim() || toPipelineStatusKey(value)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!value.trim()) {
      toast.error('Stage label is required')
      return
    }

    if (!derivedStatus) {
      toast.error('Enter a valid label or status key')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/leads-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          value: value.trim(),
          status: status.trim() || undefined,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create stage')
      }

      toast.success('Pipeline stage created')
      setValue('')
      setStatus('')
      onSuccess()
    } catch (error) {
      toast.error(error.message || 'Failed to create stage')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto mt-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary_color">Add Pipeline Stage</h2>
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
              placeholder="e.g. Qualified"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status key (optional)</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Auto-generated from label"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {derivedStatus
                ? `Will be stored as: ${derivedStatus}`
                : 'Use lowercase letters, numbers, underscores'}
            </p>
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
              {loading ? 'Creating...' : 'Create Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePipelineStageModal
