'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiX, FiShield } from 'react-icons/fi'
import PermissionsEditor from './PermissionsEditor'

const CreateRoleModal = ({ isOpen, onClose, onSuccess, organizationType = 'developer' }) => {
  const { developerToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {},
    is_default: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Role name is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/developers/team/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${developerToken}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        // Check for duplicate role name
        if (error.error && error.error.toLowerCase().includes('already exists')) {
          toast.error('A role with this name already exists. Please choose a different name.')
        } else {
          throw new Error(error.error || 'Failed to create role')
        }
        return
      }

      toast.success('Role created successfully!')
      onSuccess()
      // Reset form
      setFormData({
        name: '',
        description: '',
        permissions: {},
        is_default: false
      })
    } catch (error) {
      toast.error(error.message || 'Failed to create role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary_color">Create New Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none"
                placeholder="e.g., Manager, Editor, Viewer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none resize-none"
              placeholder="Describe what this role can do..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Permissions <span className="text-red-500">*</span>
            </label>
            <PermissionsEditor
              permissions={formData.permissions}
              onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
              organizationType={organizationType}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              className="w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Set as default role for new team members
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoleModal

