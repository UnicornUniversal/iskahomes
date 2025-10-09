"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import PropertyDescription from './modules/PropertyDescription'
import PropertyCategories from './modules/PropertyCategories'
import PropertySpecifications from './modules/PropertySpecifications'
import PropertyLocation from './modules/PropertyLocation'
import PropertyAmenities from './modules/PropertyAmenities'
import PropertyPricing from './modules/PropertyPricing'
import PropertyAvailability from './modules/PropertyAvailability'
import PropertyAdditionalInfo from './modules/PropertyAdditionalInfo'
import PropertyMedia from './modules/PropertyMedia'
import PropertyFiles from './modules/PropertyFiles'
import Model3DViewer, { Model3DModal } from './modules/Model3DViewer'
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal'

const PropertyManagement = ({ slug, propertyId, accountType }) => {
  const { user } = useAuth()
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [developments, setDevelopments] = useState([]);
  const [purposeData, setPurposeData] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Validate required props
  if (!accountType) {
    throw new Error('PropertyManagement: accountType prop is required');
  }
  
  if (!['developer', 'agent'].includes(accountType)) {
    throw new Error('PropertyManagement: accountType must be either "developer" or "agent"');
  }
  
  // Determine if it's add mode based on slug
  const isAddMode = slug === 'addNewUnit' || slug === 'addNewProperty';
  
  // Determine if it's view mode (read-only)
  const isViewMode = slug === 'viewUnit' || slug === 'viewProperty';
  
  // Determine if it's edit mode (not add and not view)
  const isEditMode = !isAddMode && !isViewMode;
  
  
  // Unified form state for all sections
  const [formData, setFormData] = useState({
    // Basic listing information
    title: '',
    description: '',
    size: '',
    status: '',
    listing_type: accountType === 'developer' ? 'unit' : 'property',
    
    // Development association (only for developers)
    development_id: accountType === 'developer' ? '' : null,
    
    // Categories section
    purposes: [],
    types: [],
    categories: [],
    listing_types: {
      database: [],
      inbuilt: [],
      custom: []
    },
    
    // Specifications section
    specifications: {},
    
    // Location section - using location object
    location: {
      country: '',
      state: '',
      city: '',
      town: '',
      fullAddress: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      additionalInformation: ''
    },
    
    // Amenities section
    amenities: {
      database: [],
      general: [],
      custom: []
    },
    
    // Pricing section
    pricing: {
      price: '',
      currency: 'GHS',
      duration: 'monthly',
      price_type: 'rent',
      cancellation_policy: '',
      is_negotiable: false,
      security_requirements: '',
      flexible_terms: false
    },
    
    // Media section - using media object
    media: {
      video: null,
      youtubeUrl: '',
      virtualTourUrl: '',
      mediaFiles: []
    },
    
    // 3D Model (for developers)
    model_3d: null,
    
    // Additional files section
    additional_files: [],
    
    // Availability section
    availability: {
      available_from: '',
      available_until: '',
      acquisition_rules: ''
    },
    
    // Additional information
    additional_information: '',
    
    // Property status
    property_status: 'active'
  });

  // Reset fetch flag when propertyId changes
  useEffect(() => {
    setHasFetched(false);
  }, [propertyId]);

  // Fetch developments only for developers
  useEffect(() => {
    const fetchDevelopments = async () => {
      if (accountType !== 'developer' || !user?.profile?.developer_id) return

      try {
        const token = localStorage.getItem('developer_token')
        const response = await fetch(`/api/developments?developer_id=${user.profile.developer_id}`, {
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
        toast.error('Error fetching developments')
      }
    }

    fetchDevelopments()
  }, [accountType, user?.profile?.developer_id])

  // Fetch property data if in edit mode
  useEffect(() => {
    if (!isAddMode && propertyId && user && !hasFetched) {
      fetchPropertyData();
    } else if (isAddMode) {
      // If in add mode, set loading to false immediately
      setLoading(false);
    }
  }, [isAddMode, propertyId, user, hasFetched]);

  const fetchPropertyData = async () => {
    if (!user || hasFetched) return;
    
    setLoading(true);
    setHasFetched(true);
    try {
      const token = localStorage.getItem(`${accountType}_token`);
      const response = await fetch(`/api/listings/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });

        if (response.ok) {
        const { data } = await response.json();
        setPropertyData(data);
        
        console.log('🔍 Fetched property data:', data);
        console.log('🔍 Specifications data:', data.specifications);
        console.log('🔍 Types data:', data.types);
        console.log('🔍 Listing types data:', data.listing_types);
        console.log('🔍 Location data:', {
          country: data.country,
          state: data.state,
          city: data.city,
          town: data.town,
          latitude: data.latitude,
          longitude: data.longitude
        });
        
        // Populate form with existing data
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
          // Map specifications directly from the flat structure
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
          // Map amenities directly from the flat structure
          amenities: data.amenities || { database: [], general: [], custom: [] },
          pricing: {
            price: data.price || '',
            currency: data.currency || 'GHS',
            duration: data.duration || 'monthly',
            price_type: data.price_type || 'rent',
            cancellation_policy: data.cancellation_policy || '',
            is_negotiable: data.is_negotiable || false,
            security_requirements: data.security_requirements || '',
            flexible_terms: data.flexible_terms || false
          },
          media: {
            video: data.media?.video || null,
            youtubeUrl: data.media?.youtubeUrl || '',
            virtualTourUrl: data.media?.virtualTourUrl || '',
            mediaFiles: data.media?.mediaFiles || []
          },
          // Map 3D model from the flat structure (note: field name is "3d_model" in DB)
          model_3d: data["3d_model"] || null,
          additional_files: data.additional_files || [],
          availability: {
            available_from: data.available_from || '',
            available_until: data.available_until || '',
            acquisition_rules: data.acquisition_rules || ''
          },
          additional_information: data.additional_information || '',
          property_status: data.listing_status || 'active'
        });
        } else if (response.status === 404) {
        // Listing not found - redirect to add new unit
        toast.error('This listing was not found. Redirecting to add a new one...');
        setTimeout(() => {
          if (accountType === 'developer') {
            window.location.href = `/developer/${user.profile?.slug || user.profile.id}/units/addNewUnit`;
          } else {
            window.location.href = `/agent/${user.profile?.slug || user.profile.id}/properties/addNewProperty`;
          }
        }, 2000);
        } else {
        toast.error('Failed to fetch property data');
        }
      } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Error fetching property data');
      } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to delete listings');
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem(`${accountType}_token`);
      const response = await fetch(`/api/listings/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || `${accountType === 'developer' ? 'Unit' : 'Property'} deleted successfully!`);
        setShowDeleteModal(false);
        
        // Redirect to developments list
        setTimeout(() => {
          if (accountType === 'developer') {
            window.location.href = `/developer/${user.profile?.slug || user.profile.id}/developments`;
          } else {
            window.location.href = `/agent/${user.profile?.slug || user.profile.id}/listings`;
          }
        }, 2000);
      } else {
        let errorMessage = 'Failed to delete listing';
        try {
        const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
          if (error.details) {
            errorMessage += `: ${error.details}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Error deleting listing');
    } finally {
      setIsDeleting(false);
    }
  }, [user, accountType, propertyId]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Generate slug from title
  const generateSlug = useCallback((title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }, []);

  // Update form data from child components
  const updateFormData = useCallback((sectionData) => {
    setFormData(prev => {
      const updated = {
      ...prev,
      ...sectionData
      };
      
      // Auto-generate slug when title changes
      if (sectionData.title && sectionData.title !== prev.title) {
        updated.slug = generateSlug(sectionData.title);
      }
      
      // Ensure listing_types structure is always properly initialized
      if (updated.listing_types && typeof updated.listing_types === 'object') {
        updated.listing_types = {
          database: Array.isArray(updated.listing_types.database) ? updated.listing_types.database : [],
          inbuilt: Array.isArray(updated.listing_types.inbuilt) ? updated.listing_types.inbuilt : [],
          custom: Array.isArray(updated.listing_types.custom) ? updated.listing_types.custom : []
        };
      } else if (!updated.listing_types) {
        updated.listing_types = {
          database: [],
          inbuilt: [],
          custom: []
        };
      }
      
      return updated;
    });
  }, [generateSlug]);

  // Fetch purpose data when purpose changes
  useEffect(() => {
    if (formData.purposes && formData.purposes.length > 0) {
      fetchPurposeData(formData.purposes[0]);
    } else {
      setPurposeData(null);
    }
  }, [formData.purposes]);

  const fetchPurposeData = async (purposeId) => {
    try {
      const response = await fetch('/api/admin/property-purposes');
      if (response.ok) {
        const result = await response.json();
        const purpose = result.data?.find(p => p.id === purposeId);
        setPurposeData(purpose);
      }
    } catch (error) {
      console.error('Error fetching purpose data:', error);
      setPurposeData(null);
    }
  };

  const removeModel = useCallback(() => {
    updateFormData({
      model_3d: null
    });
  }, [updateFormData]);

  const handleModelUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      updateFormData({
        model_3d: {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }
      });
    }
  }, [updateFormData]);

  const handleModelReplace = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,.gltf';
    input.onchange = handleModelUpload;
    input.click();
  }, [handleModelUpload]);

  // Scroll to section function
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Memoize navigation sections
  const navigationSections = useMemo(() => [
    { id: 'description', label: 'Description' },
    { id: 'categories', label: 'Categories' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'availability', label: 'Availability' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'location', label: 'Location' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'media', label: 'Media' },
    { id: 'additional-info', label: 'Additional Info' },
    ...(accountType === 'developer' ? [
      { id: '3d-model', label: '3D Model' },
      { id: 'files', label: 'Files' }
    ] : [])
  ], [accountType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    console.log('🚀 handleSubmit called');
      e.preventDefault();
    
    console.log('📋 Form data:', formData);
    console.log('👤 User:', user);
    console.log('🏢 Account type:', accountType);
    console.log('🆔 Property ID:', propertyId);
    console.log('➕ Is add mode:', isAddMode);
    
    if (!user) {
      console.log('❌ No user found');
      toast.error('Please log in to create/update listings');
      return;
    }

    if (!user.profile) {
      console.log('❌ No user profile found');
      toast.error('Profile not found. Please contact support.');
      return;
    }

    // Check for appropriate profile ID based on account type
    if (accountType === 'developer' && !user.profile.developer_id) {
      console.log('❌ No developer_id found in profile');
      toast.error('Developer profile not found. Please contact support.');
      return;
    }

    if (accountType === 'agent' && !user.profile.agent_id) {
      console.log('❌ No agent_id found in profile');
      toast.error('Agent profile not found. Please contact support.');
      return;
    }
    
    // Basic validation
    console.log('🔍 Validating required fields...');
    console.log('Title:', formData.title);
    console.log('Description:', formData.description);
    console.log('Status:', formData.status);
    
    if (!formData.title || !formData.description || !formData.status) {
      console.log('❌ Missing required fields');
      toast.error('Please fill in all required fields (Title, Description, Status)');
      return;
    }
    
    // Additional validation for developers
    if (accountType === 'developer' && !formData.development_id) {
      console.log('❌ No development selected for developer');
      toast.error('Please select a development');
      return;
    }
    
    console.log('✅ All validations passed');
    
    setLoading(true);
    setShowUploadOverlay(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    console.log('⏳ Setting loading to true');
    
    try {
      const token = localStorage.getItem(`${accountType}_token`);
      console.log('🔑 Token retrieved:', token ? 'Token exists' : 'No token found');
      
      // Prepare form data for submission
      const { location, media, pricing, availability, ...otherFormData } = formData;
      console.log('📦 Destructured form data:');
      console.log('  - Location:', location);
      console.log('  - Media:', media);
      console.log('  - Pricing:', pricing);
      console.log('  - Availability:', availability);
      console.log('  - Other form data:', otherFormData);
      
      const propertyData = {
        account_type: accountType,
        user_id: user.id,
        ...otherFormData,
        // Explicitly include development_id for developers
        development_id: accountType === 'developer' ? otherFormData.development_id : null,
        // Flatten location fields
        country: location?.country || '',
        state: location?.state || '',
        city: location?.city || '',
        town: location?.town || '',
        full_address: location?.fullAddress || '',
        latitude: location?.coordinates?.latitude || '',
        longitude: location?.coordinates?.longitude || '',
        additional_information: location?.additionalInformation || '',
        // Flatten pricing fields
        price: pricing?.price || '',
        currency: pricing?.currency || 'GHS',
        duration: pricing?.duration || 'monthly',
        price_type: pricing?.price_type || 'rent',
        cancellation_policy: pricing?.cancellation_policy || '',
        is_negotiable: pricing?.is_negotiable || false,
        security_requirements: pricing?.security_requirements || '',
        flexible_terms: pricing?.flexible_terms || false,
        // Media data (files will be handled by the API)
        media: media,
        // 3D Model (for developers) - Note: database field is "3d_model"
        "3d_model": accountType === 'developer' ? (otherFormData.model_3d || null) : null,
        // Additional files
        additional_files: otherFormData.additional_files || [],
        // Flatten availability fields
        available_from: availability?.available_from || '',
        available_until: availability?.available_until || '',
        acquisition_rules: availability?.acquisition_rules || '',
        // Additional information
        additional_information: otherFormData.additional_information || ''
      };

      console.log('📋 Final property data:', propertyData);

      // Create FormData for file uploads
      console.log('📤 Creating FormData for file uploads...');
      const formDataForUpload = new FormData();
      formDataForUpload.append('data', JSON.stringify(propertyData));
      console.log('📄 Added JSON data to FormData');
      
      // Add files if they exist
      if (media?.video && media.video instanceof File) {
        console.log('🎥 Adding video file:', media.video.name);
        formDataForUpload.append('video', media.video);
      } else {
        console.log('🎥 No video file to upload');
      }
      
      if (media?.mediaFiles && media.mediaFiles.length > 0) {
        console.log('📸 Adding media files:', media.mediaFiles.length);
        media.mediaFiles.forEach((file, index) => {
          if (file instanceof File) {
            console.log(`  - Media file ${index}:`, file.name);
            formDataForUpload.append(`mediaFile_${index}`, file);
          }
        });
      } else {
        console.log('📸 No media files to upload');
      }
      
      if (otherFormData.additional_files && otherFormData.additional_files.length > 0) {
        console.log('📎 Adding additional files:', otherFormData.additional_files.length);
        otherFormData.additional_files.forEach((file, index) => {
          if (file instanceof File) {
            console.log(`  - Additional file ${index}:`, file.name);
            formDataForUpload.append(`additionalFile_${index}`, file);
          }
        });
      } else {
        console.log('📎 No additional files to upload');
      }
      
      if (accountType === 'developer' && otherFormData.model_3d && otherFormData.model_3d.file instanceof File) {
        console.log('🏗️ Adding 3D model file:', otherFormData.model_3d.file.name);
        formDataForUpload.append('model3d', otherFormData.model_3d.file);
      } else {
        console.log('🏗️ No 3D model file to upload');
      }
      
      console.log('📤 FormData created successfully');
      
      // Simulate upload progress
      setUploadProgress(20);
      setUploadStatus('Preparing files for upload...');
      
      let response;
      if (isAddMode) {
        // Create new listing
        console.log('➕ Creating new listing...');
        console.log('🌐 Making POST request to /api/listings');
        response = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });
        console.log('📡 POST response received:', response.status, response.statusText);
        setUploadProgress(80);
        setUploadStatus('Processing and saving data...');
      } else {
        // Update existing listing
        console.log('✏️ Updating existing listing...');
        console.log('🌐 Making PUT request to /api/listings/' + propertyId);
        response = await fetch(`/api/listings/${propertyId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });
        console.log('📡 PUT response received:', response.status, response.statusText);
        setUploadProgress(80);
        setUploadStatus('Processing and saving changes...');
      }

      if (response.ok) {
        console.log('✅ Response is OK');
        setUploadProgress(100);
        setUploadStatus('Finalizing your listing...');
        
        const result = await response.json();
        console.log('📄 Response data:', result);
        
        // Show success for a moment before redirecting
        setTimeout(() => {
          setShowUploadOverlay(false);
        toast.success(
          isAddMode 
            ? 'Listing created successfully!' 
            : 'Listing updated successfully!'
        );
        
          // Redirect to developments list
          console.log('🔄 Redirecting to developments page...');
        setTimeout(() => {
          if (accountType === 'developer') {
              const redirectUrl = `/developer/${user.profile?.slug || user.profile.id}/developments`;
              console.log('🏢 Redirecting to developer developments:', redirectUrl);
              window.location.href = redirectUrl;
          } else {
              const redirectUrl = `/agent/${user.profile?.slug || user.profile.id}/listings`;
              console.log('👤 Redirecting to agent listings:', redirectUrl);
              window.location.href = redirectUrl;
          }
          }, 1500);
        }, 1000);
      } else {
        console.log('❌ Response is not OK');
        console.log('📄 Response status:', response.status);
        console.log('📄 Response statusText:', response.statusText);
        const error = await response.json();
        console.log('❌ Error response:', error);
        setShowUploadOverlay(false);
        toast.error(error.error || error.message || 'Failed to save listing');
      }
    } catch (error) {
      console.log('💥 Caught error in handleSubmit:', error);
      console.log('💥 Error message:', error.message);
      console.log('💥 Error stack:', error.stack);
      setShowUploadOverlay(false);
      toast.error('Error saving listing');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='w-full h-screen flex justify-center items-center py-8'>
        <div className='!text-sm bg-white p-4 rounded-md shadow-sm border border-primary_color text-primary_color'>
          {isAddMode ? 'Preparing form...' : 'Loading property data...'}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full  relative flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-4'>
        <h1 className='text-xl sm:text-2xl font-bold'>
          {isAddMode ? (
            slug === 'addNewUnit' ? 'Add New Unit' : 'Add New Property'
          ) : isViewMode ? (
            slug === 'viewUnit' ? 'View Unit' : 'View Property'
          ) : 'Edit Property'}
        </h1>
        {!isAddMode && !isViewMode && (
          <button
            onClick={handleDeleteClick}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto'
          >
            Delete { accountType === 'developer' ? 'Unit' : 'Property'}
          </button>
        )}
      </div>

      {/* Development Selection - Only for developers */}
      {accountType === 'developer' && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Development *
          </label>
          <select
            value={formData.development_id}
            onChange={(e) => updateFormData({ development_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              No developments found. Please create a development first.
            </p>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      {/* <div className=' top-5  max-w-6xl mx-auto md:top-[6em] rounded-md bg-white border-b border-gray-200 p-4 z-50 shadow-sm'>
        <div className='flex gap-2 sm:gap-4 w-full overflow-x-auto pb-2'>
          {navigationSections.map(section => (
          <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className='flex-shrink-0 px-3 py-2 sm:px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap !text-sm sm:text-base'
            >
              {section.label}
          </button>
        ))}
        </div>
      </div> */}

      {/* Form Sections */}
      <form onSubmit={handleSubmit} className='space-y-6 sm:space-y-8 relative'>
        {/* Description Section */}
        <div id='description' className='scroll-mt-20'>
          <PropertyDescription 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'} 
          />
        </div>

        {/* Categories Section */}
        <div id='categories' className='scroll-mt-20'>
          <PropertyCategories 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={isEditMode} 
          />
        </div>

        {/* Pricing Section */}
        <div id='pricing' className='scroll-mt-20'>
          <PropertyPricing 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'} 
          />
        </div>

        {/* Availability Section */}
        <div id='availability' className='scroll-mt-20'>
          <PropertyAvailability 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'} 
          />
        </div>

        {/* Specifications Section */}
        <div id='specifications' className='scroll-mt-20'>
          <PropertySpecifications 
            types={formData.types}
            specifications={formData.specifications}
            updateFormData={updateFormData}
            isEditMode={isEditMode}
            purposeData={purposeData}
          />
        </div>

        {/* Location Section */}
        <div id='location' className='scroll-mt-20'>
          <PropertyLocation 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={isEditMode} 
          />
        </div>

        {/* Amenities Section */}
        <div id='amenities' className='scroll-mt-20'>
          <PropertyAmenities 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'} 
          />
        </div>

        {/* Media Section */}
        <div id='media' className='scroll-mt-20'>
          <PropertyMedia 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'}
            accountType={accountType}
          />
      </div>

        {/* Additional Information Section */}
        <div id='additional-info' className='scroll-mt-20'>
          <PropertyAdditionalInfo 
            formData={formData}
            updateFormData={updateFormData}
            mode={isAddMode ? 'add' : isViewMode ? 'view' : 'edit'} 
          />
        </div>

        {/* 3D Model Section - Only for developers */}
        {accountType === 'developer' && (
          <div id='3d-model' className='scroll-mt-20'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>3D Model</h3>
              
              {formData.model_3d ? (
                <div className="space-y-4">
                  <Model3DViewer 
                    modelUrl={formData.model_3d.url}
                    modelFormat={(() => {
                      // Try different possible name properties
                      const fileName = formData.model_3d.originalName || 
                                     formData.model_3d.name || 
                                     formData.model_3d.filename || 
                                     '';
                      
                      if (fileName && fileName.includes('.')) {
                        return fileName.split('.').pop().toLowerCase();
                      }
                      
                      // Default to 'glb' if we can't determine the format
                      return 'glb';
                    })()}
                    width="100%"
                    height="400px"
                    showControls={true}
                    autoRotate={true}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-sm text-gray-600 flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {formData.model_3d.originalName || formData.model_3d.filename}
                </div>
                      <div className="text-xs text-gray-500">
                        {(formData.model_3d.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModelModal(true)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
                        title="View in fullscreen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                      {!isViewMode && (
                        <>
                          <button
                            type="button"
                            onClick={handleModelReplace}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
                            title="Replace model"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={removeModel}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors group"
                            title="Remove model"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : !isViewMode ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.glb,.gltf'
                    input.onchange = handleModelUpload
                    input.click()
                  }}
                >
                  <div className="space-y-2">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      Click to upload 3D model or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      GLB, GLTF files up to 100MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm">No 3D model uploaded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files Section - Only for developers */}
        {accountType === 'developer' && (
          <div id='files' className='scroll-mt-20 mb-20'>
            <PropertyFiles 
              formData={formData}
              updateFormData={updateFormData}
              isEditMode={isEditMode}
              accountType={accountType}
            />
          </div>
        )}

        {/* Sticky Submit Button - Now inside the form */}
        {!isViewMode && (
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 z-50 shadow-lg'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center'>
          <button
                type='submit'
            disabled={loading}
            className='w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
          >
                {loading ? 'Processing...' : (isAddMode ? (accountType === 'developer' ? 'Create Unit' : 'Create Property') : (accountType === 'developer' ? 'Update Unit' : 'Update Property'))}
          </button>
        </div>
      </div>
        )}
      </form>

      {/* 3D Model Modal */}
      {showModelModal && formData.model_3d && (
        <Model3DModal
          isOpen={showModelModal}
          onClose={() => setShowModelModal(false)}
          modelUrl={formData.model_3d.url}
          modelFormat={(() => {
            // Try different possible name properties
            const fileName = formData.model_3d.name || 
                           formData.model_3d.originalName || 
                           formData.model_3d.filename || 
                           '';
            
            if (fileName && fileName.includes('.')) {
              return fileName.split('.').pop().toLowerCase();
            }
            
            // Default to 'glb' if we can't determine the format
            return 'glb';
          })()}
          title="3D Model Viewer"
        />
      )}

      {/* Upload Progress Overlay */}
      {showUploadOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-500 ease-out animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin"></div>
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {isAddMode ? '🚀 Creating Your Listing' : '✏️ Updating Your Listing'}
              </h3>
              <p className="text-gray-600 text-base font-medium">
                {uploadStatus}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                {isAddMode ? 'Please wait while we process your new listing...' : 'Please wait while we save your changes...'}
              </div>
              {/* File count info */}
              <div className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-center space-x-4">
                  {formData.media?.mediaFiles?.length > 0 && (
                    <span>📸 {formData.media.mediaFiles.length} image{formData.media.mediaFiles.length !== 1 ? 's' : ''}</span>
                  )}
                  {formData.model_3d && (
                    <span>🏗️ 3D Model</span>
                  )}
                  {formData.additional_files?.length > 0 && (
                    <span>📎 {formData.additional_files.length} file{formData.additional_files.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-3">
                <span>Upload Progress</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                  {/* Glowing effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 20 ? 'text-green-600 scale-105' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  uploadProgress >= 20 ? 'bg-green-100 text-green-600 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadProgress >= 20 ? '✓' : '1'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">📁 Preparing Files</div>
                  <div className="text-xs text-gray-500">Validating and organizing your uploads</div>
                </div>
              </div>
              
              <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 50 ? 'text-green-600 scale-105' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  uploadProgress >= 50 ? 'bg-green-100 text-green-600 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadProgress >= 50 ? '✓' : '2'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">☁️ Uploading to Cloud</div>
                  <div className="text-xs text-gray-500">Securely transferring files to our servers</div>
                </div>
              </div>
              
              <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 80 ? 'text-green-600 scale-105' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  uploadProgress >= 80 ? 'bg-green-100 text-green-600 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadProgress >= 80 ? '✓' : '3'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">⚙️ Processing Data</div>
                  <div className="text-xs text-gray-500">Optimizing images and preparing content</div>
                </div>
              </div>
              
              <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 100 ? 'text-green-600 scale-105' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  uploadProgress >= 100 ? 'bg-green-100 text-green-600 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadProgress >= 100 ? '✓' : '4'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">💾 Saving to Database</div>
                  <div className="text-xs text-gray-500">Finalizing your listing and updating counters</div>
                </div>
              </div>
            </div>

            {/* Success Animation */}
            {uploadProgress === 100 && (
              <div className="mt-8 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
                  <div className="relative w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-green-600 mb-2">
                  🎉 {isAddMode ? 'Listing Created Successfully!' : 'Listing Updated Successfully!'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isAddMode ? 'Your new listing is now live and ready to be discovered!' : 'Your changes have been saved and are now live!'}
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Redirecting to your developments...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${accountType === 'developer' ? 'Unit' : 'Property'}`}
        message={`Are you sure you want to delete "${formData.title || 'this ' + (accountType === 'developer' ? 'unit' : 'property')}"? This action cannot be undone and will permanently remove all associated data.`}
        itemName={formData.title || `this ${accountType === 'developer' ? 'unit' : 'property'}`}
        itemType={accountType === 'developer' ? 'unit' : 'property'}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default PropertyManagement