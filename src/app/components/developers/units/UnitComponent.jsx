"use client"
import React, { useState, useEffect } from 'react'
import UnitDescription from './UnitDescription'
import UnitAmenities from './UnitAmenities'
import UnitMedia from './UnitMedia'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { uploadFileToStorage, uploadMultipleFilesToStorage } from '@/lib/fileUpload'

const TABS = [
  { label: 'Description', key: 'description' },
  { label: 'Media', key: 'media' },
  { label: 'Amenities', key: 'amenities' },
]

const UnitComponent = ({ mode = 'add', unitId = null }) => {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [developments, setDevelopments] = useState([])
  const [hasFetched, setHasFetched] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'houses',
    unit_type: '',
    development_id: '',
    location: {
      city: '',
      neighborhood: '',
      gps_coordinates: {
        latitude: '',
        longitude: ''
      },
      address: ''
    },
    size: {
      bedrooms: 0,
      bathrooms: 0,
      living_space: '',
      total_area: '',
      ceiling_height: '',
      capacity: 0
    },
    features: {
      kitchen_type: '',
      balcony: false,
      garden: false,
      security: false,
      gated_community: false,
      internet: false,
      parking: false,
      conference_rooms: false,
      washrooms: false,
      loading_docks: false,
      forklift_access: false,
      power_backup: false,
      water_supply: false,
      stage: false,
      lighting: false,
      sound_system: false,
      chairs_tables: false,
      catering_services: false,
      road_access: false,
      proximity_to_utilities: false
    },
    utilities: {
      water_supply: false,
      electricity: false,
      internet: false,
      drainage: false
    },
    status: 'available',
    lease_terms: {
      rent_price: 0,
      deposit: 0,
      duration: 'monthly',
      flexible_terms: false,
      cancellation_policy: '',
      security_requirements: ''
    },
    documentation: {
      title_deed: '',
      land_certificate: '',
      lease_status: 'freehold'
    },
    topography: 'flat',
    media: {
      images: [],
      videos: [],
      virtual_tour_url: '',
      model_3d: null
    },
    amenities: {
      database: [],
      general: [],
      custom: []
    },
    owner_info: {
      name: '',
      phone: '',
      email: '',
      type: 'owner'
    },
    pricing: {
      rent_price: 0,
      sale_price: 0,
      deposit: 0,
      currency: 'GHS',
      negotiable: false
    },
    availability: {
      status: 'available',
      available_from: '',
      booking_rules: ''
    },
    unit_status: 'active'
  })

  // Fetch developer's developments
  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!user?.profile?.developer_id || hasFetched) return

      try {
        setLoading(true)
        setHasFetched(true)

        const token = localStorage.getItem('developer_token')
        // Use developer_id from profile (already set in AuthContext for team members)
        const developerId = user?.profile?.developer_id
        
        if (!developerId) {
          console.error('Developer ID not found')
          return
        }
        
        const response = await fetch(`/api/developments?developer_id=${developerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setDevelopments(data.data || data || [])
        } else {
          toast.error('Failed to fetch developments')
        }
      } catch (error) {
        console.error('Error fetching developments:', error)
        toast.error('Error fetching developments')
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopments()
  }, [user, hasFetched])

  // Fetch unit data if in edit mode
  useEffect(() => {
    if (!mode === 'edit' || !unitId || !user) return

    const fetchUnitData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('developer_token')
        const response = await fetch(`/api/units/${unitId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const { data } = await response.json()
          setFormData(data)
        } else {
          toast.error('Failed to fetch unit data')
        }
      } catch (error) {
        console.error('Error fetching unit:', error)
        toast.error('Error fetching unit data')
      } finally {
        setLoading(false)
      }
    }

    fetchUnitData()
  }, [mode, unitId, user])

  // Update form data from child components
  const updateFormData = (sectionData) => {
    setFormData(prev => ({
      ...prev,
      ...sectionData
    }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.profile?.developer_id) {
      toast.error('Please log in to create/update units')
      return
    }

    if (!formData.title || !formData.description || !formData.development_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('developer_token')
      
      // Upload files to Supabase Storage
      const { media, ...otherFormData } = formData
      
      // Upload images
      let imagesData = []
      if (media.images && media.images.length > 0) {
        const imageUploads = media.images.filter(file => file instanceof File)
        if (imageUploads.length > 0) {
          const imagesUpload = await uploadMultipleFilesToStorage(imageUploads, 'iskaHomes', 'unit-images')
          if (imagesUpload.success) {
            imagesData = imagesUpload.data.map(file => ({
              url: file.url,
              alt: file.name,
              type: 'interior'
            }))
          }
        }
      }

      // Upload videos
      let videosData = []
      if (media.videos && media.videos.length > 0) {
        const videoUploads = media.videos.filter(file => file instanceof File)
        if (videoUploads.length > 0) {
          const videosUpload = await uploadMultipleFilesToStorage(videoUploads, 'iskaHomes', 'unit-videos')
          if (videosUpload.success) {
            videosData = videosUpload.data.map(file => ({
              url: file.url,
              title: file.name,
              type: 'tour'
            }))
          }
        }
      }

      // Upload 3D model
      let model3dData = null
      if (media.model_3d && media.model_3d instanceof File) {
        const modelUpload = await uploadFileToStorage(media.model_3d, 'iskaHomes', 'unit-models')
        if (modelUpload.success) {
          model3dData = {
            url: modelUpload.data.url,
            format: media.model_3d.name.split('.').pop().toLowerCase(),
            preview_image: modelUpload.data.url // You might want to generate a preview
          }
        }
      }

      // Use developer_id from profile (already set in AuthContext for team members)
      const developerId = user?.profile?.developer_id
      
      if (!developerId) {
        toast.error('Developer ID not found. Please contact support.')
        return
      }
      
      const unitData = {
        developer_id: developerId,
        ...otherFormData,
        // Flatten location fields
        city: formData.location.city,
        neighborhood: formData.location.neighborhood,
        latitude: formData.location.gps_coordinates.latitude,
        longitude: formData.location.gps_coordinates.longitude,
        address: formData.location.address,
        // Flatten size fields
        bedrooms: formData.size.bedrooms,
        bathrooms: formData.size.bathrooms,
        living_space: formData.size.living_space,
        total_area: formData.size.total_area,
        ceiling_height: formData.size.ceiling_height,
        capacity: formData.size.capacity,
        // Flatten features
        kitchen_type: formData.features.kitchen_type,
        balcony: formData.features.balcony,
        garden: formData.features.garden,
        security: formData.features.security,
        gated_community: formData.features.gated_community,
        internet: formData.features.internet,
        parking: formData.features.parking,
        conference_rooms: formData.features.conference_rooms,
        washrooms: formData.features.washrooms,
        loading_docks: formData.features.loading_docks,
        forklift_access: formData.features.forklift_access,
        power_backup: formData.features.power_backup,
        water_supply: formData.features.water_supply,
        stage: formData.features.stage,
        lighting: formData.features.lighting,
        sound_system: formData.features.sound_system,
        chairs_tables: formData.features.chairs_tables,
        catering_services: formData.features.catering_services,
        road_access: formData.features.road_access,
        proximity_to_utilities: formData.features.proximity_to_utilities,
        // Flatten utilities
        water_supply: formData.utilities.water_supply,
        electricity: formData.utilities.electricity,
        internet: formData.utilities.internet,
        drainage: formData.utilities.drainage,
        // Flatten lease terms
        rent_price: formData.lease_terms.rent_price,
        deposit: formData.lease_terms.deposit,
        duration: formData.lease_terms.duration,
        flexible_terms: formData.lease_terms.flexible_terms,
        cancellation_policy: formData.lease_terms.cancellation_policy,
        security_requirements: formData.lease_terms.security_requirements,
        // Flatten documentation
        title_deed: formData.documentation?.title_deed,
        land_certificate: formData.documentation?.land_certificate,
        lease_status: formData.documentation?.lease_status,
        // Flatten other fields
        topography: formData.topography,
        virtual_tour_url: media.virtual_tour_url,
        owner_name: formData.owner_info.name,
        owner_phone: formData.owner_info.phone,
        owner_email: formData.owner_info.email,
        owner_type: formData.owner_info.type,
        availability_status: formData.availability.status,
        available_from: formData.availability.available_from,
        booking_rules: formData.availability.booking_rules,
        // Store uploaded file data
        images: imagesData,
        videos: videosData,
        model_3d: model3dData
      }

      let response
      if (mode === 'add') {
        response = await fetch('/api/units', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(unitData)
        })
      } else {
        response = await fetch(`/api/units/${unitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(unitData)
        })
      }

      if (response.ok) {
        toast.success(mode === 'add' ? 'Unit created successfully!' : 'Unit updated successfully!')
        // Redirect to units list
        setTimeout(() => {
          window.location.href = `/developer/${user.profile?.organization_slug || user.profile?.slug || user.profile?.organization_id || user.profile?.developer_id}/units`
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(error.error || error.message || 'Failed to save unit')
      }
    } catch (error) {
      console.error('Error saving unit:', error)
      toast.error('Error saving unit')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 w-full flex-1">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full flex-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {mode === 'add' ? 'Add New Unit' : 'Edit Unit'}
      </h2>
      <p className="text-gray-500 mb-6">{mode === 'add' ? 'Fill in the details to add a new unit.' : 'Edit the details of this unit.'}</p>

      {/* Development Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Development *
        </label>
        <select
          value={formData.development_id}
          onChange={(e) => updateFormData({ development_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Choose a development...</option>
          {developments.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.title}
            </option>
          ))}
        </select>
        {developments.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No developments found. Please create a development first.
          </p>
        )}
      </div>

      {/* Header Navigation */}
      <div className='flex gap-4 w-full mb-6'>
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(idx)}
            className={`px-4 py-2 rounded-md transition-colors ${
              idx === currentTab 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {idx + 1}. {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className='w-full'>
        {currentTab === 0 && (
          <UnitDescription 
            formData={formData}
            updateFormData={updateFormData}
            mode={mode}
            developments={developments}
          />
        )}
        {currentTab === 1 && (
          <UnitMedia 
            formData={formData}
            updateFormData={updateFormData}
            mode={mode}
          />
        )}
        {currentTab === 2 && (
          <UnitAmenities 
            formData={formData}
            updateFormData={updateFormData}
            mode={mode}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-colors"
          onClick={() => setCurrentTab((prev) => Math.max(prev - 1, 0))}
          disabled={currentTab === 0}
        >
          Previous
        </button>
        {currentTab < TABS.length - 1 ? (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={() => setCurrentTab((prev) => Math.min(prev + 1, TABS.length - 1))}
          >
            Next
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : (mode === 'add' ? 'Add Unit' : 'Save Changes')}
          </button>
        )}
      </div>
    </div>
  )
}

export default UnitComponent
