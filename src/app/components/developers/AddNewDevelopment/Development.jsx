"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { uploadFileToStorage, uploadMultipleFilesToStorage } from '@/lib/fileUpload'
import DevelopmentDescription from './DevelopmentDescription'
import DevelopmentCategories from './DevelopmentCategories'
import PropertyLocation from '@/app/components/propertyManagement/modules/PropertyLocation'
import DevelopmentLocations from './DevelopmentLocations'
import DevelopmentAmenities from './DevelopmentAmenities'
import DevelopmentMedia from './DevelopmentMedia'
import DevelopmentFiles from './DevelopmentFiles'

const Development = ({ isAddMode, developmentId }) => {
  const { user } = useAuth()
  const [developmentData, setDevelopmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  // Debug user state
  useEffect(() => {
    console.log('Development component - user state changed:', {
      user: user ? {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        profile: user.profile ? {
          id: user.profile.id,
          developer_id: user.profile.developer_id,
          name: user.profile.name
        } : null
      } : null
    });
  }, [user]);
  
  // Unified form state for all sections
  const [formData, setFormData] = useState({
    // Description section
    title: '',
    tagline: '',
    description: '',
    size: '',
    status: '',
    number_of_buildings: 1,
    
    // Categories section
    purposes: [],
    types: [],
    categories: [],
    unit_types: {
      database: [],
      inbuilt: [],
      custom: []
    },
    
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
    
    // Development locations - array of multiple locations (JSONB)
    development_locations: [],
    
    // Amenities section
    amenities: {
      inbuilt: [],
      custom: []
    },
    
    // Media section - using media object
    media: {
      banner: null,
      video: null,
      youtubeUrl: '',
      virtualTourUrl: '',
      mediaFiles: []
    },
    
    // Additional files section
    additional_files: [],
    
    // Development status
    development_status: 'active'
  });

  // Reset fetch flag when developmentId changes
  useEffect(() => {
    setHasFetched(false);
  }, [developmentId]);

  // Fetch development data if in edit mode
  useEffect(() => {
    if (!isAddMode && developmentId && user && !hasFetched) {
      fetchDevelopmentData();
    }
  }, [isAddMode, developmentId, user, hasFetched]);

  const fetchDevelopmentData = async () => {
    if (!user || hasFetched) return;
    
    setLoading(true);
    setHasFetched(true);
    try {
      const token = localStorage.getItem('developer_token');
      const response = await fetch(`/api/developments/${developmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        setDevelopmentData(data);
        
        // Get development locations
        const devLocations = Array.isArray(data.development_locations) ? data.development_locations : []
        
        // Find primary location or use first location, or fall back to main location fields
        let primaryLocation = null
        if (devLocations.length > 0) {
          primaryLocation = devLocations.find(loc => loc.isPrimary) || devLocations[0]
        }
        
        // Use primary location if available, otherwise use main location fields
        const mainLocation = primaryLocation ? {
          country: primaryLocation.country || '',
          state: primaryLocation.state || '',
          city: primaryLocation.city || '',
          town: primaryLocation.town || '',
          fullAddress: primaryLocation.fullAddress || '',
          coordinates: {
            latitude: primaryLocation.coordinates?.latitude || '',
            longitude: primaryLocation.coordinates?.longitude || ''
          },
          additionalInformation: primaryLocation.additionalInformation || ''
        } : (data.location || {
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          town: data.town || '',
          fullAddress: data.full_address || '',
          coordinates: {
            latitude: data.latitude || '',
            longitude: data.longitude || ''
          },
          additionalInformation: data.additional_information || ''
        })
        
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          tagline: data.tagline || '',
          description: data.description || '',
          size: data.size || '',
          status: data.status || '',
          number_of_buildings: data.number_of_buildings || 1,
          purposes: data.purposes || [],
          types: data.types || [],
          categories: data.categories || [],
          unit_types: data.unit_types || { database: [], inbuilt: [], custom: [] },
          location: mainLocation,
          development_locations: devLocations,
          amenities: data.amenities || { inbuilt: [], custom: [] },
          media: data.media || {
            banner: data.banner || null,
            video: data.video || null,
            youtubeUrl: data.youtube_url || '',
            virtualTourUrl: data.virtual_tour_url || '',
            mediaFiles: data.media_files || []
          },
          additional_files: data.additional_files || [],
          development_status: data.development_status || 'active'
        });
      } else {
        toast.error('Failed to fetch development data');
      }
    } catch (error) {
      console.error('Error fetching development:', error);
      toast.error('Error fetching development data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevelopment = async () => {
    if (!confirm('Are you sure you want to delete this development? This action cannot be undone.')) {
      return;
    }

    if (!user) {
      toast.error('Please log in to delete developments');
      return;
    }

    try {
      const token = localStorage.getItem('developer_token');
      const response = await fetch(`/api/developments/${developmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Development deleted successfully!');
        // Redirect to developments list
        setTimeout(() => {
          window.location.href = `/developer/${user.profile?.slug || user.profile.id}/developments`;
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete development');
      }
    } catch (error) {
      console.error('Error deleting development:', error);
      toast.error('Error deleting development');
    }
  };

  // Update form data from child components
  const updateFormData = (sectionData) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        ...sectionData
      };
      
      // Ensure unit_types structure is always properly initialized
      if (updated.unit_types && typeof updated.unit_types === 'object') {
        updated.unit_types = {
          database: Array.isArray(updated.unit_types.database) ? updated.unit_types.database : [],
          inbuilt: Array.isArray(updated.unit_types.inbuilt) ? updated.unit_types.inbuilt : [],
          custom: Array.isArray(updated.unit_types.custom) ? updated.unit_types.custom : []
        };
      } else if (!updated.unit_types) {
        updated.unit_types = {
          database: [],
          inbuilt: [],
          custom: []
        };
      }
      
      return updated;
    });
  };

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    console.log('handleSubmit called', { 
      e, 
      isAddMode, 
      user: user ? {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        profile: user.profile
      } : null 
    });
    
    if (e) {
      e.preventDefault();
    }
    
    if (!user) {
      console.log('No user found');
      toast.error('Please log in to create/update developments');
      return;
    }

    if (!user.profile || !user.profile.developer_id) {
      console.log('User profile or profile.developer_id not found', { user });
      toast.error('Developer profile not found. Please contact support.');
      return;
    }

    console.log('Starting form submission...');
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.status) {
      toast.error('Please fill in all required fields (Title, Description, Status)');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('developer_token');
      console.log('Token found:', !!token);
      console.log('Token value:', token ? token.substring(0, 50) + '...' : 'null');
      console.log('Token length:', token ? token.length : 0);
      
      // Upload files to Supabase Storage
      const { location, media, ...otherFormData } = formData;
      console.log('Form data:', { location, media, otherFormData });
      
      // Upload banner if it exists (only if it's a new File, otherwise preserve existing)
      let bannerData = null;
      if (media?.banner) {
        if (media.banner instanceof File) {
          // New file upload
          const bannerUpload = await uploadFileToStorage(media.banner, 'iskaHomes', 'banners');
          if (bannerUpload.success) {
            bannerData = bannerUpload.data;
          } else {
            toast.error('Failed to upload banner image');
            return;
          }
        } else if (media.banner && typeof media.banner === 'object' && media.banner.url) {
          // Existing uploaded banner - preserve it
          bannerData = media.banner;
        }
      }
      
      // Upload video if it exists (only if it's a new File, otherwise preserve existing)
      let videoData = null;
      if (media?.video) {
        if (media.video instanceof File) {
          // New file upload
          const videoUpload = await uploadFileToStorage(media.video, 'iskaHomes', 'videos');
          if (videoUpload.success) {
            videoData = videoUpload.data;
          } else {
            toast.error('Failed to upload video file');
            return;
          }
        } else if (media.video && typeof media.video === 'object' && media.video.url) {
          // Existing uploaded video - preserve it
          videoData = media.video;
        }
      }
      
      // Upload media files if they exist (preserve existing, upload new)
      let mediaFilesData = [];
      if (media?.mediaFiles && media.mediaFiles.length > 0) {
        // Separate existing files from new files
        const existingFiles = media.mediaFiles.filter(file => !(file instanceof File) && file.url);
        const newFiles = media.mediaFiles.filter(file => file instanceof File);
        
        // Start with existing files
        mediaFilesData = [...existingFiles];
        
        // Upload new files if any
        if (newFiles.length > 0) {
          const mediaUpload = await uploadMultipleFilesToStorage(newFiles, 'iskaHomes', 'media');
          if (mediaUpload.success) {
            mediaFilesData = [...mediaFilesData, ...mediaUpload.data];
          } else {
            toast.error('Failed to upload some media files');
            return;
          }
        }
      }
      
      // Upload additional files if they exist (preserve existing, upload new)
      let additionalFilesData = [];
      if (otherFormData.additional_files && otherFormData.additional_files.length > 0) {
        // Separate existing files from new files
        const existingFiles = otherFormData.additional_files.filter(file => !(file instanceof File) && file.url);
        const newFiles = otherFormData.additional_files.filter(file => file instanceof File);
        
        // Start with existing files
        additionalFilesData = [...existingFiles];
        
        // Upload new files if any
        if (newFiles.length > 0) {
          const filesUpload = await uploadMultipleFilesToStorage(newFiles, 'iskaHomes', 'documents');
          if (filesUpload.success) {
            additionalFilesData = [...additionalFilesData, ...filesUpload.data];
          } else {
            toast.error('Failed to upload some additional files');
            return;
          }
        }
      }
      
      const developmentData = {
        developer_id: user.profile.developer_id,
        ...otherFormData,
        // Flatten location fields
        country: location?.country || '',
        state: location?.state || '',
        city: location?.city || '',
        town: location?.town || '',
        full_address: location?.fullAddress || '',
        latitude: location?.coordinates?.latitude || '',
        longitude: location?.coordinates?.longitude || '',
        additional_information: location?.additionalInformation || '',
        // Development locations (JSONB array)
        development_locations: otherFormData.development_locations || [],
        // Store uploaded file data
        banner: bannerData,
        video: videoData,
        youtube_url: media?.youtubeUrl || '',
        virtual_tour_url: media?.virtualTourUrl || '',
        media_files: mediaFilesData,
        additional_files: additionalFilesData
      };

      console.log('Final development data:', developmentData);
      console.log('Developer ID being sent:', developmentData.developer_id);
      
      let response;
      if (isAddMode) {
        console.log('Creating new development...');
        // Create new development
        response = await fetch('/api/developments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(developmentData)
        });
        console.log('Create response status:', response.status);
        
        // Check if token still exists after API call
        const tokenAfterCall = localStorage.getItem('developer_token');
        console.log('Token after API call:', !!tokenAfterCall);
        console.log('Token deleted?', !tokenAfterCall);
      } else {
        // Update existing development
        response = await fetch(`/api/developments/${developmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(developmentData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        
        // Show success toast
        toast.success(
          isAddMode 
            ? 'Development created successfully! Redirecting...' 
            : 'Development updated successfully! Redirecting...',
          {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        // Redirect to developments list
        setTimeout(() => {
          window.location.href = `/developer/${user.profile?.slug || user.profile.id}/developments`;
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        
        // Show error toast with detailed message
        const errorMessage = error.error || error.message || 'Failed to save development';
        toast.error(
          isAddMode 
            ? `Failed to create development: ${errorMessage}` 
            : `Failed to update development: ${errorMessage}`,
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    } catch (error) {
      console.error('Error saving development:', error);
      
      // Show error toast for network/other errors
      toast.error(
        isAddMode 
          ? `Error creating development: ${error.message || 'Network error. Please try again.'}` 
          : `Error updating development: ${error.message || 'Network error. Please try again.'}`,
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='w-full flex justify-center items-center py-8'>
        <div className='text-lg'>Loading development data...</div>
      </div>
    );
  }

  return (
    <div className='w-full flex flex-col gap-6 text-primary_color'>
      {/* Header */}
      <div className='flex justify-between items-center w-full'>
        <h1 className=''>
          {isAddMode ? 'Add New Development' : 'Edit Development'}
        </h1>
        {!isAddMode && (
          <button
            onClick={handleDeleteDevelopment}
            className='tertiary_button'
          >
            Delete Development
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className='sticky top-0 border-b border-gray-200 py-4 z-10'>
        <div className='flex gap-4 w-full overflow-x-auto'>
          {[
            { id: 'description', label: 'Description' },
            { id: 'categories', label: 'Categories' },
            { id: 'locations', label: 'Locations' },
            { id: 'amenities', label: 'Amenities' },
            { id: 'media', label: 'Media' },
            { id: 'files', label: 'Files' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className='flex-shrink-0 px-4 py-2 secondary_button whitespace-nowrap'
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Sections */}
      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Description Section */}
        <div id='description' className='scroll-mt-20'>
          <DevelopmentDescription 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode}
            developmentId={developmentId}
          />
        </div>

        {/* Categories Section */}
        <div id='categories' className='scroll-mt-20'>
          <DevelopmentCategories 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div>

        {/* Location Section - COMMENTED OUT: Now handled in Development Locations */}
        {/* <div id='location' className='scroll-mt-20'>
          <PropertyLocation 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div> */}

        {/* Development Locations Section */}
        <div id='locations' className='scroll-mt-20'>
          <DevelopmentLocations 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div>

        {/* Amenities Section */}
        <div id='amenities' className='scroll-mt-20'>
          <DevelopmentAmenities 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div>

        {/* Media Section */}
        <div id='media' className='scroll-mt-20'>
          <DevelopmentMedia 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div>

        {/* Files Section */}
        <div id='files' className='scroll-mt-20 mb-20'>
          <DevelopmentFiles 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={!isAddMode} 
          />
        </div>
      </form>

      {/* Sticky Submit Button */}
      <div className='fixed bottom-0 left-0 right-0 border-t border-gray-200 p-4 z-50 shadow-lg'>
        <div className='max-w-7xl mx-auto flex justify-center items-center'>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={loading}
            className='primary_button backdrop-blur-md'
          >
            {loading ? 'Processing...' : (isAddMode ? 'Create Development' : 'Update Development')}
          </button>
        </div>
      </div>

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

export default Development
