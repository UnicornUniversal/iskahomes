'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiArrowLeft, FiEdit, FiTrash2, FiXCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'

const PackageSinglePage = () => {
  const router = useRouter()
  const params = useParams()
  const singlePackage = params?.single_package
  const packageId = typeof singlePackage === 'string' ? singlePackage : ''
  const isNewPackage = packageId === 'newPackage'

  const [loading, setLoading] = useState(!isNewPackage)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: [],
    api_limits: [],
    local_currency_price: '',
    international_currency_price: '',
    duration: '',
    span: '',
    display_text: '',
    ideal_duration: '',
    subscriptions_type: 'package',
    user_type: '',
    is_active: true
  })
  const [newFeature, setNewFeature] = useState({ feature_name: '', feature_value: '' })
  const [editingFeatureIndex, setEditingFeatureIndex] = useState(null)
  const [newApiLimit, setNewApiLimit] = useState({ name: '', data_type: 'number', value: '' })
  const [editingApiLimitIndex, setEditingApiLimitIndex] = useState(null)
  const isMountedRef = useRef(true)

  const pageTitle = useMemo(() => (
    isNewPackage ? 'Create New Package' : 'Edit Package'
  ), [isNewPackage])

  const normalizeApiLimitsFromDb = useCallback((apiLimits) => {
    if (!apiLimits || typeof apiLimits !== 'object' || Array.isArray(apiLimits)) {
      return []
    }

    return Object.entries(apiLimits)
      .map(([name, config]) => {
        const dataType = ['number', 'text'].includes(config?.data_type)
          ? config.data_type
          : (typeof config?.value === 'number' ? 'number' : 'text')

        return {
          name: String(name || '').trim(),
          data_type: dataType,
          value: String(config?.value ?? '')
        }
      })
      .filter(limit => limit.name)
  }, [])

  const buildApiLimitsObject = useCallback((apiLimitsArray) => {
    if (!Array.isArray(apiLimitsArray)) return {}

    return apiLimitsArray.reduce((acc, limit) => {
      const name = String(limit?.name || '').trim()
      const dataType = String(limit?.data_type || '').toLowerCase().trim()
      const rawValue = limit?.value

      if (!name || !['number', 'text'].includes(dataType)) return acc

      if (dataType === 'number') {
        const parsed = Number(rawValue)
        if (!Number.isFinite(parsed)) return acc
        acc[name] = { data_type: 'number', value: parsed }
      } else {
        acc[name] = { data_type: 'text', value: String(rawValue ?? '') }
      }

      return acc
    }, {})
  }, [])

  const fetchPackage = useCallback(async () => {
    if (isNewPackage) return

    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch package')
      }

      const { data: pkg } = await response.json()
      if (!isMountedRef.current) return

      const features = Array.isArray(pkg?.features)
        ? pkg.features.map(feature => {
            if (typeof feature === 'string') {
              return { feature_name: feature, feature_value: '' }
            }
            return {
              feature_name: String(feature?.feature_name || '').trim(),
              feature_value: String(feature?.feature_value || '')
            }
          }).filter(feature => feature.feature_name)
        : []

      setFormData({
        name: pkg?.name || '',
        description: pkg?.description || '',
        features,
        api_limits: normalizeApiLimitsFromDb(pkg?.api_limits),
        local_currency_price: pkg?.local_currency_price?.toString() || '',
        international_currency_price: pkg?.international_currency_price?.toString() || '',
        duration: pkg?.duration?.toString() || '',
        span: pkg?.span || '',
        display_text: pkg?.display_text || '',
        ideal_duration: pkg?.ideal_duration?.toString() || '',
        subscriptions_type: pkg?.subscriptions_type || 'package',
        user_type: pkg?.user_type || '',
        is_active: pkg?.is_active !== false
      })
    } catch (error) {
      console.error('Error fetching package:', error)
      if (isMountedRef.current) {
        toast.error(error.message || 'Failed to fetch package')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [isNewPackage, normalizeApiLimitsFromDb, packageId])

  useEffect(() => {
    isMountedRef.current = true
    fetchPackage()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchPackage])

  const handleAddOrUpdateFeature = () => {
    const featureName = newFeature.feature_name?.trim()
    if (!featureName) return

    setFormData(prev => {
      const nextFeatures = [...(prev.features || [])]
      const payload = {
        feature_name: featureName,
        feature_value: (newFeature.feature_value || '').trim()
      }

      if (
        editingFeatureIndex !== null &&
        editingFeatureIndex >= 0 &&
        editingFeatureIndex < nextFeatures.length
      ) {
        nextFeatures[editingFeatureIndex] = payload
      } else {
        nextFeatures.push(payload)
      }

      return {
        ...prev,
        features: nextFeatures
      }
    })

    setNewFeature({ feature_name: '', feature_value: '' })
    setEditingFeatureIndex(null)
  }

  const handleEditFeature = (index) => {
    const target = formData.features[index]
    if (!target) return

    setNewFeature({
      feature_name: String(target.feature_name || ''),
      feature_value: String(target.feature_value || '')
    })
    setEditingFeatureIndex(index)
  }

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }))

    if (editingFeatureIndex === index) {
      setEditingFeatureIndex(null)
      setNewFeature({ feature_name: '', feature_value: '' })
    }
  }

  const handleAddOrUpdateApiLimit = () => {
    const name = String(newApiLimit.name || '').trim()
    const dataType = String(newApiLimit.data_type || '').toLowerCase().trim()
    const value = newApiLimit.value

    if (!name || !['number', 'text'].includes(dataType)) {
      toast.error('Please provide a valid API limit name and data type')
      return
    }

    if (dataType === 'number' && !Number.isFinite(Number(value))) {
      toast.error('Number data type requires a valid numeric value')
      return
    }

    setFormData(prev => {
      const nextLimits = [...(prev.api_limits || [])]
      const existingIndex = nextLimits.findIndex((item, index) => (
        index !== editingApiLimitIndex &&
        String(item?.name || '').trim().toLowerCase() === name.toLowerCase()
      ))

      if (existingIndex !== -1) {
        toast.error('API limit name already exists')
        return prev
      }

      const payload = {
        name,
        data_type: dataType,
        value: String(value ?? '')
      }

      if (
        editingApiLimitIndex !== null &&
        editingApiLimitIndex >= 0 &&
        editingApiLimitIndex < nextLimits.length
      ) {
        nextLimits[editingApiLimitIndex] = payload
      } else {
        nextLimits.push(payload)
      }

      return { ...prev, api_limits: nextLimits }
    })

    setNewApiLimit({ name: '', data_type: 'number', value: '' })
    setEditingApiLimitIndex(null)
  }

  const handleEditApiLimit = (index) => {
    const target = formData.api_limits[index]
    if (!target) return

    setNewApiLimit({
      name: String(target.name || ''),
      data_type: String(target.data_type || 'number'),
      value: String(target.value ?? '')
    })
    setEditingApiLimitIndex(index)
  }

  const handleRemoveApiLimit = (index) => {
    setFormData(prev => ({
      ...prev,
      api_limits: (prev.api_limits || []).filter((_, i) => i !== index)
    }))

    if (editingApiLimitIndex === index) {
      setEditingApiLimitIndex(null)
      setNewApiLimit({ name: '', data_type: 'number', value: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isMountedRef.current) return

    if (!formData.name || formData.local_currency_price === '' || formData.international_currency_price === '') {
      toast.error('Please fill in all required fields')
      return
    }

    const isFreePlan = (
      parseFloat(formData.local_currency_price) === 0 &&
      parseFloat(formData.international_currency_price) === 0
    )

    if (!isFreePlan && (!formData.duration || !formData.span)) {
      toast.error('Please provide both duration and span for paid plans')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const method = isNewPackage ? 'POST' : 'PUT'
      const url = isNewPackage ? '/api/admin/packages' : `/api/admin/packages/${packageId}`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          local_currency_price: parseFloat(formData.local_currency_price),
          international_currency_price: parseFloat(formData.international_currency_price),
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          span: formData.span || null,
          display_text: formData.display_text || null,
          ideal_duration: formData.ideal_duration ? parseInt(formData.ideal_duration, 10) : null,
          subscriptions_type: formData.subscriptions_type || 'package',
          user_type: formData.user_type ? formData.user_type.toLowerCase() : null,
          features: formData.features,
          api_limits: buildApiLimitsObject(formData.api_limits)
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save package')
      }

      toast.success(isNewPackage ? 'Package created successfully' : 'Package updated successfully')
      router.push('/admin/subscriptions-management/packages')
    } catch (error) {
      console.error('Error saving package:', error)
      toast.error(error.message || 'Failed to save package')
    } finally {
      if (isMountedRef.current) {
        setSaving(false)
      }
    }
  }

  const handleDeletePackage = async () => {
    if (isNewPackage) return
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete package')
      }

      toast.success('Package deleted successfully')
      router.push('/admin/subscriptions-management/packages')
    } catch (error) {
      console.error('Error deleting package:', error)
      toast.error(error.message || 'Failed to delete package')
    } finally {
      if (isMountedRef.current) {
        setDeleting(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading package...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/subscriptions-management/packages')}
            className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            aria-label="Back to packages"
          >
            <FiArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        {!isNewPackage && (
          <button
            type="button"
            onClick={handleDeletePackage}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60"
          >
            <FiTrash2 />
            {deleting ? 'Deleting...' : 'Delete Package'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Basic Plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Package description..."
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
                <span className="text-xs text-gray-500 ml-2">Required for paid plans</span>
              </label>
              <input
                type="number"
                min="1"
                required={!(parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0)}
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1, 3, 12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Span
                <span className="text-xs text-gray-500 ml-2">Required for paid plans</span>
              </label>
              <select
                required={!(parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0)}
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
          </div>

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
              placeholder="e.g., 3 for 3 months minimum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Type
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <input
                type="checkbox"
                id="is_addon"
                checked={formData.subscriptions_type === 'addon'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  subscriptions_type: e.target.checked ? 'addon' : 'package'
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_addon" className="text-sm font-medium text-gray-700">
                This package is an addon
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Unchecked = main package, checked = addon package.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
              <span className="text-xs text-gray-500 ml-2">Required for paid plans</span>
            </label>
            <select
              required={!(parseFloat(formData.local_currency_price) === 0 && parseFloat(formData.international_currency_price) === 0)}
              value={formData.user_type}
              onChange={(e) => setFormData(prev => ({ ...prev, user_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select user type...</option>
              <option value="developers">Developers</option>
              <option value="agents">Agents</option>
              <option value="agencies">Agencies</option>
              <option value="all">All Users</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                value={newFeature.feature_name}
                onChange={(e) => setNewFeature(prev => ({ ...prev, feature_name: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newFeature.feature_name?.trim()) {
                    e.preventDefault()
                    handleAddOrUpdateFeature()
                  }
                }}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Feature name"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature.feature_value}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, feature_value: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newFeature.feature_name?.trim()) {
                      e.preventDefault()
                      handleAddOrUpdateFeature()
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={handleAddOrUpdateFeature}
                  disabled={!newFeature.feature_name?.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {editingFeatureIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(formData.features || []).map((feature, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{feature.feature_name}:</span>
                    <span className="text-sm text-gray-600">{feature.feature_value}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleEditFeature(index)} className="text-blue-600 hover:text-blue-800">
                      <FiEdit />
                    </button>
                    <button type="button" onClick={() => handleRemoveFeature(index)} className="text-red-600 hover:text-red-800">
                      <FiXCircle />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Limits</label>
            <div className="grid grid-cols-12 gap-2 mb-2">
              <input
                type="text"
                value={newApiLimit.name}
                onChange={(e) => setNewApiLimit(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name (e.g., total_listings)"
              />
              <select
                value={newApiLimit.data_type}
                onChange={(e) => setNewApiLimit(prev => ({ ...prev, data_type: e.target.value }))}
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="number">number</option>
                <option value="text">text</option>
              </select>
              <input
                type={newApiLimit.data_type === 'number' ? 'number' : 'text'}
                step={newApiLimit.data_type === 'number' ? 'any' : undefined}
                value={newApiLimit.value}
                onChange={(e) => setNewApiLimit(prev => ({ ...prev, value: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newApiLimit.name?.trim()) {
                    e.preventDefault()
                    handleAddOrUpdateApiLimit()
                  }
                }}
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Value"
              />
              <button
                type="button"
                onClick={handleAddOrUpdateApiLimit}
                className="col-span-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {editingApiLimitIndex !== null ? 'Update' : 'Add'}
              </button>
            </div>
            <div className="space-y-2">
              {(formData.api_limits || []).map((limit, index) => (
                <div key={`${limit.name}-${index}`} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-gray-900">{limit.name}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs uppercase">{limit.data_type}</span>
                    <span className="text-gray-600">{String(limit.value ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleEditApiLimit(index)} className="text-blue-600 hover:text-blue-800">
                      <FiEdit />
                    </button>
                    <button type="button" onClick={() => handleRemoveApiLimit(index)} className="text-red-600 hover:text-red-800">
                      <FiXCircle />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/subscriptions-management/packages')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : (isNewPackage ? 'Create Package' : 'Update Package')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PackageSinglePage
