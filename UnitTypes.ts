// Unit Types and Interfaces
export interface Unit {
  id: string
  slug: string
  development_id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  property_type: 'houses' | 'apartments' | 'offices' | 'warehouses' | 'event_centers' | 'land'
  unit_type: string // Specific type within property_type
  location: {
    city: string
    neighborhood: string
    gps_coordinates: {
      latitude: string
      longitude: string
    }
    address: string
  }
  size: {
    bedrooms?: number
    bathrooms?: number
    living_space: string // sq ft/sq m
    total_area?: string
    ceiling_height?: string // for warehouses
    capacity?: number // for offices/event centers
  }
  features: {
    kitchen_type?: string
    balcony?: boolean
    garden?: boolean
    security?: boolean
    gated_community?: boolean
    internet?: boolean
    parking?: boolean
    conference_rooms?: boolean
    washrooms?: boolean
    loading_docks?: boolean
    forklift_access?: boolean
    power_backup?: boolean
    water_supply?: boolean
    stage?: boolean
    lighting?: boolean
    sound_system?: boolean
    chairs_tables?: boolean
    catering_services?: boolean
    road_access?: boolean
    proximity_to_utilities?: boolean
  }
  utilities: {
    water_supply: boolean
    electricity: boolean
    internet: boolean
    drainage?: boolean
  }
  status: 'furnished' | 'semi-furnished' | 'unfurnished' | 'available' | 'occupied'
  lease_terms: {
    rent_price: number
    deposit: number
    duration: string // monthly/annual/hourly/daily
    flexible_terms?: boolean
    cancellation_policy?: string
    security_requirements?: string
  }
  documentation?: {
    title_deed?: string
    land_certificate?: string
    lease_status?: 'lease' | 'freehold'
  }
  topography?: 'flat' | 'hilly' | 'waterlogged' | 'mixed'
  media: {
    images: Array<{
      id: string
      url: string
      alt: string
      type: 'interior' | 'exterior' | 'amenities' | 'location'
    }>
    videos: Array<{
      id: string
      url: string
      title: string
      type: 'tour' | 'promotional' | 'amenities'
    }>
    virtual_tour_url?: string
    model_3d?: {
      id: string
      url: string
      format: 'gltf' | 'glb' | 'obj' | 'fbx'
      preview_image: string
    }
  }
  amenities: {
    database: Array<{
      id: string
      name: string
      category: string
    }>
    general: string[]
    custom: string[]
  }
  owner_info: {
    name: string
    phone: string
    email: string
    type: 'owner' | 'agent'
  }
  pricing: {
    rent_price: number
    sale_price?: number
    deposit: number
    currency: 'GHS' | 'USD'
    negotiable: boolean
  }
  availability: {
    status: 'available' | 'occupied' | 'maintenance' | 'reserved'
    available_from?: string
    booking_rules?: string
  }
  unit_status: 'active' | 'inactive' | 'draft'
  views: number
  favorites: number
  inquiries: number
}

export interface UnitFormData {
  title: string
  description: string
  property_type: 'houses' | 'apartments' | 'offices' | 'warehouses' | 'event_centers' | 'land'
  unit_type: string
  development_id: string
  location: {
    city: string
    neighborhood: string
    gps_coordinates: {
      latitude: string
      longitude: string
    }
    address: string
  }
  size: {
    bedrooms?: number
    bathrooms?: number
    living_space: string
    total_area?: string
    ceiling_height?: string
    capacity?: number
  }
  features: {
    kitchen_type?: string
    balcony?: boolean
    garden?: boolean
    security?: boolean
    gated_community?: boolean
    internet?: boolean
    parking?: boolean
    conference_rooms?: boolean
    washrooms?: boolean
    loading_docks?: boolean
    forklift_access?: boolean
    power_backup?: boolean
    water_supply?: boolean
    stage?: boolean
    lighting?: boolean
    sound_system?: boolean
    chairs_tables?: boolean
    catering_services?: boolean
    road_access?: boolean
    proximity_to_utilities?: boolean
  }
  utilities: {
    water_supply: boolean
    electricity: boolean
    internet: boolean
    drainage?: boolean
  }
  status: 'furnished' | 'semi-furnished' | 'unfurnished' | 'available' | 'occupied'
  lease_terms: {
    rent_price: number
    deposit: number
    duration: string
    flexible_terms?: boolean
    cancellation_policy?: string
    security_requirements?: string
  }
  documentation?: {
    title_deed?: string
    land_certificate?: string
    lease_status?: 'lease' | 'freehold'
  }
  topography?: 'flat' | 'hilly' | 'waterlogged' | 'mixed'
  media: {
    images: File[]
    videos: File[]
    virtual_tour_url: string
    model_3d: File | null
  }
  amenities: {
    database: Array<{
      id: string
      name: string
      category: string
    }>
    general: string[]
    custom: string[]
  }
  owner_info: {
    name: string
    phone: string
    email: string
    type: 'owner' | 'agent'
  }
  pricing: {
    rent_price: number
    sale_price?: number
    deposit: number
    currency: 'GHS' | 'USD'
    negotiable: boolean
  }
  availability: {
    status: 'available' | 'occupied' | 'maintenance' | 'reserved'
    available_from?: string
    booking_rules?: string
  }
  unit_status: 'active' | 'inactive' | 'draft'
}

export interface CreateUnitRequest {
  development_id: string
  title: string
  description: string
  property_type: 'houses' | 'apartments' | 'offices' | 'warehouses' | 'event_centers' | 'land'
  unit_type: string
  city: string
  neighborhood: string
  latitude: string
  longitude: string
  address: string
  bedrooms?: number
  bathrooms?: number
  living_space: string
  total_area?: string
  ceiling_height?: string
  capacity?: number
  kitchen_type?: string
  balcony?: boolean
  garden?: boolean
  security?: boolean
  gated_community?: boolean
  internet?: boolean
  parking?: boolean
  conference_rooms?: boolean
  washrooms?: boolean
  loading_docks?: boolean
  forklift_access?: boolean
  power_backup?: boolean
  water_supply: boolean
  electricity: boolean
  drainage?: boolean
  stage?: boolean
  lighting?: boolean
  sound_system?: boolean
  chairs_tables?: boolean
  catering_services?: boolean
  road_access?: boolean
  proximity_to_utilities?: boolean
  status: 'furnished' | 'semi-furnished' | 'unfurnished' | 'available' | 'occupied'
  rent_price: number
  sale_price?: number
  deposit: number
  currency: 'GHS' | 'USD'
  negotiable: boolean
  duration: string
  flexible_terms?: boolean
  cancellation_policy?: string
  security_requirements?: string
  title_deed?: string
  land_certificate?: string
  lease_status?: 'lease' | 'freehold'
  topography?: 'flat' | 'hilly' | 'waterlogged' | 'mixed'
  virtual_tour_url?: string
  owner_name: string
  owner_phone: string
  owner_email: string
  owner_type: 'owner' | 'agent'
  availability_status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  available_from?: string
  booking_rules?: string
  amenities: {
    database: Array<{
      id: string
      name: string
      category: string
    }>
    general: string[]
    custom: string[]
  }
  images: Array<{
    url: string
    alt: string
    type: 'interior' | 'exterior' | 'amenities' | 'location'
  }>
  videos: Array<{
    url: string
    title: string
    type: 'tour' | 'promotional' | 'amenities'
  }>
  model_3d?: {
    url: string
    format: 'gltf' | 'glb' | 'obj' | 'fbx'
    preview_image: string
  }
  unit_status: 'active' | 'inactive' | 'draft'
}

export interface Development {
  id: string
  slug: string
  title: string
  developer_id: string
  status: string
}
