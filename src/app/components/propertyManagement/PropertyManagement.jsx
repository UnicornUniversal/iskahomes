"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useDevelopments } from '@/hooks/useCachedData'
import { Input } from '../ui/input'
import PropertyDescription from './modules/PropertyDescription'
import PropertyCategories from './modules/PropertyCategories'
import PropertySpecifications from './modules/PropertySpecifications'
import PropertyLocation from './modules/PropertyLocation'
import PropertyAmenities from './modules/PropertyAmenities'
import PropertyPricing from './modules/PropertyPricing'
import PropertyAdditionalInfo from './modules/PropertyAdditionalInfo'
import AlbumGallery from './modules/AlbumGallery'
import PropertyFiles from './modules/PropertyFiles'
import SocialAmenities from './modules/SocialAmenities'
import ImmersiveExperience from './modules/ImmersiveExperience'
import DevelopmentSelector from './modules/DevelopmentSelector'
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal'

const PropertyManagement = ({ slug, propertyId, accountType }) => {
  const { user } = useAuth()
  const analytics = useAnalytics()
  
  // Get primary location currency from user profile
  const primaryLocationCurrency = useMemo(() => {
    if (user?.profile?.company_locations && Array.isArray(user.profile.company_locations)) {
      const primaryLocation = user.profile.company_locations.find(
        loc => loc.primary_location === true
      )
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }
    // Fallback to default_currency if available
    if (user?.profile?.default_currency?.code) {
      return user.profile.default_currency.code
    }
    // Final fallback to USD
    return 'USD'
  }, [user?.profile?.company_locations, user?.profile?.default_currency])
  
  // Use cached developments hook
  const { 
    data: developments = [], 
    loading: developmentsLoading, 
    error: developmentsError 
  } = useDevelopments(user?.profile?.developer_id)
  
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [purposeData, setPurposeData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [initialLoadProgress, setInitialLoadProgress] = useState(0);
  const [initialLoadStatus, setInitialLoadStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [incompleteDrafts, setIncompleteDrafts] = useState([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeListingId, setResumeListingId] = useState(null);
  
  // Validate required props
  if (!accountType) {
    throw new Error('PropertyManagement: accountType prop is required');
  }
  
  if (!['developer', 'agent'].includes(accountType)) {
    throw new Error('PropertyManagement: accountType must be either "developer" or "agent"');
  }
  
  // Determine if it's add mode based on slug
  const isAddMode = slug === 'addNewUnit' || slug === 'addNewProperty';
  
  // Determine if it's edit mode (not add)
  const isEditMode = !isAddMode;
  
  
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
      inbuilt: [],
      custom: []
    },
    
    // Pricing section
    pricing: {
      price: '',
      currency: 'GHS',
      duration: 'monthly',
      price_type: 'rent',
      cancellation_policy: '', // Stays separate column
      is_negotiable: false,    // Stays separate column
      security_requirements: '', // Goes in pricing JSONB
      flexible_terms: false,   // Stays separate column
      // New fields for rent/lease (go in pricing JSONB)
      time: '',
      ideal_duration: '',
      time_span: 'months',
      estimated_revenue: ''
    },
    
    // Media section - using media object with albums
    media: {
      video: null,
      youtubeUrl: '',
      virtualTourUrl: '',
      albums: [] // Albums structure from AlbumGallery
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
    
    // Floor plan (image)
    floor_plan: null,
    
    // Virtual tour link
    virtual_tour_link: '',
    
    // Property status
    property_status: 'active',
    
    // Social amenities section
    social_amenities: {
      schools: [],
      hospitals: [],
      airports: [],
      parks: [],
      shops: [],
      police: []
    }
  });

  // Reset fetch flag when propertyId changes
  useEffect(() => {
    setHasFetched(false);
  }, [propertyId]);

  // Handle developments loading error
  useEffect(() => {
    if (developmentsError && accountType === 'developer') {
      toast.error('Failed to fetch developments')
    }
  }, [developmentsError, accountType])

  // Check for incomplete drafts when in add mode
  useEffect(() => {
    if (isAddMode && user) {
      checkForIncompleteDrafts();
    }
  }, [isAddMode, user]);

  // Fetch property data if in edit mode
  useEffect(() => {
    if (!isAddMode && propertyId && user && !hasFetched) {
      fetchPropertyData();
    } else if (isAddMode) {
      // If in add mode, simulate initial load progress
      setLoading(true);
      setInitialLoadProgress(10);
      setInitialLoadStatus('Initializing form...');
      
      // Simulate progress for add mode
      setTimeout(() => {
        setInitialLoadProgress(30);
        setInitialLoadStatus('Setting up form sections...');
      }, 200);
      
      setTimeout(() => {
        setInitialLoadProgress(60);
        setInitialLoadStatus('Preparing form fields...');
      }, 400);
      
      setTimeout(() => {
        setInitialLoadProgress(100);
        setInitialLoadStatus('Form ready!');
        setTimeout(() => {
      setLoading(false);
          setInitialLoadProgress(0);
          setInitialLoadStatus('');
        }, 300);
      }, 600);
    }
  }, [isAddMode, propertyId, user, hasFetched]);

  // Check for incomplete drafts to resume
  const checkForIncompleteDrafts = async () => {
    try {
      const token = localStorage.getItem('developer_token') || localStorage.getItem('agent_token')
      if (!token) return

      const response = await fetch('/api/listings/check-resume', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { hasIncompleteDrafts, drafts } = await response.json()
        if (hasIncompleteDrafts && drafts.length > 0) {
          setIncompleteDrafts(drafts)
          setShowResumeModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking for incomplete drafts:', error)
      // Don't show error to user - just continue with new listing
    }
  }

  // Handle resume draft
  const handleResumeDraft = async (draftId) => {
    setResumeListingId(draftId)
    setShowResumeModal(false)
    
    // Fetch the draft data and populate the form
    try {
      const token = localStorage.getItem('developer_token') || localStorage.getItem('agent_token')
      const response = await fetch(`/api/listings/${draftId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        
        // Populate form with draft data (similar to edit mode)
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
          // Migrate old 'general' to 'inbuilt' for backward compatibility
          amenities: (() => {
            const amenities = data.amenities || { inbuilt: [], custom: [] };
            // If old structure has 'general', migrate it to 'inbuilt'
            if (amenities.general && !amenities.inbuilt) {
              amenities.inbuilt = amenities.general;
              delete amenities.general;
            }
            // Ensure we only have inbuilt and custom arrays (no database or general)
            return {
              inbuilt: amenities.inbuilt || [],
              custom: amenities.custom || []
            };
          })(),
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
            // Extract estimated_revenue from object if it exists, otherwise use calculated value or empty string
            estimated_revenue: (() => {
              // If estimated_revenue is in pricing, it might be a string (from frontend) or object (from backend)
              if (data.pricing?.estimated_revenue) {
                if (typeof data.pricing.estimated_revenue === 'string') {
                  return data.pricing.estimated_revenue
                } else if (typeof data.pricing.estimated_revenue === 'object' && data.pricing.estimated_revenue.estimated_revenue) {
                  return String(data.pricing.estimated_revenue.estimated_revenue)
                } else if (typeof data.pricing.estimated_revenue === 'object' && data.pricing.estimated_revenue.price) {
                  return String(data.pricing.estimated_revenue.price)
                }
              }
              // Check if estimated_revenue exists as a top-level field (from backend)
              if (data.estimated_revenue) {
                if (typeof data.estimated_revenue === 'string') {
                  return data.estimated_revenue
                } else if (typeof data.estimated_revenue === 'object' && data.estimated_revenue.estimated_revenue) {
                  return String(data.estimated_revenue.estimated_revenue)
                } else if (typeof data.estimated_revenue === 'object' && data.estimated_revenue.price) {
                  return String(data.estimated_revenue.price)
                }
              }
              return ''
            })()
          },
          media: {
            video: data.media?.video || null,
            youtubeUrl: data.media?.youtubeUrl || '',
            virtualTourUrl: data.media?.virtualTourUrl || '',
            albums: data.media?.albums || []
          },
          model_3d: data["3d_model"] || null,
          additional_files: data.additional_files || [],
          availability: {
            available_from: data.available_from || '',
            available_until: data.available_until || '',
            acquisition_rules: data.acquisition_rules || ''
          },
          additional_information: data.additional_information || '',
          floor_plan: data.floor_plan || null,
          virtual_tour_link: data.virtual_tour_link || '',
          property_status: data.listing_status || 'draft',
          social_amenities: data.social_amenities || {
            schools: [],
            hospitals: [],
            airports: [],
            parks: [],
            shops: [],
            police: []
          }
        })
        
        toast.success('Draft loaded. Continue editing...')
      }
    } catch (error) {
      console.error('Error loading draft:', error)
      toast.error('Failed to load draft')
    }
  }

  // Handle start fresh (ignore drafts)
  const handleStartFresh = () => {
    setShowResumeModal(false)
    setResumeListingId(null)
    setIncompleteDrafts([])
  }

  const fetchPropertyData = async () => {
    if (!user || hasFetched) return;
    
    setLoading(true);
    setHasFetched(true);
    setInitialLoadProgress(10);
    setInitialLoadStatus('Connecting to server...');
    
    try {
      const token = localStorage.getItem(`${accountType}_token`);
      setInitialLoadProgress(30);
      setInitialLoadStatus('Fetching listing data...');
      
      const response = await fetch(`/api/listings/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });

        if (response.ok) {
        setInitialLoadProgress(60);
        setInitialLoadStatus('Processing listing data...');
        
        const { data } = await response.json();
        setPropertyData(data);
        
        setInitialLoadProgress(80);
        setInitialLoadStatus('Populating form fields...');
        
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
          // Migrate old 'general' to 'inbuilt' for backward compatibility
          amenities: (() => {
            const amenities = data.amenities || { inbuilt: [], custom: [] };
            // If old structure has 'general', migrate it to 'inbuilt'
            if (amenities.general && !amenities.inbuilt) {
              amenities.inbuilt = amenities.general;
              delete amenities.general;
            }
            // Ensure we only have inbuilt and custom arrays (no database or general)
            return {
              inbuilt: amenities.inbuilt || [],
              custom: amenities.custom || []
            };
          })(),
          pricing: {
            // Read from new pricing JSONB structure, fallback to old flat columns for backwards compatibility
            price: (data.pricing?.price ?? data.price) || '',
            currency: (data.pricing?.currency ?? data.currency) || 'GHS',
            duration: (data.pricing?.duration ?? data.duration) || 'monthly',
            price_type: (data.pricing?.price_type ?? data.price_type) || 'rent',
            // These fields stay separate (not in pricing JSONB)
            cancellation_policy: data.cancellation_policy || '',
            is_negotiable: data.is_negotiable || false,
            security_requirements: (data.pricing?.security_requirements ?? data.security_requirements) || '',
            flexible_terms: data.flexible_terms || false,
            // New fields that may exist in pricing JSONB (for rent/lease)
            time: data.pricing?.time || '',
            ideal_duration: data.pricing?.ideal_duration || '',
            time_span: data.pricing?.time_span || 'months',
            // Extract estimated_revenue from object if it exists, otherwise use calculated value or empty string
            estimated_revenue: (() => {
              // If estimated_revenue is in pricing, it might be a string (from frontend) or object (from backend)
              if (data.pricing?.estimated_revenue) {
                if (typeof data.pricing.estimated_revenue === 'string') {
                  return data.pricing.estimated_revenue
                } else if (typeof data.pricing.estimated_revenue === 'object' && data.pricing.estimated_revenue.estimated_revenue) {
                  return String(data.pricing.estimated_revenue.estimated_revenue)
                } else if (typeof data.pricing.estimated_revenue === 'object' && data.pricing.estimated_revenue.price) {
                  return String(data.pricing.estimated_revenue.price)
                }
              }
              // Check if estimated_revenue exists as a top-level field (from backend)
              if (data.estimated_revenue) {
                if (typeof data.estimated_revenue === 'string') {
                  return data.estimated_revenue
                } else if (typeof data.estimated_revenue === 'object' && data.estimated_revenue.estimated_revenue) {
                  return String(data.estimated_revenue.estimated_revenue)
                } else if (typeof data.estimated_revenue === 'object' && data.estimated_revenue.price) {
                  return String(data.estimated_revenue.price)
                }
              }
              return ''
            })()
          },
          media: {
            video: data.media?.video || null,
            youtubeUrl: data.media?.youtubeUrl || '',
            virtualTourUrl: data.media?.virtualTourUrl || '',
            albums: data.media?.albums || [] // Albums structure
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
          floor_plan: data.floor_plan || null,
          virtual_tour_link: data.virtual_tour_link || '',
          property_status: data.listing_status || 'active',
          social_amenities: data.social_amenities || {
            schools: [],
            hospitals: [],
            airports: [],
            parks: [],
            shops: [],
            police: []
          }
        });
        
        setInitialLoadProgress(100);
        setInitialLoadStatus('Loading complete!');
        
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
      setInitialLoadProgress(0);
      setInitialLoadStatus('Error loading data');
      } finally {
      // Small delay to show 100% before hiding
      setTimeout(() => {
      setLoading(false);
        setInitialLoadProgress(0);
        setInitialLoadStatus('');
      }, 500);
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
        
        // Analytics tracking removed
        
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

  // Handle albums change specifically for AlbumGallery - memoized to prevent re-renders
  const handleAlbumsChange = useCallback((albums) => {
    console.log('📸 Albums changed:', albums);
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        albums: albums
      }
    }));
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
      // Use cached-data API route which reads from Redis
      const response = await fetch('/api/cached-data?type=purposes');
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

  // Country to currency mapping (local currencies)
  const countryToCurrency = useMemo(() => ({
    'Ghana': 'GHS',
    'Nigeria': 'NGN',
    'Kenya': 'KES',
    'South Africa': 'ZAR',
    'Uganda': 'UGX',
    'Tanzania': 'TZS',
    'Rwanda': 'RWF',
    'Ethiopia': 'ETB',
    'Egypt': 'EGP',
    'Morocco': 'MAD',
    'Tunisia': 'TND',
    'Algeria': 'DZD',
    'Senegal': 'XOF',
    'Ivory Coast': 'XOF',
    'Cameroon': 'XAF',
    'Gabon': 'XAF',
    'Congo': 'XAF',
    'Chad': 'XAF',
    'Central African Republic': 'XAF',
    'Equatorial Guinea': 'XAF',
    'Republic of the Congo': 'XAF',
    'United States': 'USD',
    'United Kingdom': 'GBP',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'New Zealand': 'NZD',
    'Ireland': 'EUR',
    'France': 'EUR',
    'Germany': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Portugal': 'EUR',
    'Netherlands': 'EUR',
    'Belgium': 'EUR',
    'Austria': 'EUR',
    'Switzerland': 'CHF',
    'Sweden': 'SEK',
    'Norway': 'NOK',
    'Denmark': 'DKK',
    'Poland': 'PLN',
    'Czech Republic': 'CZK',
    'Hungary': 'HUF',
    'Romania': 'RON',
    'Bulgaria': 'BGN',
    'Croatia': 'HRK',
    'Greece': 'EUR',
    'Turkey': 'TRY',
    'Israel': 'ILS',
    'Saudi Arabia': 'SAR',
    'United Arab Emirates': 'AED',
    'Qatar': 'QAR',
    'Kuwait': 'KWD',
    'Bahrain': 'BHD',
    'Oman': 'OMR',
    'Jordan': 'JOD',
    'Lebanon': 'LBP',
    'India': 'INR',
    'Pakistan': 'PKR',
    'Bangladesh': 'BDT',
    'Sri Lanka': 'LKR',
    'Nepal': 'NPR',
    'Bhutan': 'BTN',
    'Myanmar': 'MMK',
    'Thailand': 'THB',
    'Vietnam': 'VND',
    'Cambodia': 'KHR',
    'Laos': 'LAK',
    'Malaysia': 'MYR',
    'Singapore': 'SGD',
    'Indonesia': 'IDR',
    'Philippines': 'PHP',
    'China': 'CNY',
    'Japan': 'JPY',
    'South Korea': 'KRW',
    'Taiwan': 'TWD',
    'Hong Kong': 'HKD',
    'Macau': 'MOP',
    'Mongolia': 'MNT',
    'North Korea': 'KPW',
    'Brazil': 'BRL',
    'Argentina': 'ARS',
    'Chile': 'CLP',
    'Colombia': 'COP',
    'Peru': 'PEN',
    'Ecuador': 'USD',
    'Venezuela': 'VES',
    'Bolivia': 'BOB',
    'Paraguay': 'PYG',
    'Uruguay': 'UYU',
    'Mexico': 'MXN',
    'Guatemala': 'GTQ',
    'Honduras': 'HNL',
    'Nicaragua': 'NIO',
    'Costa Rica': 'CRC',
    'Panama': 'PAB',
    'Cuba': 'CUP',
    'Jamaica': 'JMD',
    'Haiti': 'HTG',
    'Dominican Republic': 'DOP',
    'Trinidad and Tobago': 'TTD',
    'Barbados': 'BBD',
    'Bahamas': 'BSD',
    'Belize': 'BZD',
    'Guyana': 'GYD',
    'Suriname': 'SRD',
    'Russia': 'RUB',
    'Ukraine': 'UAH',
    'Belarus': 'BYN',
    'Kazakhstan': 'KZT',
    'Uzbekistan': 'UZS',
    'Turkmenistan': 'TMT',
    'Kyrgyzstan': 'KGS',
    'Tajikistan': 'TJS',
    'Afghanistan': 'AFN',
    'Iran': 'IRR',
    'Iraq': 'IQD',
    'Yemen': 'YER',
    'Syria': 'SYP',
    'Libya': 'LYD',
    'Sudan': 'SDG',
    'South Sudan': 'SSP',
    'Eritrea': 'ERN',
    'Djibouti': 'DJF',
    'Somalia': 'SOS',
    'Comoros': 'KMF',
    'Mauritius': 'MUR',
    'Seychelles': 'SCR',
    'Madagascar': 'MGA',
    'Malawi': 'MWK',
    'Zambia': 'ZMW',
    'Zimbabwe': 'ZWL',
    'Botswana': 'BWP',
    'Namibia': 'NAD',
    'Lesotho': 'LSL',
    'Eswatini': 'SZL',
    'Mozambique': 'MZN',
    'Angola': 'AOA',
    'Democratic Republic of the Congo': 'CDF',
    'Burundi': 'BIF',
    'Guinea': 'GNF',
    'Sierra Leone': 'SLL',
    'Liberia': 'LRD',
    'Gambia': 'GMD',
    'Guinea-Bissau': 'XOF',
    'Mali': 'XOF',
    'Burkina Faso': 'XOF',
    'Niger': 'XOF',
    'Benin': 'XOF',
    'Togo': 'XOF',
    'Ghana': 'GHS', // Already listed, but keeping for completeness
    'Mauritania': 'MRU',
    'Western Sahara': 'MAD',
    'Fiji': 'FJD',
    'Papua New Guinea': 'PGK',
    'Solomon Islands': 'SBD',
    'Vanuatu': 'VUV',
    'New Caledonia': 'XPF',
    'French Polynesia': 'XPF',
    'Samoa': 'WST',
    'Tonga': 'TOP',
    'Tuvalu': 'AUD',
    'Kiribati': 'AUD',
    'Nauru': 'AUD',
    'Palau': 'USD',
    'Micronesia': 'USD',
    'Marshall Islands': 'USD',
  }), []);

  // Track previous country to detect changes
  const previousCountryRef = useRef(null);
  
  // Auto-update currency when country changes
  useEffect(() => {
    const country = formData.location?.country;
    const currentCurrency = formData.pricing?.currency;
    
    if (country && countryToCurrency[country]) {
      const localCurrency = countryToCurrency[country];
      
      // Only auto-update if:
      // 1. Country actually changed (not initial load)
      // 2. Currency is not USD (don't override user's USD choice)
      // 3. Currency doesn't already match the new country's local currency
      const countryChanged = previousCountryRef.current !== country && previousCountryRef.current !== null;
      
      if (countryChanged && currentCurrency !== 'USD' && currentCurrency !== localCurrency) {
        updateFormData({
          pricing: {
            ...formData.pricing,
            currency: localCurrency
          }
        });
      } else if (!previousCountryRef.current && country && currentCurrency !== localCurrency && currentCurrency !== 'USD') {
        // On initial country selection, set to local currency (unless USD already selected)
        updateFormData({
          pricing: {
            ...formData.pricing,
            currency: localCurrency
          }
        });
      }
      
      // Update previous country reference
      previousCountryRef.current = country;
    }
  }, [formData.location?.country, countryToCurrency, formData.pricing?.currency, updateFormData]);

  // Memoize navigation sections
  const navigationSections = useMemo(() => [
    { id: 'description', label: 'Description' },
    { id: 'categories', label: 'Categories' },
    { id: 'location', label: 'Location' },
    { id: 'pricing', label: 'Pricing & Availability' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'social-amenities', label: 'Social Amenities' },
    { id: 'media', label: 'Media' },
    { id: 'immersive-experience', label: 'Immersive Experience' },
    { id: 'additional-info', label: 'Additional Info' },
    ...(accountType === 'developer' ? [
      { id: 'files', label: 'Files' }
    ] : [])
  ], [accountType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    console.log('🚀 Form submission started', { isAddMode, propertyId, accountType });
    
    if (!user) {
      toast.error('Please log in to create/update listings');
      console.error('❌ No user found');
      return;
    }

    if (!user.profile) {
      toast.error('Profile not found. Please contact support.');
      return;
    }

    // Check for appropriate profile ID based on account type
    if (accountType === 'developer' && !user.profile.developer_id) {
      toast.error('Developer profile not found. Please contact support.');
      return;
    }

    if (accountType === 'agent' && !user.profile.agent_id) {
      toast.error('Agent profile not found. Please contact support.');
      return;
    }
    
    // Comprehensive validation for all required fields
    const missingFields = [];
    const fieldLabels = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      development_id: 'Development',
      location: 'Location',
      location_coordinates: 'Location Coordinates',
      price: 'Price',
      currency: 'Currency',
      price_type: 'Price Type',
      duration: 'Duration',
      time: 'Duration Length',
      ideal_duration: 'Ideal Duration',
      time_span: 'Time Span',
      estimated_revenue: 'Estimated Revenue',
      media: 'Media (Images)',
      purposes: 'Property Purpose',
      types: 'Property Type',
      categories: 'Property Category'
    };

    // Check title (required)
    if (!formData.title || formData.title.trim() === '') {
      missingFields.push(fieldLabels.title);
    }

    // Check description (required)
    if (!formData.description || formData.description.trim() === '') {
      missingFields.push(fieldLabels.description);
    }

    // Check status (required)
    if (!formData.status || formData.status.trim() === '') {
      missingFields.push(fieldLabels.status);
    }

    // Check development_id (required for developers)
    if (accountType === 'developer' && (!formData.development_id || formData.development_id === '')) {
      missingFields.push(fieldLabels.development_id);
    }

    // Check purposes (required)
    if (!formData.purposes || formData.purposes.length === 0) {
      missingFields.push(fieldLabels.purposes);
    }

    // Check types (required)
    if (!formData.types || formData.types.length === 0) {
      missingFields.push(fieldLabels.types);
    }

    // Check categories (required)
    if (!formData.categories || formData.categories.length === 0) {
      missingFields.push(fieldLabels.categories);
    }

    // Check location (at least coordinates required)
    if (!formData.location?.coordinates?.latitude || 
        !formData.location?.coordinates?.longitude ||
        formData.location.coordinates.latitude === '' ||
        formData.location.coordinates.longitude === '') {
      missingFields.push(fieldLabels.location_coordinates);
    }

    // Check pricing - all fields required
    if (!formData.pricing?.price || formData.pricing.price === '' || formData.pricing.price === '0' || parseFloat(formData.pricing.price) <= 0) {
      missingFields.push(fieldLabels.price);
    }

    if (!formData.pricing?.currency || formData.pricing.currency === '') {
      missingFields.push(fieldLabels.currency);
    }

    if (!formData.pricing?.price_type || formData.pricing.price_type === '') {
      missingFields.push(fieldLabels.price_type);
    }
    
    // For rent/lease, check additional required fields
    if (formData.pricing?.price_type === 'rent' || formData.pricing?.price_type === 'lease') {
      if (!formData.pricing?.time || formData.pricing.time === '' || formData.pricing.time === '0' || parseFloat(formData.pricing.time) <= 0) {
        missingFields.push(fieldLabels.time);
      }
      if (!formData.pricing?.duration || formData.pricing.duration === '') {
        missingFields.push(fieldLabels.duration);
      }
      if (!formData.pricing?.ideal_duration || formData.pricing.ideal_duration === '' || formData.pricing.ideal_duration === '0' || parseFloat(formData.pricing.ideal_duration) <= 0) {
        missingFields.push(fieldLabels.ideal_duration);
      }
      if (!formData.pricing?.time_span || formData.pricing.time_span === '') {
        missingFields.push(fieldLabels.time_span);
      }
      // Check if estimated_revenue is valid (must be a non-empty string/number)
      const estimatedRevenue = formData.pricing?.estimated_revenue
      const isValidEstimatedRevenue = estimatedRevenue && 
        estimatedRevenue !== '' && 
        estimatedRevenue !== '0' && 
        !isNaN(parseFloat(estimatedRevenue)) &&
        parseFloat(estimatedRevenue) > 0
      
      if (!isValidEstimatedRevenue) {
        missingFields.push(fieldLabels.estimated_revenue);
      }
    } else if (formData.pricing?.price_type === 'sale') {
      // For sale, estimated revenue should equal price
      const estimatedRevenue = formData.pricing?.estimated_revenue
      const isValidEstimatedRevenue = estimatedRevenue && 
        estimatedRevenue !== '' && 
        estimatedRevenue !== '0' && 
        !isNaN(parseFloat(estimatedRevenue)) &&
        parseFloat(estimatedRevenue) > 0
      
      if (!isValidEstimatedRevenue) {
        missingFields.push(fieldLabels.estimated_revenue);
      }
    }

    // Check media (at least one image in albums required)
    const hasImages = formData.media?.albums?.some(album => 
      album?.images && album.images.length > 0
    ) || false;
    
    if (!hasImages) {
      missingFields.push(fieldLabels.media);
    }

    // Show detailed error if any required fields are missing
    if (missingFields.length > 0) {
      const errorMessage = missingFields.length === 1 
        ? `Please fill in the required field: ${missingFields[0]}`
        : `Please fill in all required fields:\n${missingFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}`;
      
      console.error('❌ Validation failed:', missingFields);
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
      
      // Scroll to first missing field section
      if (missingFields.includes(fieldLabels.title) || missingFields.includes(fieldLabels.description)) {
        document.getElementById('description')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (missingFields.includes(fieldLabels.development_id)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (missingFields.includes(fieldLabels.purposes) || missingFields.includes(fieldLabels.types) || missingFields.includes(fieldLabels.categories)) {
        document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (missingFields.includes(fieldLabels.location_coordinates)) {
        document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (missingFields.some(f => [fieldLabels.price, fieldLabels.currency, fieldLabels.price_type].includes(f))) {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (missingFields.includes(fieldLabels.media)) {
        document.getElementById('media')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      return;
    }
    
    console.log('✅ Validation passed, proceeding with submission');
    
    
    console.log('📤 Starting upload process...');
    setLoading(true);
    setShowUploadOverlay(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    
    try {
      console.log('📋 Form data before submission:', {
        title: formData.title,
        hasAlbums: !!formData.media?.albums,
        albumsCount: formData.media?.albums?.length || 0,
        totalImages: formData.media?.albums?.reduce((sum, album) => sum + (album?.images?.length || 0), 0) || 0
      });
      const token = localStorage.getItem(`${accountType}_token`);
      
      // Prepare form data for submission
      const { location, media, pricing, availability, ...otherFormData } = formData;
      
      // Ensure title and description are explicitly included and not empty
      if (!formData.title || formData.title.trim() === '') {
        toast.error('Title is required');
        return;
      }
      
      if (!formData.description || formData.description.trim() === '') {
        toast.error('Description is required');
        return;
      }
      
      const propertyData = {
        account_type: accountType,
        user_id: user.id,
        // Explicitly include required fields
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status || 'Available',
        listing_type: formData.listing_type || (accountType === 'developer' ? 'unit' : 'property'),
        size: formData.size || null,
        ...otherFormData,
        // Explicitly include development_id for developers
        development_id: accountType === 'developer' ? otherFormData.development_id || formData.development_id : null,
        // Flatten location fields
        country: location?.country || '',
        state: location?.state || '',
        city: location?.city || '',
        town: location?.town || '',
        full_address: location?.fullAddress || '',
        latitude: location?.coordinates?.latitude || '',
        longitude: location?.coordinates?.longitude || '',
        additional_information: location?.additionalInformation || '',
        // New pricing JSONB structure
        pricing: {
        price: pricing?.price || '',
        currency: pricing?.currency || 'GHS',
        duration: pricing?.duration || 'monthly',
        price_type: pricing?.price_type || 'rent',
          security_requirements: pricing?.security_requirements || '',
          // New fields for rent/lease
          time: pricing?.time || '',
          ideal_duration: pricing?.ideal_duration || '',
          time_span: pricing?.time_span || 'months'
        },
        // Keep separate columns (not in pricing JSONB)
        cancellation_policy: pricing?.cancellation_policy || '',
        is_negotiable: pricing?.is_negotiable || false,
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
        additional_information: otherFormData.additional_information || '',
        // Floor plan
        floor_plan: otherFormData.floor_plan || null,
        // Virtual tour link
        virtual_tour_link: otherFormData.virtual_tour_link || '',
        // Social amenities
        social_amenities: otherFormData.social_amenities || {
          schools: [],
          hospitals: [],
          airports: [],
          parks: [],
          shops: [],
          police: []
        },
        // Amenities - only inbuilt and custom (no database or general)
        amenities: {
          inbuilt: otherFormData.amenities?.inbuilt || [],
          custom: otherFormData.amenities?.custom || []
        }
      };


      // Create FormData for file uploads
      const formDataForUpload = new FormData();
      
      // Clean media object for JSON serialization (remove File objects, keep URLs and structure)
      const cleanMediaForJson = {
        video: media?.video && !(media.video instanceof File) && !(media.video?.file instanceof File) ? media.video : null,
        youtubeUrl: media?.youtubeUrl || '',
        virtualTourUrl: media?.virtualTourUrl || '',
        albums: media?.albums ? media.albums.map(album => ({
          id: album.id,
          name: album.name,
          isDefault: album.isDefault,
          created_at: album.created_at,
          images: album.images ? album.images.map(image => {
            // If image has a File object, it's a new upload - exclude it from JSON (will be sent as file)
            // If image has a URL, it's existing - include it in JSON
            if (image?.file && image.file instanceof File) {
              // New image being uploaded - don't include in JSON, only send File object
              return null;
            }
            // Existing image with URL - include in JSON
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
            };
          }).filter(img => img !== null) : []
        })) : []
      };
      
      // Update propertyData with cleaned media
      propertyData.media = cleanMediaForJson;
      
      formDataForUpload.append('data', JSON.stringify(propertyData));
      
      // IMPORTANT: Also append media as separate field so backend can access albums structure
      // This ensures the backend gets the complete albums structure with existing images
      formDataForUpload.append('media', JSON.stringify(cleanMediaForJson));
      
      // Add resume_listing_id if resuming a draft
      if (resumeListingId) {
        formDataForUpload.append('resume_listing_id', resumeListingId);
      }
      
      // Add final listing status (default to 'active' for new listings, preserve 'draft' for resumed drafts)
      const finalStatus = isAddMode && !resumeListingId ? 'active' : (formData.property_status || 'active');
      formDataForUpload.append('final_listing_status', finalStatus);
      
      // Add social amenities separately so API can access it directly
      if (otherFormData.social_amenities) {
        formDataForUpload.append('social_amenities', JSON.stringify(otherFormData.social_amenities));
      }
      
      // Add video file if it exists
      if (media?.video) {
        if (media.video instanceof File) {
        formDataForUpload.append('video', media.video);
        } else if (media.video.file instanceof File) {
          formDataForUpload.append('video', media.video.file);
        }
      }
      
      // Handle albums - extract all image files from albums
      // Use per-album image index (not global) so backend can match files to correct albums
      if (media?.albums && media.albums.length > 0) {
        media.albums.forEach((album, albumIndex) => {
          if (album?.images && album.images.length > 0) {
            let imageIndex = 0; // Reset for each album
            album.images.forEach((image) => {
              if (image?.file && image.file instanceof File) {
                formDataForUpload.append(`album_${albumIndex}_image_${imageIndex}`, image.file);
                imageIndex++;
          }
        });
          }
        });
      }
      
      if (otherFormData.additional_files && otherFormData.additional_files.length > 0) {
        otherFormData.additional_files.forEach((file, index) => {
          if (file instanceof File) {
            formDataForUpload.append(`additionalFile_${index}`, file);
          }
        });
      } else {
      }
      
      if (accountType === 'developer' && otherFormData.model_3d && otherFormData.model_3d.file instanceof File) {
        formDataForUpload.append('model3d', otherFormData.model_3d.file);
      }
      
      // Add floor plan if it exists
      if (otherFormData.floor_plan && otherFormData.floor_plan.file instanceof File) {
        formDataForUpload.append('floorPlan', otherFormData.floor_plan.file);
      }
      
      
      // Simulate upload progress
      setUploadProgress(20);
      setUploadStatus('Preparing files for upload...');
      
      let response;
      if (isAddMode) {
        // Create new listing
        response = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });
        setUploadProgress(80);
        setUploadStatus('Processing and saving data...');
      } else {
        // Update existing listing
        setUploadProgress(30);
        setUploadStatus('Uploading files...');
        
        response = await fetch(`/api/listings/${propertyId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });
        setUploadProgress(80);
        setUploadStatus('Processing and saving changes...');
      }

      if (response.ok) {
        setUploadProgress(100);
        setUploadStatus('Finalizing your listing...');
        
        const result = await response.json();
        console.log('✅ Success response:', { success: true, listingId: result?.data?.id || result?.id });
        
        // Show success for a moment before redirecting
        setTimeout(() => {
          setShowUploadOverlay(false);
        toast.success(
          isAddMode 
            ? 'Listing created successfully!' 
            : 'Listing updated successfully!'
        );
        
          // Analytics tracking removed
        
          // Redirect to developments list
        setTimeout(() => {
          if (accountType === 'developer') {
              const redirectUrl = `/developer/${user.profile?.slug || user.profile.id}/units`;
              console.log('🔄 Redirecting to:', redirectUrl);
              window.location.href = redirectUrl;
          } else {
              const redirectUrl = `/agent/${user.profile?.slug || user.profile.id}/listings`;
              console.log('🔄 Redirecting to:', redirectUrl);
              window.location.href = redirectUrl;
          }
          }, 1500);
        }, 1000);
      } else {
        const error = await response.json();
        console.error('❌ Server error response:', { status: response.status, error });
        setShowUploadOverlay(false);
        setUploadProgress(0);
        const errorMessage = error.error || error.message || 'Failed to save listing';
        toast.error(
          <div>
            <div className="font-bold">Upload Failed</div>
            <div className="text-sm">{errorMessage}</div>
            <div className="text-xs mt-1">Please check your connection and try again.</div>
          </div>,
          { autoClose: 5000 }
        );
      }
    } catch (error) {
      setShowUploadOverlay(false);
      setUploadProgress(0);
      console.error('Network error:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('NetworkError') ||
                            error.message?.includes('network') ||
                            (!navigator.onLine);
      
      toast.error(
        <div>
          <div className="font-bold">Network Error</div>
          <div className="text-sm">
            {isNetworkError 
              ? 'Connection lost. Please check your internet and try again.'
              : 'An unexpected error occurred. Please try again.'}
          </div>
          <div className="text-xs mt-1">
            {isNetworkError && 'Your data is safe. Files may need to be re-uploaded.'}
          </div>
        </div>,
        { autoClose: 6000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial loading modal (replaces the simple loading div)
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-500 ease-out">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin"></div>
              <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {isAddMode ? '🚀 Preparing Your Form' : '📋 Loading Your Listing'}
            </h3>
            <p className="text-gray-300 text-base font-medium">
              {initialLoadStatus || (isAddMode ? 'Initializing form...' : 'Loading property data...')}
            </p>
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-sm text-yellow-400 font-semibold">
                ⚠️ Please do not close or refresh this tab
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                {isAddMode 
                  ? 'Your form is being prepared. Any interruption may cause data loss.'
                  : 'Your listing data is being loaded. Please wait...'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-3">
              <span>Loading Progress</span>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                {initialLoadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner border border-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${initialLoadProgress}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-4">
            <div className={`flex items-center space-x-4 transition-all duration-300 ${initialLoadProgress >= 20 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                initialLoadProgress >= 20 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {initialLoadProgress >= 20 ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">🔌 Connecting</div>
                <div className="text-xs text-gray-400">Establishing secure connection</div>
              </div>
            </div>
            
            <div className={`flex items-center space-x-4 transition-all duration-300 ${initialLoadProgress >= 50 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                initialLoadProgress >= 50 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {initialLoadProgress >= 50 ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">📥 Fetching Data</div>
                <div className="text-xs text-gray-400">Retrieving your listing information</div>
              </div>
            </div>
            
            <div className={`flex items-center space-x-4 transition-all duration-300 ${initialLoadProgress >= 80 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                initialLoadProgress >= 80 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {initialLoadProgress >= 80 ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">⚙️ Processing</div>
                <div className="text-xs text-gray-400">Organizing and preparing form data</div>
              </div>
            </div>
            
            <div className={`flex items-center space-x-4 transition-all duration-300 ${initialLoadProgress >= 100 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                initialLoadProgress >= 100 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {initialLoadProgress >= 100 ? '✓' : '4'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">✅ Ready</div>
                <div className="text-xs text-gray-400">Form is ready for editing</div>
              </div>
            </div>
          </div>

          {/* Success Animation */}
          {initialLoadProgress === 100 && (
            <div className="mt-8 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-green-600/30 rounded-full animate-ping"></div>
                <div className="relative w-16 h-16 bg-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-500/50">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-green-400 mb-2">
                🎉 {isAddMode ? 'Form Ready!' : 'Listing Loaded!'}
              </h4>
              <p className="text-sm text-gray-300">
                {isAddMode ? 'You can now start creating your listing!' : 'You can now view and edit your listing!'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full relative flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8' style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Main Content */}
      <div className='flex-1 flex flex-col gap-4 sm:gap-6' style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-4'>
          <h1 className='text-xl sm:text-2xl font-bold'>
            {isAddMode ? (
              slug === 'addNewUnit' ? 'Add New Unit' : 'Add New Property'
            ) : 'Edit Property'}
          </h1>
          {!isAddMode && (
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Development *
            </label>
            <DevelopmentSelector
              developments={developments}
              loading={developmentsLoading}
              selectedDevelopmentId={formData.development_id || ''}
              onSelect={(developmentId) => updateFormData({ development_id: developmentId || '' })}
              required
              developerId={user?.profile?.developer_id}
            />
          </div>
        )}


        {/* Form Sections */}
        <div suppressHydrationWarning style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <form suppressHydrationWarning onSubmit={handleSubmit} className='space-y-6 sm:space-y-8 relative' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          {/* Description Section */}
          <div id='description' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyDescription 
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'} 
            />
          </div>

          {/* Categories Section */}
          <div id='categories' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyCategories 
              formData={formData}
              updateFormData={updateFormData}
              isEditMode={isEditMode} 
            />
          </div>


          {/* Specifications Section */}
          <div id='specifications' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            {console.log('🔍 PropertyManagement - formData.types:', formData.types)}
            <PropertySpecifications 
              selectedTypeIds={formData.types}
              specifications={formData.specifications}
              updateFormData={updateFormData}
              isEditMode={isEditMode}
              purposeData={purposeData}
            />
          </div>

          {/* Location Section - Moved before Pricing */}
          <div id='location' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyLocation 
              formData={formData}
              updateFormData={updateFormData}
              isEditMode={isEditMode} 
              companyLocations={user?.profile?.company_locations || []}
            />
          </div>

          {/* Pricing & Availability Section - Combined */}
          <div id='pricing' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyPricing 
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'}
              purposeData={purposeData}
              companyLocations={user?.profile?.company_locations || []}
            />
          </div>

   

          {/* Amenities Section */}
          <div id='amenities' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyAmenities 
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'} 
            />
          </div>

          {/* Social Amenities Section */}
          <div id='social-amenities' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <SocialAmenities 
              formData={formData}
              updateFormData={updateFormData}
              isEditMode={isEditMode} 
            />
          </div>

          {/* Media Section */}
          <div id='media' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full overflow-hidden space-y-8' style={{ maxWidth: '100%', width: '100%' }}>
              {/* Image Albums */}
              <AlbumGallery
                albums={formData.media?.albums || []}
                onAlbumsChange={handleAlbumsChange}
                mode="edit"
              />
              
              {/* YouTube URL Section */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">YouTube Video</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Video URL
                    </label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.media?.youtubeUrl || ''}
                      onChange={(e) => {
                        updateFormData({
                          media: {
                            ...formData.media,
                            youtubeUrl: e.target.value
                          }
                        })
                      }}
                      className="w-full"
                    />
                    {formData.media?.youtubeUrl && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(formData.media.youtubeUrl) && (() => {
                      const url = formData.media.youtubeUrl
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                      const match = url.match(regExp)
                      const videoId = (match && match[2].length === 11) ? match[2] : null
                      return videoId ? (
                        <div className="mt-3">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Preview:</p>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                    {formData.media?.youtubeUrl && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(formData.media.youtubeUrl) && (
                      <p className="text-sm text-red-600 mt-2">Please enter a valid YouTube URL</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Enter a YouTube video URL to embed it in your listing
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Upload Section */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Video Upload</h4>
                <div className="space-y-4">
                  {formData.media?.video ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <video
                          src={formData.media.video.url || (typeof formData.media.video === 'string' ? formData.media.video : formData.media.video.url)}
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: '400px' }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">
                            {formData.media.video.name || formData.media.video.filename || 'Video file'}
                          </div>
                          {formData.media.video.size && (
                            <div className="text-xs text-gray-500">
                              {(formData.media.video.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.media.video?.url && formData.media.video.url.startsWith('blob:')) {
                              URL.revokeObjectURL(formData.media.video.url)
                            }
                            updateFormData({
                              media: {
                                ...formData.media,
                                video: null
                              }
                            })
                            toast.success('Video removed')
                          }}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'video/*'
                        input.onchange = (e) => {
                          const file = e.target.files[0]
                          if (!file) return

                          if (!file.type.startsWith('video/')) {
                            toast.error('Please upload a valid video file')
                            return
                          }

                          const maxSize = 100 * 1024 * 1024 // 100MB
                          if (file.size > maxSize) {
                            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
                            toast.error(`Video file size (${fileSizeMB}MB) exceeds the 100MB limit. Please compress the video.`)
                            return
                          }

                          updateFormData({
                            media: {
                              ...formData.media,
                              video: {
                                file: file,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: URL.createObjectURL(file)
                              }
                            }
                          })
                          toast.success('Video uploaded successfully')
                        }
                        input.click()
                      }}
                    >
                      <div className="space-y-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-base font-medium text-gray-700 mb-1">
                            Click to upload a video or drag and drop
                          </p>
                          <p className="text-sm text-gray-500">
                            MP4, MOV, AVI up to 100MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Immersive Experience Section */}
          <div id='immersive-experience' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <ImmersiveExperience 
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'}
              accountType={accountType}
            />
          </div>

          {/* Additional Information Section */}
          <div id='additional-info' className='scroll-mt-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PropertyAdditionalInfo 
              formData={formData}
              updateFormData={updateFormData}
              mode={isAddMode ? 'add' : 'edit'} 
            />
          </div>

          {/* Files Section - Only for developers */}
          {accountType === 'developer' && (
            <div id='files' className='scroll-mt-20 mb-20 menu_bg' style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
              <PropertyFiles 
                formData={formData}
                updateFormData={updateFormData}
                isEditMode={isEditMode}
                accountType={accountType}
              />
            </div>
          )}

          {/* Sticky Submit Button - Now inside the form */}
        <div className='  right-0 bg-white border-t border-gray-200 p-3 sm:p-4 z-50 shadow-lg'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center'>
            <button
                  type='submit'
              suppressHydrationWarning
              disabled={loading}
              className='w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
            >
                  {loading ? 'Processing...' : (isAddMode ? (accountType === 'developer' ? 'Create Unit' : 'Create Property') : (accountType === 'developer' ? 'Update Unit' : 'Update Property'))}
            </button>
          </div>
        </div>
        </form>
        </div>
      </div>

      {/* Right Sidebar Navigation */}
      <div className='hidden lg:flex lg:flex-col w-64 sticky top-[1em]  flex-shrink-0'>
        <div className='self-start space-y-6'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Navigation</h3>
            <nav className='space-y-2 max-h-[60vh] overflow-y-auto'>
              {navigationSections.map(section => (
                <button
                  key={section.id}
                  suppressHydrationWarning
                  onClick={() => scrollToSection(section.id)}
                  className='w-full text-left px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors'
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Images Gallery - Show images from albums */}
          {(() => {
            // Collect all images from all albums
            const allImages = [];
            if (formData.media?.albums) {
              formData.media.albums.forEach(album => {
                if (album?.images && album.images.length > 0) {
                  album.images.forEach(image => {
                    allImages.push(image);
                  });
                }
              });
            }
            
            return allImages.length > 0 ? (
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Images Gallery</h3>
              <div className='grid grid-cols-2 gap-2'>
                  {allImages.slice(0, 6).map((image, index) => {
                    const imageSrc = image?.url || (image?.file instanceof File ? URL.createObjectURL(image.file) : null);
                    return (
                      <div key={image?.id || index} className='aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity'>
                        {imageSrc ? (
                      <img
                            src={imageSrc}
                            alt={image?.name || `Gallery ${index + 1}`}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className='w-full h-full flex items-center justify-center bg-gray-100' style={{ display: 'none' }}>
                      <span className='text-gray-400 text-xs'>Invalid</span>
                    </div>
                  </div>
                    );
                  })}
              </div>
                {allImages.length > 6 && (
                <p className='text-xs text-gray-500 mt-2 text-center'>
                    +{allImages.length - 6} more images
                </p>
              )}
            </div>
            ) : null;
          })()}
        </div>
      </div>

        {/* Upload Progress Overlay */}
        {showUploadOverlay && (
          <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-500 ease-out animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isAddMode ? '🚀 Creating Your Listing' : '✏️ Updating Your Listing'}
                </h3>
                <p className="text-gray-300 text-base font-medium">
                  {uploadStatus || 'Uploading your listing...'}
                </p>
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-sm text-yellow-400 font-semibold">
                    ⚠️ Please do not close or refresh this tab
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    {isAddMode 
                      ? 'Your listing is being uploaded. Any interruption may cause data loss and require you to start over.'
                      : 'Your changes are being saved. Any interruption may cause data loss.'}
                  </p>
                </div>
                {/* File count info */}
                <div className="mt-3 text-xs text-gray-400 bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <div className="flex items-center justify-center space-x-4">
                    {(() => {
                      // Count total images from all albums
                      let totalImages = 0;
                      if (formData.media?.albums) {
                        formData.media.albums.forEach(album => {
                          if (album?.images) {
                            totalImages += album.images.length;
                          }
                        });
                      }
                      return totalImages > 0 ? (
                        <span>📸 {totalImages} image{totalImages !== 1 ? 's' : ''} in {formData.media.albums.length} album{formData.media.albums.length !== 1 ? 's' : ''}</span>
                      ) : null;
                    })()}
                    {formData.media?.video && (
                      <span>🎥 Video</span>
                    )}
                    {formData.media?.youtubeUrl && (
                      <span>📺 YouTube</span>
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
                <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-3">
                  <span>Upload Progress</span>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner border border-gray-700">
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
                <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 20 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    uploadProgress >= 20 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {uploadProgress >= 20 ? '✓' : '1'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-200">📁 Preparing Files</div>
                    <div className="text-xs text-gray-400">Validating and organizing your uploads</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 50 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    uploadProgress >= 50 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {uploadProgress >= 50 ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-200">☁️ Uploading to Cloud</div>
                    <div className="text-xs text-gray-400">Securely transferring files to our servers</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 80 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    uploadProgress >= 80 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {uploadProgress >= 80 ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-200">⚙️ Processing Data</div>
                    <div className="text-xs text-gray-400">Optimizing images and preparing content</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-4 transition-all duration-300 ${uploadProgress >= 100 ? 'text-green-400 scale-105' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    uploadProgress >= 100 ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {uploadProgress >= 100 ? '✓' : '4'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-200">💾 Saving to Database</div>
                    <div className="text-xs text-gray-400">Finalizing your listing and updating counters</div>
                  </div>
                </div>
              </div>

              {/* Success Animation */}
              {uploadProgress === 100 && (
                <div className="mt-8 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-green-600/30 rounded-full animate-ping"></div>
                    <div className="relative w-16 h-16 bg-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-500/50">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-green-400 mb-2">
                    🎉 {isAddMode ? 'Listing Created Successfully!' : 'Listing Updated Successfully!'}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {isAddMode ? 'Your new listing is now live and ready to be discovered!' : 'Your changes have been saved and are now live!'}
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Redirecting to your developments...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {uploadProgress < 100 && uploadProgress > 0 && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-400">
                    If you encounter any issues, please check your internet connection and try again.
                  </p>
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

      {/* Resume Draft Modal */}
      {showResumeModal && incompleteDrafts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Incomplete Draft Found</h2>
            <p className="text-gray-600 mb-4">
              You have {incompleteDrafts.length} incomplete draft{incompleteDrafts.length > 1 ? 's' : ''} from a previous session.
            </p>
            
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {incompleteDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleResumeDraft(draft.id)}
                >
                  <h3 className="font-semibold text-gray-900">
                    {draft.title || 'Untitled Listing'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Started {new Date(draft.created_at).toLocaleDateString()} at{' '}
                    {new Date(draft.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleStartFresh}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Start Fresh
              </button>
              {incompleteDrafts.length === 1 && (
                <button
                  onClick={() => handleResumeDraft(incompleteDrafts[0].id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Resume Draft
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyManagement