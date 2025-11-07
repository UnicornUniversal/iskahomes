'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PackagesPage = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: [],
    local_currency_price: '',
    international_currency_price: '',
    duration: '',
    span: '',
    display_text: '',
    ideal_duration: '',
    user_type: '',
    is_active: true
  })
  const [newFeature, setNewFeature] = useState({ feature_name: '', feature_value: '' })
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchPackages = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })

      // Check if request was aborted
      if (abortController.signal.aborted) return

      if (response.ok) {
        const { data } = await response.json()
        if (isMountedRef.current) {
          setPackages(data || [])
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to fetch packages')
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching packages:', error)
      if (isMountedRef.current) {
        toast.error('Failed to fetch packages')
      }
    } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch packages
  useEffect(() => {
    isMountedRef.current = true
    fetchPackages()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchPackages])

  const handleAddFeature = () => {
    if (newFeature?.feature_name?.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, {
          feature_name: newFeature.feature_name.trim(),
          feature_value: (newFeature.feature_value || '').trim()
        }]
      }))
      setNewFeature({ feature_name: '', feature_value: '' })
    }
  }

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!isMountedRef.current) return

    if (!formData.name || formData.local_currency_price === '' || formData.international_currency_price === '') {
      toast.error('Please fill in all required fields')
      return
    }

    // For free plans (price = 0), duration and span are optional
    const isFreePlan = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
    
    if (!isFreePlan && (!formData.duration || !formData.span)) {
      toast.error('Please provide both duration and span for paid plans')
      return
    }

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const url = editingPackage 
        ? `/api/admin/packages/${editingPackage.id}`
        : '/api/admin/packages'
      
      const method = editingPackage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          local_currency_price: parseFloat(formData.local_currency_price),
          international_currency_price: parseFloat(formData.international_currency_price),
          duration: formData.duration ? parseInt(formData.duration) : null,
          span: formData.span || null,
          display_text: formData.display_text || null,
          ideal_duration: formData.ideal_duration ? parseInt(formData.ideal_duration) : null,
          user_type: formData.user_type ? formData.user_type.toLowerCase() : null,
          features: formData.features
        })
      })

      if (response.ok) {
        if (isMountedRef.current) {
          toast.success(editingPackage ? 'Package updated successfully' : 'Package created successfully')
          setShowModal(false)
          resetForm()
          fetchPackages()
        }
      } else {
        const error = await response.json()
        if (isMountedRef.current) {
          toast.error(error.error || 'Failed to save package')
        }
      }
    } catch (error) {
      console.error('Error saving package:', error)
      if (isMountedRef.current) {
        toast.error('Failed to save package')
      }
    }
  }, [formData, editingPackage, fetchPackages])

  const handleEdit = useCallback((pkg) => {
    setEditingPackage(pkg)
    
    // Convert features to object format if they're in old text format
    let features = pkg.features || []
    if (features.length > 0 && typeof features[0] === 'string') {
      // Old format: array of strings, convert to objects
      features = features.map(f => ({
        feature_name: f,
        feature_value: ''
      }))
    }
    
    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      features: features,
      local_currency_price: pkg.local_currency_price?.toString() || '',
      international_currency_price: pkg.international_currency_price?.toString() || '',
      duration: pkg.duration?.toString() || '',
      span: pkg.span || '',
      display_text: pkg.display_text || '',
      ideal_duration: pkg.ideal_duration?.toString() || '',
      user_type: pkg.user_type || '',
      is_active: pkg.is_active !== false
    })
    setShowModal(true)
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!isMountedRef.current) return
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        if (isMountedRef.current) {
          toast.success('Package deleted successfully')
          fetchPackages()
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to delete package')
        }
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      if (isMountedRef.current) {
        toast.error('Failed to delete package')
      }
    }
  }, [fetchPackages])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      features: [],
      local_currency_price: '',
      international_currency_price: '',
      duration: '',
      span: '',
      display_text: '',
      ideal_duration: '',
      user_type: '',
      is_active: true
    })
    setEditingPackage(null)
    setNewFeature({ feature_name: '', feature_value: '' })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading packages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Packages</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create Package
        </button>
      </div>

      {/* Packages Cards */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No packages found. Create your first package!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isFreePlan = parseFloat(pkg.local_currency_price || 0) === 0 && parseFloat(pkg.international_currency_price || 0) === 0
            
            return (
              <div key={pkg.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className={`px-6 py-4 border-b ${isFreePlan ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      )}
                    </div>
                    {pkg.is_active ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <FiCheckCircle /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <FiXCircle /> Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4 space-y-3">
                  {/* Pricing - Monthly */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Monthly Price (GHS)</div>
                      <div className="text-xl font-bold text-gray-900">
                        GHS {parseFloat(pkg.local_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Monthly Price (USD)</div>
                      <div className="text-xl font-bold text-gray-900">
                        USD {parseFloat(pkg.international_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Total Amount - If ideal_duration exists */}
                  {pkg.ideal_duration && pkg.ideal_duration > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Total Amount (GHS)</div>
                          <div className="text-lg font-bold text-gray-900">
                            GHS {parseFloat(pkg.total_amount_ghs || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {parseFloat(pkg.local_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {pkg.ideal_duration} months
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Total Amount (USD)</div>
                          <div className="text-lg font-bold text-gray-900">
                            USD {parseFloat(pkg.total_amount_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {parseFloat(pkg.international_currency_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {pkg.ideal_duration} months
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Text */}
                  {pkg.display_text && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-sm text-gray-600">Display Text</div>
                      <div className="text-sm font-medium text-gray-900">{pkg.display_text}</div>
                    </div>
                  )}

                  {/* Duration & Span */}
                  {(pkg.duration && pkg.span) && (
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration: </span>
                        <span className="font-medium text-gray-900">{pkg.duration} {pkg.span}</span>
                      </div>
                      {pkg.ideal_duration && (
                        <div>
                          <span className="text-gray-600">Ideal: </span>
                          <span className="font-medium text-gray-900">{pkg.ideal_duration} months</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Type */}
                  {pkg.user_type && (
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {pkg.user_type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] mt-[5em] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Package description..."
                  />
                </div>

                {/* Pricing - GHS (Full Row) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (GHS) *
                    <span className="text-xs text-gray-500 ml-2">Local Currency (Fixed - Non-negotiable)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-700 font-semibold">GHS</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.local_currency_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_currency_price: e.target.value }))}
                      className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="0.00 (Enter 0 for free plan)"
                    />
                  </div>
                </div>

                {/* Pricing - USD (Full Row) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD) *
                    <span className="text-xs text-gray-500 ml-2">International Currency (Fixed - Non-negotiable)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-700 font-semibold">USD</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.international_currency_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, international_currency_price: e.target.value }))}
                      className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="0.00 (Enter 0 for free plan)"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration {(() => {
                        const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                        return !isFree ? '*' : ''
                      })()}
                      <span className="text-xs text-gray-500 ml-2">Optional for free plans</span>
                    </label>
                    <input
                      type="number"
                      required={(() => {
                        const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                        return !isFree
                      })()}
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1, 3, 12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Span {(() => {
                        const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                        return !isFree ? '*' : ''
                      })()}
                      <span className="text-xs text-gray-500 ml-2">Optional for free plans</span>
                    </label>
                    <select
                      required={(() => {
                        const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                        return !isFree
                      })()}
                      value={formData.span}
                      onChange={(e) => setFormData(prev => ({ ...prev, span: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select span...</option>
                      <option value="month">Month</option>
                      <option value="months">Months</option>
                      <option value="year">Year</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                {/* Display Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Text
                    <span className="text-xs text-gray-500 ml-2">Text to display price and duration</span>
                  </label>
                  <input
                    type="text"
                    value={formData.display_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_text: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., GHS 100 / month or USD 50 / year"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: "GHS 100 / month" or "USD 50 / year"
                  </p>
                </div>

                {/* Ideal Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ideal Duration (Months)
                    <span className="text-xs text-gray-500 ml-2">Minimum subscription duration in months</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ideal_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, ideal_duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3 for 3 months minimum, 12 for 1 year minimum"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 3 (for 3 months minimum), 12 (for 1 year minimum)
                  </p>
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type {(() => {
                      const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                      return !isFree ? '*' : ''
                    })()}
                    <span className="text-xs text-gray-500 ml-2">Type of user this package is intended for (Optional for free plans)</span>
                  </label>
                  <select
                    required={(() => {
                      const isFree = parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0
                      return !isFree
                    })()}
                    value={formData.user_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user type...</option>
                    <option value="developers">Developers</option>
                    <option value="agents">Agents</option>
                    <option value="agencies">Agencies</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Stored as lowercase in database (developers, agents, agencies). Optional for free plans.
                  </p>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature?.feature_name || ''}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, feature_name: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newFeature?.feature_name?.trim()) {
                          e.preventDefault()
                          handleAddFeature()
                        }
                      }}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Feature name (e.g., Rank)"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                      value={newFeature?.feature_value || ''}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, feature_value: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newFeature?.feature_name?.trim()) {
                            e.preventDefault()
                            handleAddFeature()
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Value (e.g., 2)"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        disabled={!newFeature?.feature_name?.trim()}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {typeof feature === 'object' ? feature.feature_name : feature}:
                          </span>
                          <span className="text-sm text-gray-600">
                            {typeof feature === 'object' ? feature.feature_value : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiXCircle />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PackagesPage

