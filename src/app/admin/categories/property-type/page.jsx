'use client'

import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiLayers, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PropertyTypesPage = () => {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  })

  // Fetch types
  const fetchTypes = async () => {
    try {
      const response = await fetch('/api/admin/property-types')
      const result = await response.json()
      
      if (response.ok) {
        setTypes(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch types')
      }
    } catch (error) {
      toast.error('Error fetching types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = '/api/admin/property-types'
      const method = editingType ? 'PUT' : 'POST'
      const body = editingType 
        ? { ...formData, id: editingType.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setShowModal(false)
        setEditingType(null)
        setFormData({
          name: '',
          description: '',
          active: true
        })
        fetchTypes()
      } else {
        toast.error(result.error || 'Failed to save type')
      }
    } catch (error) {
      toast.error('Error saving type')
    }
  }

  // Handle edit
  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      active: type.active !== undefined ? type.active : true
    })
    setShowModal(true)
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this type?')) return

    try {
      const response = await fetch(`/api/admin/property-types?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        fetchTypes()
      } else {
        toast.error(result.error || 'Failed to delete type')
      }
    } catch (error) {
      toast.error('Error deleting type')
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingType(null)
    setFormData({
      name: '',
      description: '',
      active: true
    })
  }

  // Reconcile data from database to Redis
  const handleReconcile = async () => {
    setReconciling(true)
    try {
      const response = await fetch('/api/admin/property-types?reconcile=true')
      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Data reconciled and cached successfully')
        // Refresh the data
        await fetchTypes()
      } else {
        toast.error(result.error || 'Failed to reconcile data')
      }
    } catch (error) {
      console.error('Error reconciling data:', error)
      toast.error('Error reconciling data')
    } finally {
      setReconciling(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Property Types</h1>
          <p className="text-gray-600 mt-2">Manage property types and their configurations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`w-5 h-5 ${reconciling ? 'animate-spin' : ''}`} />
            <span>{reconciling ? 'Reconciling...' : 'Reconcile Cache'}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Type</span>
          </button>
        </div>
      </div>

      {/* Types List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {types.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                        <FiLayers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {type.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{type.total_properties || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      type.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {type.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingType ? 'Edit Type' : 'Add New Type'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{editingType ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyTypesPage
