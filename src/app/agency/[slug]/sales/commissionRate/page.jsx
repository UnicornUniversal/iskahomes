'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import CustomDropdown from '@/app/components/developers/units/CustomDropdown'

export default function CommissionRatePage() {
  const params = useParams()
  const { user, refreshUser, agencyToken } = useAuth()
  const slug = params.slug || ''
  
  const [purposes, setPurposes] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [commissionRates, setCommissionRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    purpose: null,
    type: null,
    commission_rate: ''
  })

  // Fetch property purposes and types
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const response = await fetch('/api/property-taxonomy')
        const result = await response.json()
        if (result.success) {
          setPurposes(result.data.purposes || [])
          setPropertyTypes(result.data.propertyTypes || [])
        }
      } catch (error) {
        console.error('Error fetching taxonomy:', error)
      }
    }
    fetchTaxonomy()
  }, [])

  // Load commission rates from user profile
  useEffect(() => {
    if (user?.profile?.commission_rates) {
      let rates = user.profile.commission_rates
      
      // Handle old format: {"default": 3.0}
      if (rates && typeof rates === 'object' && !Array.isArray(rates)) {
        if (rates.default !== undefined) {
          // Convert old format to new format
          rates = []
        } else {
          rates = []
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(rates)) {
        rates = []
      }
      
      setCommissionRates(rates)
      setLoading(false)
    } else {
      setCommissionRates([])
      setLoading(false)
    }
  }, [user?.profile?.commission_rates])

  // Purpose options for dropdown
  const purposeOptions = purposes.map(p => ({
    value: p.id,
    label: p.name
  }))

  // Type options for dropdown - show all types (purpose filtering can be done later if needed)
  const typeOptions = [
    { value: '', label: 'All Types (No specific type)' },
    ...propertyTypes.map(t => ({
      value: t.id,
      label: t.name
    }))
  ]

  const handlePurposeChange = (purposeId) => {
    const selectedPurpose = purposes.find(p => p.id === purposeId)
    setFormData({
      ...formData,
      purpose: selectedPurpose ? { id: selectedPurpose.id, name: selectedPurpose.name } : null,
      type: null // Reset type when purpose changes
    })
  }

  const handleTypeChange = (typeId) => {
    if (!typeId) {
      setFormData({ ...formData, type: null })
      return
    }
    const selectedType = propertyTypes.find(t => t.id === typeId)
    setFormData({
      ...formData,
      type: selectedType ? { id: selectedType.id, name: selectedType.name } : null
    })
  }

  const handleEdit = (rate) => {
    setEditingId(rate.id)
    setFormData({
      purpose: rate.purpose || null,
      type: rate.type || null,
      commission_rate: rate.commission_rate?.toString() || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      purpose: null,
      type: null,
      commission_rate: ''
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission rate?')) {
      return
    }

    const updatedRates = commissionRates.filter(rate => rate.id !== id)
    await saveCommissionRates(updatedRates)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.purpose || !formData.commission_rate) {
      toast.error('Please select a purpose and enter a commission rate')
      return
    }

    const rateValue = parseFloat(formData.commission_rate)
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
      toast.error('Commission rate must be a number between 0 and 100')
      return
    }

    let updatedRates = [...commissionRates]
    
    if (editingId) {
      // Update existing
      updatedRates = updatedRates.map(rate => 
        rate.id === editingId
          ? {
              id: editingId,
              purpose: formData.purpose,
              type: formData.type || null,
              commission_rate: rateValue
            }
          : rate
      )
    } else {
      // Add new
      const newRate = {
        id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purpose: formData.purpose,
        type: formData.type || null,
        commission_rate: rateValue
      }
      updatedRates.push(newRate)
    }

    await saveCommissionRates(updatedRates)
    
    // Reset form
    setFormData({
      purpose: null,
      type: null,
      commission_rate: ''
    })
    setEditingId(null)
  }

  const saveCommissionRates = async (rates) => {
    setSaving(true)
    try {
      // Get agency token - try from context first, then localStorage
      const token = agencyToken || localStorage.getItem('agency_token')
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }

      const response = await fetch('/api/agencies/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commission_rates: rates
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save commission rates')
      }

      // Update local state
      setCommissionRates(rates)
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser()
      }
      
      toast.success('Commission rates saved successfully!')
    } catch (error) {
      console.error('Error saving commission rates:', error)
      toast.error(error.message || 'Failed to save commission rates')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full flex flex-col gap-6">
        <div>
          <h1 className="text-primary_color mb-2">Commission Rates</h1>
          <p className="text-gray-600 text-sm">
            Manage commission rates for different property purposes and types. These rates will be used when listing properties.
          </p>
        </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Edit Commission Rate' : 'Add Commission Rate'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Purpose Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Purpose <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={purposeOptions}
                value={formData.purpose?.id || ''}
                onChange={handlePurposeChange}
                placeholder="Select purpose"
                className="w-full"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <CustomDropdown
                options={typeOptions}
                value={formData.type?.id || ''}
                onChange={handleTypeChange}
                placeholder="Select type (optional)"
                className="w-full"
              />
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                placeholder="e.g., 3.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:border-primary_color focus:ring-2 focus:ring-primary_color/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : editingId ? (
                <>
                  <Check className="w-4 h-4" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Rate
                </>
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Commission Rates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Commission Rates ({commissionRates.length})
          </h2>
        </div>

        {commissionRates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No commission rates added yet.</p>
            <p className="text-sm mt-2">Add your first commission rate using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissionRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rate.purpose?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {rate.type?.name || <span className="text-gray-400 italic">All Types</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-primary_color">
                        {rate.commission_rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-primary_color hover:text-primary_color/80 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
