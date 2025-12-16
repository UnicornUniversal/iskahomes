"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDevelopments } from '@/hooks/useCachedData'
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Save } from 'lucide-react'
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal'

// Step components (we'll create these)
import BasicInfoStep from './steps/BasicInfoStep'
import CategoriesStep from './steps/CategoriesStep'
import SpecificationsStep from './steps/SpecificationsStep'
import LocationStep from './steps/LocationStep'
import PricingStep from './steps/PricingStep'
import AmenitiesStep from './steps/AmenitiesStep'
import SocialAmenitiesStep from './steps/SocialAmenitiesStep'
import MediaStep from './steps/MediaStep'
import ImmersiveExperienceStep from './steps/ImmersiveExperienceStep'
import AdditionalInfoStep from './steps/AdditionalInfoStep'
import PreviewStep from './steps/PreviewStep'

const STEPS = [
  { id: 'basic-info', label: 'Basic Info', component: BasicInfoStep },
  { id: 'categories', label: 'Categories', component: CategoriesStep },
  { id: 'specifications', label: 'Specifications', component: SpecificationsStep },
  { id: 'location', label: 'Location', component: LocationStep },
  { id: 'pricing', label: 'Pricing', component: PricingStep },
  { id: 'amenities', label: 'Amenities', component: AmenitiesStep },
  { id: 'social-amenities', label: 'Social Amenities', component: SocialAmenitiesStep },
  { id: 'media', label: 'Media', component: MediaStep },
  { id: 'immersive-experience', label: 'Immersive Experience', component: ImmersiveExperienceStep },
  { id: 'additional-info', label: 'Additional Info', component: AdditionalInfoStep },
  { id: 'preview', label: 'Preview and Finalize', component: PreviewStep }
]

const PropertyManagementWizard = ({ slug, propertyId, accountType }) => {
  const { user } = useAuth()
  
  // Use cached developments hook
  const { 
    data: developments = [], 
    loading: developmentsLoading, 
    error: developmentsError 
  } = useDevelopments(user?.profile?.developer_id)

  const [currentStep, setCurrentStep] = useState(0)
  // Initialize formData with default empty arrays to prevent undefined errors
  const [formData, setFormData] = useState({
    purposes: [],
    types: [],
    categories: [],
    listing_types: { database: [], inbuilt: [], custom: [] }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFinalizingModal, setShowFinalizingModal] = useState(false)
  const [draftListingId, setDraftListingId] = useState(propertyId) // Track draft ID for new listings
  const [listingStatus, setListingStatus] = useState('active') // Track listing status
  const [startedInAddMode, setStartedInAddMode] = useState(slug === 'addNewUnit' || slug === 'addNewProperty') // Track if we started in add mode

  // Determine if it's add mode - check slug prop directly to prevent mode switching issues
  // Also check if we started in add mode to prevent fetching existing data when URL changes
  const isAddMode = (slug === 'addNewUnit' || slug === 'addNewProperty') || startedInAddMode
  const isEditMode = !isAddMode
  
  // Use draftListingId if available, otherwise use propertyId
  const effectiveListingId = draftListingId || propertyId

  // Reset hasFetched when slug changes from add to edit mode to prevent stale data
  useEffect(() => {
    if (isAddMode) {
      setHasFetched(false)
    }
  }, [slug, isAddMode])

  // Fetch existing listing data if in edit mode
  // IMPORTANT: Only fetch if we're NOT in add mode and we didn't start in add mode
  // This prevents fetching when URL changes but we're still adding a new unit
  useEffect(() => {
    // Only fetch if:
    // 1. We're NOT in add mode (slug is NOT addNewUnit/addNewProperty AND we didn't start in add mode)
    // 2. We have an effectiveListingId
    // 3. User is available
    // 4. We haven't fetched yet
    // 5. We didn't start in add mode (prevents fetching when URL changes during add flow)
    if (!isAddMode && !startedInAddMode && effectiveListingId && user && !hasFetched) {
      fetchListingData()
    }
  }, [isAddMode, startedInAddMode, effectiveListingId, user, hasFetched])

  const fetchListingData = async () => {
    setLoading(true)
    setHasFetched(true)
    
    try {
      const token = localStorage.getItem(`${accountType}_token`)
      const response = await fetch(`/api/listings/${effectiveListingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        
        // Transform data to formData structure
        setFormData({
          title: data.title || '',
          description: data.description || '',
          size: data.size || '',
          status: data.status || '',
          listing_type: data.listing_type || (accountType === 'developer' ? 'unit' : 'property'),
          development_id: data.development_id || (accountType === 'developer' ? '' : null),
          purposes: data.purposes || [],
          types: data.types || [],
          categories: data.categories || [],
          listing_types: data.listing_types || { database: [], inbuilt: [], custom: [] },
          specifications: data.specifications || {},
          location: {
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            town: data.town || '',
            fullAddress: data.full_address || '',
            coordinates: {
              latitude: data.latitude ? data.latitude.toString() : '',
              longitude: data.longitude ? data.longitude.toString() : ''
            },
            additionalInformation: data.location_additional_information || ''
          },
          amenities: {
            inbuilt: data.amenities?.inbuilt || [],
            custom: data.amenities?.custom || []
          },
          pricing: {
            price: (data.pricing?.price ?? data.price) || '',
            currency: (data.pricing?.currency ?? data.currency) || 'GHS',
            duration: (data.pricing?.duration ?? data.duration) || 'monthly',
            price_type: (data.pricing?.price_type ?? data.price_type) || 'rent',
            cancellation_policy: data.cancellation_policy || '',
            is_negotiable: data.is_negotiable || false,
            security_requirements: (data.pricing?.security_requirements ?? data.security_requirements) || '',
            flexible_terms: data.flexible_terms || false,
            time: data.pricing?.time || '',
            ideal_duration: data.pricing?.ideal_duration || '',
            time_span: data.pricing?.time_span || 'months',
            estimated_revenue: data.pricing?.estimated_revenue || ''
          },
          media: {
            video: data.media?.video || null,
            youtubeUrl: data.media?.youtubeUrl || '',
            virtualTourUrl: data.media?.virtualTourUrl || '',
            albums: data.media?.albums || []
          },
          model_3d: data['3d_model'] || null,
          additional_files: data.additional_files || [],
          availability: {
            available_from: data.available_from || '',
            available_until: data.available_until || '',
            acquisition_rules: data.acquisition_rules || ''
          },
          additional_information: data.additional_information || '',
          floor_plan: data.floor_plan || null,
          virtual_tour_link: data.virtual_tour_link || '',
          property_status: data.listing_status || 'active',
          listing_status: data.listing_status || 'active',
          published_at: data.published_at || null,
          published_status: data.published_status || null,
          social_amenities: data.social_amenities || {
            schools: [],
            hospitals: [],
            airports: [],
            parks: [],
            shops: [],
            police: []
          }
        })
        // Update listing status state
        setListingStatus(data.listing_status || 'active')
      } else {
        toast.error('Failed to fetch listing data')
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
      toast.error('Error fetching listing data')
    } finally {
      setLoading(false)
    }
  }

  // Update form data
  const updateFormData = useCallback((sectionData) => {
    setFormData(prev => ({
      ...prev,
      ...sectionData
    }))
  }, [])

  // Save current step
  const saveCurrentStep = async () => {
    if (!user) {
      toast.error('Please log in to save')
      return
    }

    const currentStepData = STEPS[currentStep]
    if (!currentStepData) return

    setSaving(true)

    try {
      const token = localStorage.getItem(`${accountType}_token`)
      
      // Prepare step-specific data
      let stepData = {}
      const formDataForUpload = new FormData()

      switch (currentStepData.id) {
        case 'basic-info':
          stepData = {
            title: formData.title,
            description: formData.description,
            size: formData.size,
            status: formData.status,
            listing_type: formData.listing_type,
            development_id: formData.development_id
          }
          break

        case 'categories':
          stepData = {
            purposes: formData.purposes || [],
            types: formData.types || [],
            categories: formData.categories || [],
            listing_types: formData.listing_types || { database: [], inbuilt: [], custom: [] }
          }
          break

        case 'specifications':
          stepData = {
            specifications: formData.specifications || {}
          }
          break

        case 'location':
          stepData = {
            country: formData.location?.country || '',
            state: formData.location?.state || '',
            city: formData.location?.city || '',
            town: formData.location?.town || '',
            full_address: formData.location?.fullAddress || '',
            latitude: formData.location?.coordinates?.latitude || '',
            longitude: formData.location?.coordinates?.longitude || '',
            location_additional_information: formData.location?.additionalInformation || ''
          }
          break

        case 'pricing':
          stepData = {
            pricing: formData.pricing || {},
            // Include sales_info if status is sold/rented/taken
            sales_info: formData.sales_info || null
          }
          break

        case 'amenities':
          stepData = {
            amenities: formData.amenities || { inbuilt: [], custom: [] }
          }
          break

        case 'social-amenities':
          stepData = {
            social_amenities: formData.social_amenities || {
              schools: [],
              hospitals: [],
              airports: [],
              parks: [],
              shops: [],
              police: []
            }
          }
          break

        case 'media':
          // Determine if video is a new upload (has file property) or already uploaded
          let videoData = null
          if (formData.media?.video) {
            // If it's a File object, it's a new upload - don't include in stepData
            if (formData.media.video instanceof File) {
              videoData = null // Will be uploaded as file
            } 
            // If it has a file property, it's a new upload - don't include in stepData
            else if (formData.media.video.file instanceof File) {
              videoData = null // Will be uploaded as file
            }
            // If it has a url that's NOT a blob URL, it's already uploaded - include it
            else if (formData.media.video.url && !formData.media.video.url.startsWith('blob:')) {
              videoData = {
                url: formData.media.video.url,
                name: formData.media.video.name,
                size: formData.media.video.size,
                type: formData.media.video.type,
                path: formData.media.video.path,
                filename: formData.media.video.filename
              }
            }
            // If it's a string (legacy format), include it
            else if (typeof formData.media.video === 'string') {
              videoData = formData.media.video
            }
          }

          stepData = {
            media: {
              video: videoData,
              youtubeUrl: formData.media?.youtubeUrl || '',
              virtualTourUrl: formData.media?.virtualTourUrl || '',
              albums: formData.media?.albums ? formData.media.albums.map(album => ({
                id: album.id,
                name: album.name,
                isDefault: album.isDefault,
                created_at: album.created_at,
                images: album.images ? album.images.map(image => {
                  if (image?.file && image.file instanceof File) {
                    return null // Will be sent as file
                  }
                  return {
                    id: image.id,
                    url: image.url,
                    name: image.name,
                    path: image.path,
                    size: image.size,
                    type: image.type,
                    filename: image.filename,
                    originalName: image.originalName,
                    created_at: image.created_at
                  }
                }).filter(img => img !== null) : []
              })) : []
            }
          }
          
          // Add video file if it exists (for new uploads)
          if (formData.media?.video) {
            if (formData.media.video instanceof File) {
              formDataForUpload.append('video', formData.media.video)
            } else if (formData.media.video.file instanceof File) {
              formDataForUpload.append('video', formData.media.video.file)
            }
          }
          
          // Add album images
          if (formData.media?.albums) {
            formData.media.albums.forEach((album, albumIndex) => {
              if (album?.images) {
                let imageIndex = 0
                album.images.forEach((image) => {
                  if (image?.file && image.file instanceof File) {
                    formDataForUpload.append(`album_${albumIndex}_image_${imageIndex}`, image.file)
                    imageIndex++
                  }
                })
              }
            })
          }
          break

        case 'immersive-experience':
          stepData = {
            model_3d: formData.model_3d && !(formData.model_3d instanceof File) ? formData.model_3d : null,
            virtual_tour_link: formData.virtual_tour_link || ''
          }
          
          if (formData.model_3d && formData.model_3d.file instanceof File) {
            formDataForUpload.append('model3d', formData.model_3d.file)
          }
          break

        case 'additional-info':
          stepData = {
            additional_information: formData.additional_information || '',
            floor_plan: formData.floor_plan && !(formData.floor_plan instanceof File) ? formData.floor_plan : null,
            available_from: formData.availability?.available_from || '',
            available_until: formData.availability?.available_until || '',
            acquisition_rules: formData.availability?.acquisition_rules || ''
          }
          
          if (formData.floor_plan && formData.floor_plan.file instanceof File) {
            formDataForUpload.append('floorPlan', formData.floor_plan.file)
          }
          
          if (formData.additional_files) {
            formData.additional_files.forEach((file, index) => {
              if (file instanceof File) {
                formDataForUpload.append(`additionalFile_${index}`, file)
              }
            })
          }
          break
      }

      formDataForUpload.append('data', JSON.stringify(stepData))

      // For add mode, use step endpoint which will create draft if needed
      // For edit mode, use step endpoint with propertyId
      const listingIdToUse = effectiveListingId || 'new'
      const url = `/api/listings/${listingIdToUse}/step/${currentStepData.id}`

      const method = 'PUT' // Step endpoint handles both new and existing

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataForUpload
      })

      if (response.ok) {
        const result = await response.json()
        
        // If it's add mode and we got a listing ID, save it for future saves
        if (isAddMode && result.data?.id && !draftListingId) {
          setDraftListingId(result.data.id)
          // Update the URL to edit mode without reloading
          const newUrl = accountType === 'developer'
            ? `/developer/${user.profile?.slug || user.profile.id}/units/${result.data.id}`
            : `/agent/${user.profile?.slug || user.profile.id}/properties/${result.data.id}`
          
          // Update URL without reload
          window.history.pushState({}, '', newUrl)
        }

        // Update listing status if returned
        if (result.data?.listing_status) {
          setListingStatus(result.data.listing_status)
          setFormData(prev => ({
            ...prev,
            listing_status: result.data.listing_status,
            property_status: result.data.listing_status
          }))
        }

        // Mark step as completed
        setCompletedSteps(prev => new Set([...prev, currentStepData.id]))
        toast.success(`${currentStepData.label} saved successfully!`)
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to save ${currentStepData.label}`)
        throw new Error(error.error || `Failed to save ${currentStepData.label}`)
      }
    } catch (error) {
      console.error('Error saving step:', error)
      toast.error(error.message || 'Error saving step')
    } finally {
      setSaving(false)
    }
  }

  // Navigation
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      // In edit mode, allow free navigation. In add mode, require completion for forward navigation
      if (!isEditMode && stepIndex > currentStep && !completedSteps.has(STEPS[currentStep].id)) {
        toast.warning(`Please save "${STEPS[currentStep].label}" before moving to the next step.`)
        return
      }
      setCurrentStep(stepIndex)
    }
  }

  const nextStep = () => {
    // In edit mode, allow free navigation. In add mode, require saving current step before moving forward
    if (!isEditMode && !completedSteps.has(STEPS[currentStep].id)) {
      toast.warning(`Please save "${STEPS[currentStep].label}" before moving to the next step.`)
      return
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Finalize listing
  const handleFinalize = async () => {
    if (!user) {
      toast.error('Please log in to finalize')
      return
    }

    setSaving(true)
    setShowFinalizingModal(true) // Show finalizing modal

    try {
      const token = localStorage.getItem(`${accountType}_token`)
      
      // Update listing status to active and mark as published
      const response = await fetch(`/api/listings/${effectiveListingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_status: 'active',
          published_at: new Date().toISOString(),
          published_status: 'published',
          listing_condition: 'completed',
          upload_status: 'completed'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local state to reflect published status
        setListingStatus('active')
        setFormData(prev => ({
          ...prev,
          listing_status: 'active',
          property_status: 'active',
          published_at: new Date().toISOString(),
          published_status: 'published'
        }))
        
        // Hide modal first, then show toast
        setShowFinalizingModal(false)
        
        // Small delay to ensure modal is hidden before showing toast
        setTimeout(() => {
          toast.success('Listing finalized and published successfully!')
          
          // Redirect to the listing page or dashboard
          setTimeout(() => {
            if (accountType === 'developer') {
              window.location.href = `/developer/${user.profile?.slug || user.profile.id}/units/${effectiveListingId}`
            } else {
              window.location.href = `/agent/${user.profile?.slug || user.profile.id}/properties/${effectiveListingId}`
            }
          }, 2000)
        }, 300)
      } else {
        const error = await response.json()
        setShowFinalizingModal(false)
        toast.error(error.error || 'Failed to finalize listing')
      }
    } catch (error) {
      console.error('Error finalizing listing:', error)
      setShowFinalizingModal(false)
      toast.error('Error finalizing listing')
    } finally {
      setSaving(false)
    }
  }

  // Delete handler
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user) {
      toast.error('Please log in to delete listings')
      return
    }

    setIsDeleting(true)

    try {
      const token = localStorage.getItem(`${accountType}_token`)
      const response = await fetch(`/api/listings/${effectiveListingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Listing deleted successfully!')
        setShowDeleteModal(false)
        
        setTimeout(() => {
          if (accountType === 'developer') {
            window.location.href = `/developer/${user.profile?.slug || user.profile.id}/units`
          } else {
            window.location.href = `/agent/${user.profile?.slug || user.profile.id}/listings`
          }
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete listing')
      }
    } catch (error) {
      toast.error('Error deleting listing')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing data...</p>
        </div>
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component
  const currentStepData = STEPS[currentStep]

  return (
    <div className="w-full mx-autosm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between flex-wrap items-center border-b border-white/50 pb-2">
        <div>
          <div className="flex items-center gap-3 flex-wrap  pb-2">
            <h1 className="">
              {isAddMode 
                ? (accountType === 'developer' ? 'Add New Unit' : 'Add New Property')
                : 'Edit Property'}
            </h1>
            {/* Draft Status Badge - Show if not published (no published_at or published_status !== 'published') */}
            {(!formData.published_at && !formData.published_status) || 
             (formData.published_status && formData.published_status !== 'published') ? (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300">
                Draft
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Step {currentStep + 1} of {STEPS.length}: {currentStepData.label}
          </p>
        </div>
        {!isAddMode && (
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete {accountType === 'developer' ? 'Unit' : 'Property'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Step Navigation */}
        <div className="lg:w-64 flex-shrink-0 lg:border-r border-white/50 lg:pr-4">
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden secondary_bg p-4 mb-4 overflow-x-auto">
            <nav className="flex gap-2 min-w-max">
              {STEPS.map((step, index) => {
                const isCompleted = completedSteps.has(step.id)
                const isCurrent = index === currentStep
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`flex-shrink-0 text-left px-3 py-2 transition-colors flex items-center gap-2 border ${
                      isCurrent
                        ? 'secondary_button !text-[0.9em]'
                        : isCompleted
                        ? 'text-primary_color/80 border-transparent hover:bg-primary_color/5'
                        : 'text-primary_color/60 border-transparent hover:bg-primary_color/5'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-primary_color flex-shrink-0" />
                    ) : (
                      <Circle className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-primary_color' : 'text-primary_color/40'}`} />
                    )}
                    <span className="text-primary_color whitespace-nowrap text-sm">{step.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* Desktop: Vertical Sticky */}
          <div className="hidden lg:block sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold text-primary_color mb-4">Steps</h3>
            <nav className="space-y-2">
              {STEPS.map((step, index) => {
                const isCompleted = completedSteps.has(step.id)
                const isCurrent = index === currentStep
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`w-full text-left !p-[1em] rounded-md transition-colors flex items-center gap-2 border ${
                      isCurrent
                        ? 'secondary_button !text-[1em]'
                        : isCompleted
                        ? 'text-primary_color/80 border-transparent hover:bg-primary_color/5'
                        : 'text-primary_color/60 border-transparent hover:bg-primary_color/5'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary_color flex-shrink-0" />
                    ) : (
                      <Circle className={`w-5 h-5 flex-shrink-0 ${isCurrent ? 'text-primary_color' : 'text-primary_color/40'}`} />
                    )}
                    <span className="text-primary_color">{step.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

{/* line - Desktop only */}
        <div className="hidden lg:block w-[0.1em] h-[100vh] bg-primary_color"> </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="secondary_bg rounded-lg shadow-sm border border-gray-200 !p-[1.5em]">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'}
              accountType={accountType}
              developments={developments}
              developmentsLoading={developmentsLoading}
              user={user}
              onFinalize={currentStepData.id === 'preview' ? handleFinalize : undefined}
            />

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentStepData.id !== 'preview' ? (
                <div className="flex gap-3">
                  <button
                    onClick={saveCurrentStep}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Step'}
                  </button>

                  {currentStep < STEPS.length - 1 && (
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Review your listing above and click "Finalize and Publish" when ready
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${accountType === 'developer' ? 'Unit' : 'Property'}`}
        message={`Are you sure you want to delete "${formData.title || 'this ' + (accountType === 'developer' ? 'unit' : 'property')}"? This action cannot be undone.`}
        itemName={formData.title || `this ${accountType === 'developer' ? 'unit' : 'property'}`}
        itemType={accountType === 'developer' ? 'unit' : 'property'}
        isLoading={isDeleting}
      />

      {/* Finalizing Modal */}
      {showFinalizingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary_color mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Finalizing...</h3>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we finalize and publish your listing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default PropertyManagementWizard

