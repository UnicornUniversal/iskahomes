// TypeScript interfaces for Development form data structure

export interface Coordinates {
  latitude: string;
  longitude: string;
}

export interface Location {
  country: string;
  state: string;
  city: string;
  town: string;
  fullAddress: string;
  coordinates: Coordinates;
  additionalInformation: string;
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category?: string;
  uploaded_at?: string;
}

export interface Media {
  banner?: FileUpload;
  video?: FileUpload;
  youtubeUrl: string;
  virtualTourUrl: string;
  mediaFiles: FileUpload[];
}

export interface Files {
  documents: FileUpload[];
  presentations: FileUpload[];
  spreadsheets: FileUpload[];
  images: FileUpload[];
  other: FileUpload[];
}

export interface PropertyPurpose {
  id: string;
  name: string;
  description?: string;
}

export interface PropertyType {
  id: string;
  name: string;
  description?: string;
}

export interface PropertyCategory {
  id: string;
  name: string;
  description?: string;
}

export interface UnitType {
  id: string;
  name: string;
  description?: string;
  source: 'database' | 'inbuilt' | 'custom';
}

export interface PropertyAmenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  property_type: string[];
  source?: string;
}

export interface GeneralAmenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  source: 'general';
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface Metadata {
  total_units?: number;
  price_range?: PriceRange;
  completion_date?: string;
  construction_status?: string;
  units_available?: number;
  units_sold?: number;
}

export interface SEO {
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  slug: string;
}

// Main Development interface
export interface Development {
  // Core identifiers
  id?: string;
  slug: string;
  developer_id: string;
  created_at?: string;
  updated_at?: string;

  // Description section
  title: string;
  description: string;
  size: string;
  status: 'Under Construction' | 'Completed' | 'Planning' | 'On Hold';
  number_of_buildings: number;

  // Categories section
  purposes: PropertyPurpose[];
  types: PropertyType[];
  categories: PropertyCategory[];
  unit_types: {
    database: UnitType[];
    inbuilt: UnitType[];
    custom: UnitType[];
  };

  // Location section
  location: Location;

  // Amenities section
  amenities: {
    database: PropertyAmenity[];
    general: GeneralAmenity[];
    custom: string[];
  };

  // Media section
  media: Media;

  // Additional files section
  additional_files: FileUpload[];

  // Additional metadata
  metadata?: Metadata;

  // SEO
  seo?: SEO;

  // System fields
  development_status?: 'active' | 'inactive' | 'draft';
  featured?: boolean;
  verified?: boolean;
  views?: number;
  favorites?: number;
  inquiries?: number;
}

// Form data interface (what the form actually collects)
export interface DevelopmentFormData {
  // Description section
  title: string;
  description: string;
  size: string;
  status: string;
  number_of_buildings: number;

  // Categories section
  purposes: string[]; // Array of purpose IDs
  types: string[]; // Array of type IDs
  categories: string[]; // Array of category IDs
  unit_types: {
    database: UnitType[];
    inbuilt: UnitType[];
    custom: UnitType[];
  };

  // Location section
  location: Location;

  // Amenities section
  amenities: {
    database: string[]; // Array of database amenity IDs
    general: string[]; // Array of general amenity IDs
    custom: string[]; // Array of custom amenity names
  };

  // Media section
  media: Media;

  // Additional files section
  additional_files: FileUpload[];
}

// API request/response interfaces
export interface CreateDevelopmentRequest {
  title: string;
  description: string;
  size: string;
  status: string;
  number_of_buildings: number;
  purposes: string[];
  types: string[];
  categories: string[];
  unit_types: {
    database: UnitType[];
    inbuilt: UnitType[];
    custom: UnitType[];
  };
  location: Location;
  amenities: {
    database: string[];
    general: string[];
    custom: string[];
  };
  media: Media;
  files: Files;
  metadata?: Metadata;
}

export interface CreateDevelopmentResponse {
  success: boolean;
  data?: Development;
  error?: string;
}

export interface UpdateDevelopmentRequest extends Partial<CreateDevelopmentRequest> {
  id: string;
}

export interface UpdateDevelopmentResponse {
  success: boolean;
  data?: Development;
  error?: string;
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Component props interfaces
export interface DevelopmentFormProps {
  formData: DevelopmentFormData;
  updateFormData: (data: Partial<DevelopmentFormData>) => void;
  isEditMode: boolean;
}

export interface DevelopmentDescriptionProps extends DevelopmentFormProps {}
export interface DevelopmentCategoriesProps extends DevelopmentFormProps {}
export interface DevelopmentLocationProps extends DevelopmentFormProps {}
export interface DevelopmentAmenitiesProps extends DevelopmentFormProps {}
export interface DevelopmentMediaProps extends DevelopmentFormProps {}
export interface DevelopmentFilesProps extends DevelopmentFormProps {}

// Utility types
export type DevelopmentStatus = 'Under Construction' | 'Completed' | 'Planning' | 'On Hold';
export type SystemStatus = 'active' | 'inactive' | 'draft';
export type FileCategory = 'documents' | 'presentations' | 'spreadsheets' | 'images' | 'other';
