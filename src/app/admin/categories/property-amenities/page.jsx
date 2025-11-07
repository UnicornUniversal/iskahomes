'use client'

import React, { useState, useEffect } from 'react'
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiStar, FiCheckCircle, FiUpload, FiX, FiRefreshCw } from 'react-icons/fi'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-toastify'

const PropertyAmenitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState(null)
  const [amenities, setAmenities] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [iconPreviewUrl, setIconPreviewUrl] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: [], // Array of property type IDs
    icon: null,
    active: true
  })

  // Fetch amenities and types
  const fetchData = async () => {
    try {
      const [amenitiesResponse, typesResponse] = await Promise.all([
        fetch('/api/admin/property-amenities'),
        fetch('/api/admin/property-types')
      ])

      const [amenitiesResult, typesResult] = await Promise.all([
        amenitiesResponse.json(),
        typesResponse.json()
      ])

      if (amenitiesResponse.ok) {
        setAmenities(amenitiesResult.data || [])
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

  // Reconcile data from database to Redis
  const handleReconcile = async () => {
    setReconciling(true)
    try {
      const response = await fetch('/api/admin/property-amenities?reconcile=true')
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

  useEffect(() => {
    fetchData()
  }, [])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (iconPreviewUrl) {
        URL.revokeObjectURL(iconPreviewUrl)
      }
    }
  }, [iconPreviewUrl])

  // Handle icon upload to Supabase
  const handleIconUpload = async (file) => {
    if (!file) return null

    setUploadingIcon(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `amenity-icons/${fileName}`

      console.log('Uploading file to:', filePath)
      console.log('File details:', { name: file.name, size: file.size, type: file.type })

      const { data, error } = await supabase.storage
        .from('iskaHomes')
        .upload(filePath, file)

      if (error) {
        console.error('Storage upload error:', error)
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error
        })
        
        // Log to server as well
        try {
          await fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'storage_upload_error',
              error: error,
              filePath: filePath,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            })
          })
        } catch (logError) {
          console.error('Failed to log error to server:', logError)
        }
        
        toast.error(`Upload failed: ${error.message}`)
        return null
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('iskaHomes')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)
      toast.success('Icon uploaded successfully!')
      return publicUrl
    } catch (error) {
      console.error('Error uploading icon:', error)
      toast.error(`Upload failed: ${error.message}`)
      return null
    } finally {
      setUploadingIcon(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let iconUrl = formData.icon
      
      // If there's a new icon file, upload it
      if (formData.icon instanceof File) {
        iconUrl = await handleIconUpload(formData.icon)
        if (!iconUrl) {
          alert('Failed to upload icon')
          return
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        property_type: formData.property_type,
        icon: iconUrl,
        active: formData.active
      }

      const url = editingAmenity 
        ? '/api/admin/property-amenities'
        : '/api/admin/property-amenities'
      
      const method = editingAmenity ? 'PUT' : 'POST'
      
      if (editingAmenity) {
        payload.id = editingAmenity.id
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
        
        // Clean up preview URL
        if (iconPreviewUrl) {
          URL.revokeObjectURL(iconPreviewUrl)
          setIconPreviewUrl(null)
        }
        
        setShowAddModal(false)
        setEditingAmenity(null)
        setFormData({
          name: '',
          description: '',
          property_type: [],
          icon: null,
          active: true
        })
        fetchData()
      } else {
        toast.error(result.error || 'Failed to save amenity')
      }
    } catch (error) {
      console.error('Error saving amenity:', error)
      toast.error('Error saving amenity')
    }
  }

  // Handle edit
  const handleEdit = (amenity) => {
    setEditingAmenity(amenity)
    
    setFormData({
      name: amenity.name,
      description: amenity.description || '',
      property_type: cleanPropertyTypes(amenity.property_type),
      icon: amenity.icon,
      active: amenity.active !== undefined ? amenity.active : true
    })
    setShowAddModal(true)
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this amenity?')) return

    try {
      const response = await fetch('/api/admin/property-amenities', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to delete amenity')
      }
    } catch (error) {
      console.error('Error deleting amenity:', error)
      toast.error('Error deleting amenity')
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    // Clean up preview URL
    if (iconPreviewUrl) {
      URL.revokeObjectURL(iconPreviewUrl)
      setIconPreviewUrl(null)
    }
    
    setShowAddModal(false)
    setEditingAmenity(null)
    setFormData({
      name: '',
      description: '',
      property_type: [],
      icon: null,
      active: true
    })
  }

  // Get type name by ID
  const getTypeName = (typeId) => {
    const type = types.find(t => t.id === typeId)
    return type ? type.name : 'Unknown Type'
  }

  // Clean up property_type data - handle both single values and arrays
  const cleanPropertyTypes = (propertyType) => {
    if (Array.isArray(propertyType)) {
      return propertyType
    } else if (typeof propertyType === 'string') {
      try {
        const parsed = JSON.parse(propertyType)
        return Array.isArray(parsed) ? parsed : [propertyType]
      } catch {
        return [propertyType]
      }
    } else {
      return [propertyType]
    }
  }

  const filteredAmenities = amenities.filter(amenity =>
    amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amenity.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Property Amenities</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage property amenities and features.</p>
      </div>

      {/* Search and Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search amenities..."
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
              <span className="hidden sm:inline">Add Amenity</span>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Amenities</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{amenities.length}</p>
            </div>
            <FiStar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {amenities.filter(a => a.active).length}
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
            <FiStar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Types</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAmenities.map((amenity) => (
                <tr key={amenity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {amenity.icon ? (
                          <img 
                            src={amenity.icon} 
                            alt={amenity.name}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center" style={{ display: amenity.icon ? 'none' : 'flex' }}>
                          <FiStar className="w-5 h-5 text-yellow-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{amenity.name}</div>
                        <div className="text-sm text-gray-500">ID: {amenity.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {cleanPropertyTypes(amenity.property_type).map((typeId, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {getTypeName(typeId)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate">{amenity.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      amenity.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {amenity.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(amenity)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(amenity.id)}
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
        {filteredAmenities.map((amenity) => (
          <div key={amenity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12">
                  {amenity.icon ? (
                    <img 
                      src={amenity.icon} 
                      alt={amenity.name}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center" style={{ display: amenity.icon ? 'none' : 'flex' }}>
                    <FiStar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{amenity.name}</h3>
                  <p className="text-xs text-gray-500">ID: {amenity.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleEdit(amenity)}
                  className="text-green-600 hover:text-green-900 p-1"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(amenity.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Property Types</p>
                <div className="flex flex-wrap gap-1">
                  {cleanPropertyTypes(amenity.property_type).map((typeId, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getTypeName(typeId)}
                    </span>
                  ))}
                </div>
              </div>
              
              {amenity.description && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-900">{amenity.description}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  amenity.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {amenity.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white md:mt-[6em] rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 ">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amenity name"
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
                  placeholder="Enter amenity description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Types * (Select one or more)
                </label>
                <div className="max-h-32 sm:max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 sm:p-3 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                    {types.map((type) => (
                      <label key={type.id} className="flex items-center space-x-2 cursor-pointer p-1 sm:p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.property_type.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, property_type: [...formData.property_type, type.id] })
                            } else {
                              setFormData({ ...formData, property_type: formData.property_type.filter(id => id !== type.id) })
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.property_type.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">Please select at least one property type</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="space-y-3">
                  {/* Show current/existing icon */}
                  {formData.icon && typeof formData.icon === 'string' && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img src={formData.icon} alt="Current icon" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Current icon</p>
                        <p className="text-xs text-gray-500 truncate">{formData.icon}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, icon: null})}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Show selected file preview */}
                  {formData.icon && formData.icon instanceof File && iconPreviewUrl && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded border overflow-hidden">
                        <img 
                          src={iconPreviewUrl} 
                          alt="Selected icon" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Selected file</p>
                        <p className="text-xs text-blue-500 truncate">{formData.icon.name}</p>
                        <p className="text-xs text-blue-400">{(formData.icon.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (iconPreviewUrl) {
                            URL.revokeObjectURL(iconPreviewUrl)
                            setIconPreviewUrl(null)
                          }
                          setFormData({...formData, icon: null})
                        }}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload area - only show if no icon is selected */}
                  {!formData.icon && (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-3 pb-4 sm:pt-5 sm:pb-6">
                          {uploadingIcon ? (
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                          ) : (
                            <>
                              <FiUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-gray-400" />
                              <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 text-center">
                                <span className="font-semibold">Click to upload</span> icon
                              </p>
                              <p className="text-xs text-gray-500 text-center">PNG, JPG, SVG, WEBP (MAX. 2MB)</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.svg"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('File size must be less than 2MB')
                              return
                            }
                              
                              // Clean up previous preview URL
                              if (iconPreviewUrl) {
                                URL.revokeObjectURL(iconPreviewUrl)
                              }
                              
                              // Create new preview URL
                              const previewUrl = URL.createObjectURL(file)
                              setIconPreviewUrl(previewUrl)
                              setFormData({...formData, icon: file})
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
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
                  {editingAmenity ? 'Update' : 'Add'} Amenity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyAmenitiesPage