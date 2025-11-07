'use client'

import React, { useState, useEffect } from 'react'
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiTag, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PropertySubtypePage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSubtype, setEditingSubtype] = useState(null)
  const [subtypes, setSubtypes] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [reconciling, setReconciling] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: '',
    active: true
  })

  // Fetch subtypes and types
  const fetchData = async () => {
    try {
      const [subtypesResponse, typesResponse] = await Promise.all([
        fetch('/api/admin/property-subtypes'),
        fetch('/api/admin/property-types')
      ])

      const [subtypesResult, typesResult] = await Promise.all([
        subtypesResponse.json(),
        typesResponse.json()
      ])

      if (subtypesResponse.ok) {
        setSubtypes(subtypesResult.data || [])
      }
      if (typesResponse.ok) {
        setTypes(typesResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        property_type: formData.property_type,
        active: formData.active
      }

      const url = editingSubtype 
        ? '/api/admin/property-subtypes'
        : '/api/admin/property-subtypes'
      
      const method = editingSubtype ? 'PUT' : 'POST'
      
      if (editingSubtype) {
        payload.id = editingSubtype.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setShowAddModal(false)
        setEditingSubtype(null)
        setFormData({
          name: '',
          description: '',
          property_type: '',
          active: true
        })
        fetchData()
      } else {
        toast.error(result.error || 'Failed to save subtype')
      }
    } catch (error) {
      console.error('Error saving subtype:', error)
      toast.error('Error saving subtype')
    }
  }

  // Handle edit
  const handleEdit = (subtype) => {
    setEditingSubtype(subtype)
    setFormData({
      name: subtype.name,
      description: subtype.description || '',
      property_type: subtype.property_type || '',
      active: subtype.active !== undefined ? subtype.active : true
    })
    setShowAddModal(true)
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subtype?')) return

    try {
      const response = await fetch(`/api/admin/property-subtypes?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to delete subtype')
      }
    } catch (error) {
      console.error('Error deleting subtype:', error)
      toast.error('Error deleting subtype')
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingSubtype(null)
    setFormData({
      name: '',
      description: '',
      property_category: '',
      property_type: '',
      active: true
    })
  }

  // Get type name by ID
  const getTypeName = (typeId) => {
    const type = types.find(t => t.id === typeId)
    return type ? type.name : 'Unknown Type'
  }

  // Reconcile data from database to Redis
  const handleReconcile = async () => {
    setReconciling(true)
    try {
      const response = await fetch('/api/admin/property-subtypes?reconcile=true')
      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Data reconciled and cached successfully')
        // Refresh the data
        await fetchData()
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

  const filteredSubtypes = subtypes.filter(subtype =>
    subtype.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subtype.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Property Sub-types</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage property sub-types and variations.</p>
      </div>

      {/* Search and Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sub-types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReconcile}
              disabled={reconciling}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{reconciling ? 'Reconciling...' : 'Reconcile Cache'}</span>
              <span className="sm:hidden">{reconciling ? '...' : 'Sync'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Sub-type</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sub-types</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{subtypes.length}</p>
            </div>
            <FiTag className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {subtypes.filter(s => s.active).length}
              </p>
            </div>
            <FiCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Property Types</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{types.length}</p>
            </div>
            <FiTag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubtypes.map((subtype) => (
                <tr key={subtype.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <FiTag className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{subtype.name}</div>
                        <div className="text-sm text-gray-500">ID: {subtype.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeName(subtype.property_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate">{subtype.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      subtype.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subtype.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(subtype)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(subtype.id)}
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredSubtypes.map((subtype) => (
          <div key={subtype.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <FiTag className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{subtype.name}</h3>
                  <p className="text-xs text-gray-500">ID: {subtype.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleEdit(subtype)}
                  className="text-green-600 hover:text-green-900 p-1"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(subtype.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Property Type</p>
                <p className="text-sm text-gray-900">{getTypeName(subtype.property_type)}</p>
              </div>
              
              {subtype.description && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-900">{subtype.description}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  subtype.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subtype.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSubtype ? 'Edit Sub-type' : 'Add New Sub-type'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter sub-type name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter sub-type description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSubtype ? 'Update' : 'Add'} Sub-type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertySubtypePage