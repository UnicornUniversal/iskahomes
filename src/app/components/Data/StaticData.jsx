import {
  // FontAwesome Icons
  FaBed,
  FaBath,
  FaLayerGroup,
  FaCouch,
  FaCalendarAlt,
  FaHome,
  FaUtensils,
  FaCheckCircle,
  FaBolt,
  FaBuilding,
  FaPaintBrush,
  FaUmbrellaBeach,
  FaDoorOpen,
  FaRestroom,
  FaWarehouse,
  FaIndustry,
  FaTruckLoading,
  FaRoad,
  FaArrowUp,
  FaRulerCombined,
  FaMountain,
  FaWater,
  FaExclamationTriangle,
  FaMicrophone,
} from 'react-icons/fa';
import {
  // Material Design Icons
  MdMeetingRoom,
  MdBusinessCenter,
  MdEvent,
  MdHeight,
  MdRoofing,
  MdLightbulb,
  MdAcUnit,
  MdLocalParking,
  MdKitchen,
  MdRestaurant,
  MdTerrain,
} from 'react-icons/md';
import {
  // Feather Icons
  FiLayers,
  FiGrid,
  FiCoffee,
  FiTrendingUp,
} from 'react-icons/fi';

// Property Specification Data Structure with Icons
export const propertySpecificationsData = {
  // Houses & Apartments Specifications
  housesApartments: {
    id: '16f02534-40e4-445f-94f2-2a01531b8503',
    name: 'Apartments & Houses',
    fields: [
      {
        key: 'bedrooms',
        label: 'Bedrooms',
        icon: FaBed,
        type: 'number',
        required: true,
        placeholder: 'Number of bedrooms',
        min: 0,
      },
      {
        key: 'bathrooms',
        label: 'Bathrooms',
        icon: FaBath,
        type: 'number',
        required: true,
        placeholder: 'Number of bathrooms',
        min: 0,
        step: 0.5,
      },
      {
        key: 'floor_level',
        label: 'Floor Level',
        icon: FaLayerGroup,
        type: 'number',
        required: false,
        placeholder: 'Floor number',
        min: 0,
      },
      {
        key: 'furnishing',
        label: 'Furnishing Status',
        icon: FaCouch,
        type: 'select',
        required: false,
        options: [
          { value: 'furnished', label: 'Furnished' },
          { value: 'semi-furnished', label: 'Semi-Furnished' },
          { value: 'unfurnished', label: 'Unfurnished' },
        ],
      },
      {
        key: 'property_age',
        label: 'Property Age',
        icon: FaCalendarAlt,
        type: 'select',
        required: false,
        options: [
          { value: 'new', label: 'New Construction' },
          { value: '1-5', label: '1-5 Years' },
          { value: '6-10', label: '6-10 Years' },
          { value: '11-20', label: '11-20 Years' },
          { value: '20+', label: '20+ Years' },
        ],
      },
      {
        key: 'living_rooms',
        label: 'Living Rooms',
        icon: FaHome,
        type: 'number',
        required: true,
        placeholder: 'Number of living rooms',
        min: 0,
      },
      {
        key: 'kitchen_type',
        label: 'Kitchen Type',
        icon: FaUtensils,
        type: 'select',
        required: true,
        options: [
          { value: 'open_kitchen', label: 'Open Kitchen' },
          { value: 'closed_kitchen', label: 'Closed Kitchen' },
          { value: 'kitchenette', label: 'Kitchenette' },
          { value: 'no_kitchen', label: 'No Kitchen' },
        ],
      },
      {
        key: 'property_condition',
        label: 'Property Condition',
        icon: FaCheckCircle,
        type: 'select',
        required: true,
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'needs_renovation', label: 'Needs Renovation' },
        ],
      },
      {
        key: 'shared_electricity_meter',
        label: 'Shared Electricity Meter',
        icon: FaBolt,
        type: 'select',
        required: true,
        options: [
          { value: 'shared', label: 'Shared Meter' },
          { value: 'individual', label: 'Individual Meter' },
          { value: 'prepaid', label: 'Prepaid Meter' },
        ],
      },
      {
        key: 'compound_type',
        label: 'Compound Type',
        icon: FaBuilding,
        type: 'select',
        required: true,
        options: [
          { value: 'gated_community', label: 'Gated Community' },
          { value: 'open_compound', label: 'Open Compound' },
          { value: 'shared_compound', label: 'Shared Compound' },
          { value: 'private_compound', label: 'Private Compound' },
        ],
      },
      {
        key: 'building_style',
        label: 'Building Style',
        icon: FaPaintBrush,
        type: 'select',
        required: true,
        options: [
          { value: 'modern', label: 'Modern' },
          { value: 'traditional', label: 'Traditional' },
          { value: 'colonial', label: 'Colonial' },
          { value: 'contemporary', label: 'Contemporary' },
          { value: 'mediterranean', label: 'Mediterranean' },
          { value: 'minimalist', label: 'Minimalist' },
          { value: 'villa', label: 'Villa Style' },
        ],
      },
      {
        key: 'number_of_balconies',
        label: 'Number of Balconies',
        icon: FaUmbrellaBeach,
        type: 'number',
        required: false,
        placeholder: 'Number of balconies',
        min: 0,
      },
      {
        key: 'guest_room',
        label: 'Guest Room',
        icon: FaDoorOpen,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'guest_washroom',
        label: 'Guest Washroom',
        icon: FaRestroom,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  // Offices Specifications
  offices: {
    id: 'fc7d2abc-e19e-40bc-942b-5c1b1561565c',
    name: 'Offices',
    fields: [
      {
        key: 'floor_number',
        label: 'Floor Number',
        icon: FaLayerGroup,
        type: 'number',
        required: false,
        placeholder: 'Floor number',
      },
      {
        key: 'parking_space',
        label: 'Parking Space',
        icon: MdLocalParking,
        type: 'number',
        required: false,
        placeholder: 'Number of parking spaces',
        min: 0,
      },
      {
        key: 'available_units',
        label: 'Available Units',
        icon: MdBusinessCenter,
        type: 'select',
        required: true,
        options: [
          { value: 'full_floor', label: 'Full Floor' },
          { value: 'partial_units', label: 'Partial Units' },
          { value: 'coworking_space', label: 'Co-working Space' },
        ],
      },
      {
        key: 'furnishing_status',
        label: 'Furnishing Status',
        icon: FaCouch,
        type: 'select',
        required: true,
        options: [
          { value: 'fully_furnished', label: 'Fully Furnished' },
          { value: 'semi_furnished', label: 'Semi Furnished' },
          { value: 'unfurnished', label: 'Unfurnished' },
        ],
      },
      {
        key: 'reception_area',
        label: 'Reception Area',
        icon: MdMeetingRoom,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'meeting_rooms',
        label: 'Meeting Rooms',
        icon: MdMeetingRoom,
        type: 'number',
        required: false,
        placeholder: 'Number of meeting rooms',
        min: 0,
      },
      {
        key: 'conference_rooms',
        label: 'Conference Rooms',
        icon: MdBusinessCenter,
        type: 'number',
        required: false,
        placeholder: 'Number of conference rooms',
        min: 0,
      },
      {
        key: 'pantry_cafeteria',
        label: 'Pantry/Cafeteria',
        icon: FiCoffee,
        type: 'select',
        required: false,
        options: [
          { value: 'pantry', label: 'Pantry' },
          { value: 'cafeteria', label: 'Cafeteria' },
          { value: 'both', label: 'Both' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'washrooms',
        label: 'Washrooms',
        icon: FaRestroom,
        type: 'number',
        required: false,
        placeholder: 'Number of washrooms',
        min: 0,
      },
    ],
  },

  // Warehouses Specifications
  warehouses: {
    id: '0f2df1a6-86ad-4690-82f6-e9358b973fd7',
    name: 'Warehouses',
    fields: [
      {
        key: 'warehouse_type',
        label: 'Warehouse Type',
        icon: FaWarehouse,
        type: 'select',
        required: true,
        options: [
          { value: 'dry_storage', label: 'Dry Storage' },
          { value: 'cold_storage', label: 'Cold Storage' },
          { value: 'bonded', label: 'Bonded Warehouse' },
          { value: 'distribution', label: 'Distribution Center' },
          { value: 'open_yard', label: 'Open Yard' },
        ],
      },
      {
        key: 'construction_type',
        label: 'Construction Type',
        icon: FaIndustry,
        type: 'select',
        required: true,
        options: [
          { value: 'rcc_peb', label: 'RCC + Pre-Engineered Building (PEB)' },
          { value: 'rcc_only', label: 'RCC Only' },
          { value: 'peb_only', label: 'PEB Only' },
          { value: 'steel_frame', label: 'Steel Frame' },
        ],
      },
      {
        key: 'clear_height',
        label: 'Clear Height (ft)',
        icon: MdHeight,
        type: 'number',
        required: true,
        placeholder: 'Clear height in feet',
        min: 0,
        step: 0.1,
      },
      {
        key: 'flooring_type',
        label: 'Flooring Type',
        icon: FiLayers,
        type: 'select',
        required: true,
        options: [
          { value: 'tremix', label: 'Tremix' },
          { value: 'vdf_industrial', label: 'VDF Industrial Flooring' },
          { value: 'concrete', label: 'Concrete' },
          { value: 'epoxy', label: 'Epoxy Coated' },
        ],
      },
      {
        key: 'floor_load_capacity',
        label: 'Floor Load Capacity (tons/sq m)',
        icon: FiTrendingUp,
        type: 'number',
        required: true,
        placeholder: 'Floor load capacity',
        min: 0,
        step: 0.1,
      },
      {
        key: 'column_grid',
        label: 'Column Grid (m x m)',
        icon: FiGrid,
        type: 'text',
        required: false,
        placeholder: 'e.g., 10 x 20',
      },
      {
        key: 'roofing',
        label: 'Roofing',
        icon: MdRoofing,
        type: 'select',
        required: true,
        options: [
          { value: 'galvalume_insulated', label: 'Galvalume sheet with insulation' },
          { value: 'galvalume', label: 'Galvalume sheet' },
          { value: 'metal_sheet', label: 'Metal sheet' },
          { value: 'concrete', label: 'Concrete' },
        ],
      },
      {
        key: 'ventilation',
        label: 'Ventilation',
        icon: MdAcUnit,
        type: 'select',
        required: true,
        options: [
          { value: 'turbo_ridge_exhaust', label: 'Turbo ventilators + Ridge Vents + Exhaust Fans' },
          { value: 'natural', label: 'Natural ventilation' },
          { value: 'mechanical', label: 'Mechanical ventilation' },
          { value: 'mixed', label: 'Mixed ventilation' },
        ],
      },
      {
        key: 'natural_lighting',
        label: 'Natural Lighting',
        icon: MdLightbulb,
        type: 'select',
        required: true,
        options: [
          { value: 'polycarbonate', label: 'Polycarbonate sheets for daylight' },
          { value: 'skylights', label: 'Skylights' },
          { value: 'windows', label: 'Windows' },
          { value: 'minimal', label: 'Minimal natural lighting' },
        ],
      },
      {
        key: 'dock_doors',
        label: 'Dock Doors',
        icon: FaTruckLoading,
        type: 'number',
        required: true,
        placeholder: 'Number of loading bays',
        min: 0,
      },
      {
        key: 'dock_levelers',
        label: 'Dock Levelers',
        icon: FaArrowUp,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'ramps',
        label: 'Ramps',
        icon: FaRoad,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes (for forklift/container access)' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  // Event Centers Specifications
  eventCenters: {
    id: '40ae5053-1143-4c74-8f29-8a3e467e9b43',
    name: 'Event Centers',
    fields: [
      {
        key: 'availability',
        label: 'Availability',
        icon: FaCalendarAlt,
        type: 'select',
        required: true,
        options: [
          { value: 'available', label: 'Available' },
          { value: 'booked', label: 'Booked' },
          { value: 'maintenance', label: 'Under Maintenance' },
        ],
      },
      {
        key: 'main_hall_capacity',
        label: 'Main Hall Capacity',
        icon: MdEvent,
        type: 'number',
        required: true,
        placeholder: 'Main hall capacity',
        min: 0,
      },
      {
        key: 'number_of_halls',
        label: 'Number of Halls',
        icon: MdEvent,
        type: 'number',
        required: true,
        placeholder: 'Number of halls',
        min: 0,
      },
      {
        key: 'stage_area',
        label: 'Stage Area',
        icon: FaMicrophone,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'pre_function_area',
        label: 'Pre Function Area',
        icon: MdMeetingRoom,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'lounge_reception_area',
        label: 'Lounge/Reception Area',
        icon: MdRestaurant,
        type: 'select',
        required: false,
        options: [
          { value: 'lounge', label: 'Lounge' },
          { value: 'reception', label: 'Reception' },
          { value: 'both', label: 'Both' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'dining_area',
        label: 'Dining Area',
        icon: MdRestaurant,
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'kitchen',
        label: 'Kitchen',
        icon: MdKitchen,
        type: 'select',
        required: true,
        options: [
          { value: 'service_kitchen', label: 'Service Kitchen' },
          { value: 'fully_equipped', label: 'Fully Equipped' },
          { value: 'bare', label: 'Bare' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'washrooms',
        label: 'Washrooms',
        icon: FaRestroom,
        type: 'number',
        required: false,
        placeholder: 'Number of washrooms',
        min: 0,
      },
    ],
  },

  // Land Specifications
  land: {
    id: 'a389610d-1d0a-440b-a3c4-91f392ebd27c',
    name: 'Land',
    fields: [
      {
        key: 'plot_dimensions',
        label: 'Plot Dimensions',
        icon: FaRulerCombined,
        type: 'text',
        required: false,
        placeholder: 'e.g., 100 ft x 100 ft',
      },
      {
        key: 'plot_shape',
        label: 'Plot Shape',
        icon: FiGrid,
        type: 'select',
        required: true,
        options: [
          { value: 'square', label: 'Square' },
          { value: 'rectangular', label: 'Rectangular' },
          { value: 'irregular', label: 'Irregular' },
        ],
      },
      {
        key: 'topography',
        label: 'Topography',
        icon: FaMountain,
        type: 'select',
        required: true,
        options: [
          { value: 'flat', label: 'Flat' },
          { value: 'sloped', label: 'Sloped' },
          { value: 'undulating', label: 'Undulating' },
          { value: 'steep', label: 'Steep' },
        ],
      },
      {
        key: 'soil_type',
        label: 'Soil Type',
        icon: MdTerrain,
        type: 'select',
        required: true,
        options: [
          { value: 'clay', label: 'Clay' },
          { value: 'loam', label: 'Loam' },
          { value: 'laterite', label: 'Laterite' },
          { value: 'sandy', label: 'Sandy' },
          { value: 'rocky', label: 'Rocky' },
        ],
      },
      {
        key: 'drainage_condition',
        label: 'Drainage Condition',
        icon: FaWater,
        type: 'select',
        required: true,
        options: [
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'poor', label: 'Poor' },
        ],
      },
      {
        key: 'flood_risk',
        label: 'Flood Risk',
        icon: FaExclamationTriangle,
        type: 'select',
        required: true,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
      {
        key: 'elevation',
        label: 'Elevation (meters above sea level)',
        icon: MdHeight,
        type: 'number',
        required: false,
        placeholder: 'Height above sea level',
        min: 0,
        step: 0.1,
      },
    ],
  },
};

// Helper function to get specification data by property type ID
export const getSpecificationDataByTypeId = (typeId) => {
  const allSpecs = Object.values(propertySpecificationsData);
  return allSpecs.find(spec => spec.id === typeId) || null;
};

// Helper function to get specification data by property type name
export const getSpecificationDataByTypeName = (typeName) => {
  const normalizedName = typeName?.toLowerCase().trim();
  const allSpecs = Object.values(propertySpecificationsData);
  
  if (normalizedName?.includes('land')) {
    return propertySpecificationsData.land;
  } else if (normalizedName?.includes('apartment') || normalizedName?.includes('house')) {
    return propertySpecificationsData.housesApartments;
  } else if (normalizedName?.includes('office')) {
    return propertySpecificationsData.offices;
  } else if (normalizedName?.includes('warehouse')) {
    return propertySpecificationsData.warehouses;
  } else if (normalizedName?.includes('event')) {
    return propertySpecificationsData.eventCenters;
  }
  
  return null;
};

// Helper function to get field data by key
export const getFieldDataByKey = (typeId, fieldKey) => {
  const specData = getSpecificationDataByTypeId(typeId);
  if (!specData) return null;
  
  return specData.fields.find(field => field.key === fieldKey) || null;
};

// Dynamic image size configurations for listing cards
// Professional real estate platform sizing with consistent, clean dimensions
// All cards maintain minimum 300px width on medium devices and above
// Aspect ratio maintained at approximately 4:3 for optimal property image display
export const dynamicImages = [
  // Standard sizes - 3 per row on desktop, 2 on tablet, 1 on mobile
  {
    id: 1,
    imageClasses: 'w-full h-[300px] md:w-[320px] md:h-[300px] lg:w-[380px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 2,
    imageClasses: 'w-full h-[300px] md:w-[340px] md:h-[300px] lg:w-[400px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 3,
    imageClasses: 'w-full h-[300px] md:w-[360px] md:h-[300px] lg:w-[420px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  // Medium sizes - 2 per row on desktop, 1 on tablet
  {
    id: 4,
    imageClasses: 'w-full h-[300px] md:w-[400px] md:h-[300px] lg:w-[480px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 5,
    imageClasses: 'w-full h-[300px] md:w-[420px] md:h-[300px] lg:w-[500px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 6,
    imageClasses: 'w-full h-[300px] md:w-[440px] md:h-[300px] lg:w-[520px] lg:h-[400px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  // Large sizes - 1 per row (featured properties)
  {
    id: 7,
    imageClasses: 'w-full h-[320px] md:w-[500px] md:h-[375px] lg:w-[600px] lg:h-[450px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 8,
    imageClasses: 'w-full h-[320px] md:w-[520px] md:h-[390px] lg:w-[640px] lg:h-[480px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  // Compact sizes - 4 per row on desktop, 3 on tablet
  {
    id: 9,
    imageClasses: 'w-full h-[220px] md:w-[300px] md:h-[300px] lg:w-[360px] lg:h-[270px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
  {
    id: 10,
    imageClasses: 'w-full h-[220px] md:w-[320px] md:h-[240px] lg:w-[380px] lg:h-[285px]',
    containerClasses: 'w-full md:min-w-[300px]'
  },
]




export const listings=[
  {
    "id": "bb77d569-2a5d-4ae9-a549-5bc6ce7735d0",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "5 bedroom apartment at peter's residence",
    "description": "I love places",
    "size": "800",
    "status": "Taken",
    "development_id": "9527061c-c690-4a9a-bdcd-cf3fcf52f142",
    "purposes": [
      "e1d5bacd-319c-48e4-a00e-f81d02198bb5"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "49a6811f-5378-40c9-8e8b-206a62d4bd94"
      ]
    },
    "specifications": {
      "bedrooms": 4,
      "bathrooms": 4,
      "furnishing": "furnished",
      "guest_room": "yes",
      "floor_level": 4,
      "kitchen_type": "kitchenette",
      "living_rooms": 2,
      "property_age": "new",
      "compound_type": "gated_community",
      "building_style": "traditional",
      "guest_washroom": "yes",
      "property_condition": "good",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Accra",
    "town": "Kpeshie",
    "full_address": "Accra, Ghana",
    "latitude": "5.59552300",
    "longitude": "-0.13454160",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "cable-tv",
        "phone-lines",
        "gas-supply",
        "kitchen-appliances",
        "modern-kitchen",
        "balcony",
        "natural-light",
        "terrace"
      ],
      "database": []
    },
    "price": "1000000.00",
    "currency": "USD",
    "duration": "monthly",
    "price_type": "sale",
    "cancellation_policy": null,
    "is_negotiable": false,
    "security_requirements": null,
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_bb77d569-2a5d-4ae9-a549-5bc6ce7735d0",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762346496124_mxxm188qin.jpg",
              "name": "01-fast-track-for-beauty-1024x.jpg",
              "path": "iskaHomes/property-media/1762346496124_mxxm188qin.jpg",
              "size": 305942,
              "type": "image/jpeg",
              "filename": "1762346496124_mxxm188qin.jpg",
              "created_at": "2025-11-05T12:41:37.559Z",
              "originalName": "01-fast-track-for-beauty-1024x.jpg"
            },
            {
              "id": "img_2_bb77d569-2a5d-4ae9-a549-5bc6ce7735d0",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762346497327_q0192ul3hos.jpg",
              "name": "Zé Moreira - 3D Designer in Toronto, Ontario, Canada.jpg",
              "path": "iskaHomes/property-media/1762346497327_q0192ul3hos.jpg",
              "size": 32329,
              "type": "image/jpeg",
              "filename": "1762346497327_q0192ul3hos.jpg",
              "created_at": "2025-11-05T12:41:37.559Z",
              "originalName": "Zé Moreira - 3D Designer in Toronto, Ontario, Canada.jpg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "youtubeUrl": "",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 12:41:34.97681+00",
    "updated_at": "2025-11-22 08:00:33.393876+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "5-bedroom-apartment-at-peters-residence",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 1000000,
      "currency": "USD",
      "duration": "monthly",
      "time_span": "months",
      "price_type": "sale",
      "ideal_duration": "",
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 1000000,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 1000000
    },
    "global_price": {
      "price": 1000000,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 1000000
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 34,
    "total_leads": 11,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 2,
        "percentage": 100
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": "0.00"
      },
      "phone": {
        "total": 8,
        "percentage": "72.73"
      },
      "website": {
        "total": 0,
        "percentage": "0.00"
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 9,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 81.82,
        "direct_message": {
          "total": 9,
          "percentage": 100
        }
      },
      "appointment": {
        "total": 0,
        "percentage": "0.00"
      },
      "message_leads": {
        "total": 9,
        "percentage": 81.82
      },
      "direct_message": {
        "total": 9,
        "percentage": 81.82
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "505a7d99-4e68-42ba-ba56-269bd7594962",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "Porky",
    "description": "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.\n\nWhy do we use it?\nIt is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
    "size": "233",
    "status": "Available",
    "development_id": "5c0f4173-1921-494e-82de-fafd5e723e76",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "35bb40ab-eb02-4176-82af-d476abc04be4"
      ]
    },
    "specifications": {
      "bedrooms": 1,
      "bathrooms": 1,
      "furnishing": "semi-furnished",
      "guest_room": "yes",
      "floor_level": 1,
      "kitchen_type": "open_kitchen",
      "living_rooms": 1,
      "property_age": "new",
      "compound_type": "gated_community",
      "building_style": "mediterranean",
      "guest_washroom": "yes",
      "property_condition": "excellent",
      "number_of_balconies": 1,
      "shared_electricity_meter": "individual"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Accra",
    "town": "Ayawaso",
    "full_address": "Lagos Ave, Accra, Ghana",
    "latitude": "5.63049230",
    "longitude": "-0.17316690",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "electricity",
        "air-conditioning"
      ]
    },
    "price": "6000.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": "3 hours before 6pm",
    "is_negotiable": false,
    "security_requirements": "",
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_505a7d99-4e68-42ba-ba56-269bd7594962",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1763569756347_o7itpfags6n.jpg",
              "path": "iskaHomes/property-media/1763569756347_o7itpfags6n.jpg",
              "size": 8508663,
              "type": "image/jpeg",
              "filename": "1763569756347_o7itpfags6n.jpg",
              "created_at": "2025-11-19T16:29:21.684Z",
              "originalName": "sky-clouds.jpg"
            },
            {
              "id": "img_2_505a7d99-4e68-42ba-ba56-269bd7594962",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1763569758729_zcz1hb2fixa.jpg",
              "path": "iskaHomes/property-media/1763569758729_zcz1hb2fixa.jpg",
              "size": 6340577,
              "type": "image/jpeg",
              "filename": "1763569758729_zcz1hb2fixa.jpg",
              "created_at": "2025-11-19T16:29:21.684Z",
              "originalName": "sky-sunset.jpg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        },
        {
          "id": "album_album_3_1",
          "name": "Living Room",
          "images": [
            {
              "id": "img_1_505a7d99-4e68-42ba-ba56-269bd7594962",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1763569759856_m5ccgfyz5xn.jpg",
              "path": "iskaHomes/property-media/1763569759856_m5ccgfyz5xn.jpg",
              "size": 46729,
              "type": "image/jpeg",
              "filename": "1763569759856_m5ccgfyz5xn.jpg",
              "created_at": "2025-11-19T16:29:21.684Z",
              "originalName": "Packaging-Design-The-Forgotten-D.jpg"
            },
            {
              "id": "img_2_505a7d99-4e68-42ba-ba56-269bd7594962",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1763569760128_a3gfi17qk5u.jpg",
              "path": "iskaHomes/property-media/1763569760128_a3gfi17qk5u.jpg",
              "size": 162901,
              "type": "image/jpeg",
              "filename": "1763569760128_a3gfi17qk5u.jpg",
              "created_at": "2025-11-19T16:29:21.684Z",
              "originalName": "original-7afdd85c30c9bb794e65f19.jpg"
            },
            {
              "id": "img_3_505a7d99-4e68-42ba-ba56-269bd7594962",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1763569760530_58763g211n6.png",
              "path": "iskaHomes/property-media/1763569760530_58763g211n6.png",
              "size": 5902940,
              "type": "image/png",
              "filename": "1763569760530_58763g211n6.png",
              "created_at": "2025-11-19T16:29:21.684Z",
              "originalName": "texture.png"
            }
          ],
          "created_at": "2025-11-19T16:27:00.877Z"
        }
      ],
      "banner": null,
      "mediaFiles": [],
      "youtubeUrl": "https://www.youtube.com/watch?v=JPg1yn30LV4&pp=0gcJCQgKAYcqIYzv",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "draft",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-19 15:46:19.47242+00",
    "updated_at": "2025-11-19 18:08:59.167849+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": null,
    "3d_model": {
      "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/3d-models/1763569836563_wblbd07oekb.glb",
      "path": "iskaHomes/3d-models/1763569836563_wblbd07oekb.glb",
      "size": 23727648,
      "type": "application/octet-stream",
      "filename": "1763569836563_wblbd07oekb.glb",
      "originalName": "high rise.glb"
    },
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 6000,
      "currency": "GHS",
      "duration": "monthly",
      "time_span": "months",
      "price_type": "rent",
      "ideal_duration": 12,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 6000,
      "currency": "GHS",
      "exchange_rate": 1,
      "estimated_revenue": 72000
    },
    "global_price": {
      "price": 535.02,
      "currency": "USD",
      "exchange_rate": 0.08917,
      "estimated_revenue": 6420.24
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 0,
    "total_leads": 0,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {},
    "listing_leads_breakdown": {},
    "leads_breakdown": {}
  },
  {
    "id": "ad85a89e-6aa0-40d6-985c-36ee1c177c7c",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "Selasis's Residence",
    "description": "sOME NICE PLAXC",
    "size": "1",
    "status": "Rented Out",
    "development_id": "5c0f4173-1921-494e-82de-fafd5e723e76",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "49a6811f-5378-40c9-8e8b-206a62d4bd94"
      ]
    },
    "specifications": {
      "bedrooms": 1,
      "bathrooms": 1,
      "furnishing": "furnished",
      "guest_room": "yes",
      "floor_level": 1,
      "kitchen_type": "kitchenette",
      "living_rooms": 1,
      "property_age": "11-20",
      "compound_type": "gated_community",
      "building_style": "modern",
      "guest_washroom": "no",
      "property_condition": "fair",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "Ghana",
    "state": "Central Region",
    "city": "Kasoa",
    "town": null,
    "full_address": "Kasoa, Ghana",
    "latitude": "5.53441550",
    "longitude": "-0.42527370",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "terrace",
        "natural-light",
        "heating",
        "air-conditioning",
        "ceiling-fans",
        "kitchen"
      ],
      "database": []
    },
    "price": "6898.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": null,
    "is_negotiable": false,
    "security_requirements": null,
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_ad85a89e-6aa0-40d6-985c-36ee1c177c7c",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762345276495_gpyjoq2yw5k.webp",
              "name": "48224905_MTYwMC0xMjAwLTZiNzM5Nzc3Yzk.webp",
              "path": "iskaHomes/property-media/1762345276495_gpyjoq2yw5k.webp",
              "size": 76568,
              "type": "image/webp",
              "filename": "1762345276495_gpyjoq2yw5k.webp",
              "created_at": "2025-11-05T12:21:17.924Z",
              "originalName": "48224905_MTYwMC0xMjAwLTZiNzM5Nzc3Yzk.webp"
            },
            {
              "id": "img_2_ad85a89e-6aa0-40d6-985c-36ee1c177c7c",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762345277412_39s226jgtzq.webp",
              "name": "48224903_MTYwMC0xMjAwLTc1N2QzMDZjYjA.webp",
              "path": "iskaHomes/property-media/1762345277412_39s226jgtzq.webp",
              "size": 60172,
              "type": "image/webp",
              "filename": "1762345277412_39s226jgtzq.webp",
              "created_at": "2025-11-05T12:21:17.924Z",
              "originalName": "48224903_MTYwMC0xMjAwLTc1N2QzMDZjYjA.webp"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "youtubeUrl": "",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 12:21:15.36081+00",
    "updated_at": "2025-11-22 08:00:11.221496+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "selasiss-residence",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 6898,
      "currency": "GHS",
      "duration": "monthly",
      "time_span": "years",
      "price_type": "rent",
      "ideal_duration": 1,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 621.23,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 7454.81
    },
    "global_price": {
      "price": 621.23,
      "currency": "USD",
      "exchange_rate": 0.09006,
      "estimated_revenue": 7454.81
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 13,
    "total_leads": 0,
    "total_saved": 1,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 2,
        "percentage": 100
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "phone": {
        "total": 0,
        "percentage": 0
      },
      "website": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 0,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 0,
        "direct_message": {
          "total": 0,
          "percentage": 0
        }
      },
      "appointment": {
        "total": 0,
        "percentage": 0
      },
      "message_leads": {
        "total": 0,
        "percentage": 0
      },
      "direct_message": {
        "total": 0,
        "percentage": 0
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "2a5baac9-0507-488d-b9fc-9069b22be054",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "4 bedroom apartment for sale at Karls Homes",
    "description": "I got a nice whip and a solid bhaddie",
    "size": "499",
    "status": "Available",
    "development_id": "5c0f4173-1921-494e-82de-fafd5e723e76",
    "purposes": [
      "e1d5bacd-319c-48e4-a00e-f81d02198bb5"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "35bb40ab-eb02-4176-82af-d476abc04be4"
      ]
    },
    "specifications": {
      "bedrooms": 4,
      "bathrooms": 2,
      "furnishing": "furnished",
      "floor_level": 1,
      "kitchen_type": "closed_kitchen",
      "living_rooms": 1,
      "property_age": "new",
      "compound_type": "open_compound",
      "building_style": "traditional",
      "property_condition": "good",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Ga North Municipal",
    "town": "Pokuase",
    "full_address": "Pokuase, Ghana",
    "latitude": "5.70027300",
    "longitude": "-0.30207800",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "water-supply",
        "electricity",
        "gas-supply",
        "phone-lines",
        "internet",
        "drainage",
        "24-7-security",
        "cable-tv",
        "sewer-system",
        "cctv",
        "heating",
        "balcony",
        "natural-light",
        "kitchen-appliances",
        "kitchen",
        "terrace",
        "ceiling-fans",
        "dishwasher"
      ],
      "database": []
    },
    "price": "600000.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "sale",
    "cancellation_policy": null,
    "is_negotiable": false,
    "security_requirements": null,
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_2a5baac9-0507-488d-b9fc-9069b22be054",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344781449_qjp7ry9do0b.webp",
              "name": "48224905_MTYwMC0xMjAwLTZiNzM5Nzc3Yzk.webp",
              "path": "iskaHomes/property-media/1762344781449_qjp7ry9do0b.webp",
              "size": 76568,
              "type": "image/webp",
              "filename": "1762344781449_qjp7ry9do0b.webp",
              "created_at": "2025-11-05T12:13:03.453Z",
              "originalName": "48224905_MTYwMC0xMjAwLTZiNzM5Nzc3Yzk.webp"
            },
            {
              "id": "img_2_2a5baac9-0507-488d-b9fc-9069b22be054",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344782531_wpiyjgoktbp.webp",
              "name": "48224903_MTYwMC0xMjAwLTc1N2QzMDZjYjA.webp",
              "path": "iskaHomes/property-media/1762344782531_wpiyjgoktbp.webp",
              "size": 60172,
              "type": "image/webp",
              "filename": "1762344782531_wpiyjgoktbp.webp",
              "created_at": "2025-11-05T12:13:03.453Z",
              "originalName": "48224903_MTYwMC0xMjAwLTc1N2QzMDZjYjA.webp"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "youtubeUrl": "https://www.youtube.com/watch?v=jyHYYg-cbwU",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 12:13:00.074949+00",
    "updated_at": "2025-11-22 08:00:33.339905+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "4-bedroom-apartment-for-sale-at-karls-homes",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 600000,
      "currency": "GHS",
      "duration": "monthly",
      "time_span": "months",
      "price_type": "sale",
      "ideal_duration": "",
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 54036,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 54036
    },
    "global_price": {
      "price": 54036,
      "currency": "USD",
      "exchange_rate": 0.09006,
      "estimated_revenue": 54036
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 15,
    "total_leads": 1,
    "total_saved": 0,
    "total_appointments": 1,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 0,
        "percentage": 0
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": "0.00"
      },
      "phone": {
        "total": 0,
        "percentage": "0.00"
      },
      "website": {
        "total": 0,
        "percentage": "0.00"
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 0,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 0,
        "direct_message": {
          "total": 0,
          "percentage": 0
        }
      },
      "appointment": {
        "total": 1,
        "percentage": "100.00"
      },
      "message_leads": {
        "total": 0,
        "percentage": 0
      },
      "direct_message": {
        "total": 0,
        "percentage": 0
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "2 bedroom Apartment ",
    "description": "This is one of the best properties and how to make it look the best",
    "size": "2",
    "status": "Available",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [
        "Diddy Homes"
      ],
      "inbuilt": [
        "2 Bedroom",
        "Penthouse"
      ],
      "database": [
        "35bb40ab-eb02-4176-82af-d476abc04be4"
      ]
    },
    "specifications": {
      "kitchen": 2,
      "toilets": 2,
      "bedrooms": 2,
      "bathrooms": 2,
      "furnishing": "semi-furnished",
      "floor_level": 2,
      "living_rooms": 2,
      "property_age": "new",
      "property_size": 2
    },
    "country": "Ghana",
    "state": "Ashanti Region",
    "city": "Adansi South",
    "town": "Adahumasi",
    "full_address": "",
    "latitude": null,
    "longitude": null,
    "location_additional_information": "",
    "amenities": {
      "custom": [],
      "general": [
        "water-supply",
        "electricity",
        "cable-tv",
        "internet",
        "phone-lines"
      ],
      "database": [
        "277bbbf8-8028-4035-8074-976b106e3766"
      ]
    },
    "price": "2000.00",
    "currency": "GHS",
    "duration": "yearly",
    "price_type": "rent",
    "cancellation_policy": "Sample of the cancellation policy to use for the agenda",
    "is_negotiable": true,
    "security_requirements": "sample of the security requirements to use for the agenda",
    "flexible_terms": true,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
          "name": "General",
          "images": [
            {
              "id": "img_1_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028388227_x6391yq1u5.jpeg",
              "name": "𝐓𝐄𝐌𝐏𝐋𝐀𝐍𝐓𝐄 #16_.jpeg",
              "path": "iskaHomes/property-media/1760028388227_x6391yq1u5.jpeg",
              "size": 18293,
              "type": "image/jpeg",
              "filename": "1760028388227_x6391yq1u5.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "𝐓𝐄𝐌𝐏𝐋𝐀𝐍𝐓𝐄 #16_.jpeg"
            },
            {
              "id": "img_2_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028388675_dc9jl2e18f4.jpeg",
              "name": "download (3).jpeg",
              "path": "iskaHomes/property-media/1760028388675_dc9jl2e18f4.jpeg",
              "size": 20842,
              "type": "image/jpeg",
              "filename": "1760028388675_dc9jl2e18f4.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "download (3).jpeg"
            },
            {
              "id": "img_3_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028389013_x7pph8ps0fi.jpeg",
              "name": "X.jpeg",
              "path": "iskaHomes/property-media/1760028389013_x7pph8ps0fi.jpeg",
              "size": 15777,
              "type": "image/jpeg",
              "filename": "1760028389013_x7pph8ps0fi.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "X.jpeg"
            },
            {
              "id": "img_4_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028389321_ccqanjtkc8.jpeg",
              "name": "download (2).jpeg",
              "path": "iskaHomes/property-media/1760028389321_ccqanjtkc8.jpeg",
              "size": 49196,
              "type": "image/jpeg",
              "filename": "1760028389321_ccqanjtkc8.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "download (2).jpeg"
            },
            {
              "id": "img_5_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028389751_m0nna2prn4.jpeg",
              "name": "download (1).jpeg",
              "path": "iskaHomes/property-media/1760028389751_m0nna2prn4.jpeg",
              "size": 21072,
              "type": "image/jpeg",
              "filename": "1760028389751_m0nna2prn4.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "download (1).jpeg"
            },
            {
              "id": "img_6_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028390111_9pdstbv9e3h.jpeg",
              "name": "download.jpeg",
              "path": "iskaHomes/property-media/1760028390111_9pdstbv9e3h.jpeg",
              "size": 28639,
              "type": "image/jpeg",
              "filename": "1760028390111_9pdstbv9e3h.jpeg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "download.jpeg"
            },
            {
              "id": "img_7_521dc7c4-a74b-4529-988e-9e9cd7ad4b3e",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1760028390428_vg8g0vhvcnh.jpg",
              "name": "UXC_Design2020_Project Research - Donerzozo _.jpg",
              "path": "iskaHomes/property-media/1760028390428_vg8g0vhvcnh.jpg",
              "size": 40513,
              "type": "image/jpeg",
              "filename": "1760028390428_vg8g0vhvcnh.jpg",
              "created_at": "2025-10-09 16:46:30.211882+00",
              "originalName": "UXC_Design2020_Project Research - Donerzozo _.jpg"
            }
          ],
          "isDefault": true,
          "created_at": "2025-10-09 16:46:30.211882+00"
        }
      ],
      "youtubeUrl": "https://www.youtube.com/watch?v=89B5T7xRcsQ&pp=ugUHEgVlbi1VUw%3D%3D",
      "virtualTourUrl": "https://www.youtube.com/watch?v=89B5T7xRcsQ&pp=ugUHEgVlbi1VUw%3D%3D"
    },
    "additional_files": [],
    "available_from": "2025-10-07",
    "available_until": "2025-10-29",
    "acquisition_rules": "None yet",
    "additional_information": "",
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-10-09 16:46:30.211882+00",
    "updated_at": "2025-11-22 08:00:33.406158+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": "",
    "meta_keywords": "",
    "seo_title": "",
    "slug": "2-bedroom-apartment-",
    "3d_model": {
      "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/3d-models/1760028382421_dsh1tb4myow.glb",
      "path": "iskaHomes/3d-models/1760028382421_dsh1tb4myow.glb",
      "size": 12203544,
      "type": "application/octet-stream",
      "filename": "1760028382421_dsh1tb4myow.glb",
      "originalName": "main.glb"
    },
    "floor_plan": null,
    "pricing": {
      "price": 2000,
      "currency": "GHS",
      "duration": "yearly",
      "price_type": "rent",
      "security_requirements": "None for now"
    },
    "estimated_revenue": {},
    "global_price": {},
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 7,
    "total_leads": 0,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 0,
        "percentage": 0
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "phone": {
        "total": 0,
        "percentage": 0
      },
      "website": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 0,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 0,
        "direct_message": {
          "total": 0,
          "percentage": 0
        }
      },
      "appointment": {
        "total": 0,
        "percentage": 0
      },
      "message_leads": {
        "total": 0,
        "percentage": 0
      },
      "direct_message": {
        "total": 0,
        "percentage": 0
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "7aee200c-03e1-406e-9344-2961e7ce0ef2",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "2 bedrooms at Jojo Jones",
    "description": `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

Why do we use it?
It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).`,
    "size": "233",
    "status": "Available",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "49a6811f-5378-40c9-8e8b-206a62d4bd94"
      ]
    },
    "specifications": {
      "bedrooms": 1,
      "bathrooms": 1,
      "furnishing": "furnished",
      "guest_room": "yes",
      "floor_level": 1,
      "kitchen_type": "open_kitchen",
      "living_rooms": 1,
      "property_age": "new",
      "compound_type": "gated_community",
      "building_style": "minimalist",
      "guest_washroom": "yes",
      "property_condition": "excellent",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Accra",
    "town": "Ayawaso",
    "full_address": "JRJX+M24, Boundary Rd, Accra, Ghana",
    "latitude": "5.63162900",
    "longitude": "-0.15243140",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "gas-supply",
        "electricity",
        "water-supply",
        "internet",
        "phone-lines",
        "cable-tv",
        "air-conditioning",
        "heating",
        "ceiling-fans",
        "terrace",
        "kitchen-appliances",
        "modern-kitchen",
        "kitchen",
        "dining-area",
        "living-room",
        "microwave",
        "dishwasher",
        "refrigerator"
      ],
      "database": []
    },
    "price": "4000.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": null,
    "is_negotiable": false,
    "security_requirements": null,
    "flexible_terms": false,
    "media": {
      "video": {
        "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-videos/1762320514576_rkf6djz9ip7.mp4",
        "path": "iskaHomes/property-videos/1762320514576_rkf6djz9ip7.mp4",
        "size": 5088269,
        "type": "video/mp4",
        "filename": "1762320514576_rkf6djz9ip7.mp4",
        "originalName": "Here Is Us.mp4"
      },
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320510795_9c5ris4n0d.jpeg",
              "name": "Apexify_ Sales & Marketing Dashboard - Dark Mode UI Design Inspiration.jpeg",
              "path": "iskaHomes/property-media/1762320510795_9c5ris4n0d.jpeg",
              "size": 40863,
              "type": "image/jpeg",
              "filename": "1762320510795_9c5ris4n0d.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "Apexify_ Sales & Marketing Dashboard - Dark Mode UI Design Inspiration.jpeg"
            },
            {
              "id": "img_2_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320511718_zg9s9r6ippe.jpeg",
              "name": "Architectural Presentation Board (1).jpeg",
              "path": "iskaHomes/property-media/1762320511718_zg9s9r6ippe.jpeg",
              "size": 82838,
              "type": "image/jpeg",
              "filename": "1762320511718_zg9s9r6ippe.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "Architectural Presentation Board (1).jpeg"
            },
            {
              "id": "img_3_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512096_hgwvnha2wuw.jpeg",
              "name": "Architectural Presentation Board.jpeg",
              "path": "iskaHomes/property-media/1762320512096_hgwvnha2wuw.jpeg",
              "size": 77617,
              "type": "image/jpeg",
              "filename": "1762320512096_hgwvnha2wuw.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "Architectural Presentation Board.jpeg"
            },
            {
              "id": "img_4_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512433_hbr3yc0033s.jpg",
              "name": "Autex Acoustics®.jpg",
              "path": "iskaHomes/property-media/1762320512433_hbr3yc0033s.jpg",
              "size": 54349,
              "type": "image/jpeg",
              "filename": "1762320512433_hbr3yc0033s.jpg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "Autex Acoustics®.jpg"
            },
            {
              "id": "img_5_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512706_4gi1lp0ls29.jpeg",
              "name": "Bento sections.jpeg",
              "path": "iskaHomes/property-media/1762320512706_4gi1lp0ls29.jpeg",
              "size": 42100,
              "type": "image/jpeg",
              "filename": "1762320512706_4gi1lp0ls29.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "Bento sections.jpeg"
            },
            {
              "id": "img_6_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512964_5s7ktixno7s.jpeg",
              "name": "download (22).jpeg",
              "path": "iskaHomes/property-media/1762320512964_5s7ktixno7s.jpeg",
              "size": 29367,
              "type": "image/jpeg",
              "filename": "1762320512964_5s7ktixno7s.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (22).jpeg"
            },
            {
              "id": "img_7_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513191_8w6tu5xu54.jpeg",
              "name": "download (23).jpeg",
              "path": "iskaHomes/property-media/1762320513191_8w6tu5xu54.jpeg",
              "size": 70646,
              "type": "image/jpeg",
              "filename": "1762320513191_8w6tu5xu54.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (23).jpeg"
            },
            {
              "id": "img_8_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513515_2jzj29wcvxv.jpeg",
              "name": "download (24).jpeg",
              "path": "iskaHomes/property-media/1762320513515_2jzj29wcvxv.jpeg",
              "size": 124587,
              "type": "image/jpeg",
              "filename": "1762320513515_2jzj29wcvxv.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (24).jpeg"
            },
            {
              "id": "img_9_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513882_fnqv3fyymth.jpeg",
              "name": "download (25).jpeg",
              "path": "iskaHomes/property-media/1762320513882_fnqv3fyymth.jpeg",
              "size": 41689,
              "type": "image/jpeg",
              "filename": "1762320513882_fnqv3fyymth.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (25).jpeg"
            },
            {
              "id": "img_10_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320514107_76k5lssu3u.jpeg",
              "name": "download (26).jpeg",
              "path": "iskaHomes/property-media/1762320514107_76k5lssu3u.jpeg",
              "size": 23547,
              "type": "image/jpeg",
              "filename": "1762320514107_76k5lssu3u.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (26).jpeg"
            },
            {
              "id": "img_11_7aee200c-03e1-406e-9344-2961e7ce0ef2",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320514330_cd98uqeysqp.jpeg",
              "name": "download (27).jpeg",
              "path": "iskaHomes/property-media/1762320514330_cd98uqeysqp.jpeg",
              "size": 39383,
              "type": "image/jpeg",
              "filename": "1762320514330_cd98uqeysqp.jpeg",
              "created_at": "2025-11-05T05:28:36.123Z",
              "originalName": "download (27).jpeg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "mediaFiles": [
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320510795_9c5ris4n0d.jpeg",
          "path": "iskaHomes/property-media/1762320510795_9c5ris4n0d.jpeg",
          "size": 40863,
          "type": "image/jpeg",
          "filename": "1762320510795_9c5ris4n0d.jpeg",
          "originalName": "Apexify_ Sales & Marketing Dashboard - Dark Mode UI Design Inspiration.jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320511718_zg9s9r6ippe.jpeg",
          "path": "iskaHomes/property-media/1762320511718_zg9s9r6ippe.jpeg",
          "size": 82838,
          "type": "image/jpeg",
          "filename": "1762320511718_zg9s9r6ippe.jpeg",
          "originalName": "Architectural Presentation Board (1).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512096_hgwvnha2wuw.jpeg",
          "path": "iskaHomes/property-media/1762320512096_hgwvnha2wuw.jpeg",
          "size": 77617,
          "type": "image/jpeg",
          "filename": "1762320512096_hgwvnha2wuw.jpeg",
          "originalName": "Architectural Presentation Board.jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512433_hbr3yc0033s.jpg",
          "path": "iskaHomes/property-media/1762320512433_hbr3yc0033s.jpg",
          "size": 54349,
          "type": "image/jpeg",
          "filename": "1762320512433_hbr3yc0033s.jpg",
          "originalName": "Autex Acoustics®.jpg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512706_4gi1lp0ls29.jpeg",
          "path": "iskaHomes/property-media/1762320512706_4gi1lp0ls29.jpeg",
          "size": 42100,
          "type": "image/jpeg",
          "filename": "1762320512706_4gi1lp0ls29.jpeg",
          "originalName": "Bento sections.jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320512964_5s7ktixno7s.jpeg",
          "path": "iskaHomes/property-media/1762320512964_5s7ktixno7s.jpeg",
          "size": 29367,
          "type": "image/jpeg",
          "filename": "1762320512964_5s7ktixno7s.jpeg",
          "originalName": "download (22).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513191_8w6tu5xu54.jpeg",
          "path": "iskaHomes/property-media/1762320513191_8w6tu5xu54.jpeg",
          "size": 70646,
          "type": "image/jpeg",
          "filename": "1762320513191_8w6tu5xu54.jpeg",
          "originalName": "download (23).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513515_2jzj29wcvxv.jpeg",
          "path": "iskaHomes/property-media/1762320513515_2jzj29wcvxv.jpeg",
          "size": 124587,
          "type": "image/jpeg",
          "filename": "1762320513515_2jzj29wcvxv.jpeg",
          "originalName": "download (24).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320513882_fnqv3fyymth.jpeg",
          "path": "iskaHomes/property-media/1762320513882_fnqv3fyymth.jpeg",
          "size": 41689,
          "type": "image/jpeg",
          "filename": "1762320513882_fnqv3fyymth.jpeg",
          "originalName": "download (25).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320514107_76k5lssu3u.jpeg",
          "path": "iskaHomes/property-media/1762320514107_76k5lssu3u.jpeg",
          "size": 23547,
          "type": "image/jpeg",
          "filename": "1762320514107_76k5lssu3u.jpeg",
          "originalName": "download (26).jpeg"
        },
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762320514330_cd98uqeysqp.jpeg",
          "path": "iskaHomes/property-media/1762320514330_cd98uqeysqp.jpeg",
          "size": 39383,
          "type": "image/jpeg",
          "filename": "1762320514330_cd98uqeysqp.jpeg",
          "originalName": "download (27).jpeg"
        }
      ],
      "youtubeUrl": "https://www.youtube.com/watch?v=gpnf-ROLaV8",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": "2025-11-06",
    "available_until": "2025-11-20",
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 02:25:20.525028+00",
    "updated_at": "2025-11-22 07:58:18.54637+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "2-bedrooms-at-jojo-jones",
    "3d_model": {
      "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/3d-models/1762309521522_g4wkzel5usq.glb",
      "path": "iskaHomes/3d-models/1762309521522_g4wkzel5usq.glb",
      "size": 2874308,
      "type": "application/octet-stream",
      "filename": "1762309521522_g4wkzel5usq.glb",
      "originalName": "compressed submarine.glb"
    },
    "floor_plan": {
      "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/floor-plans/1762309523368_ny44kmysn4.png",
      "path": "iskaHomes/floor-plans/1762309523368_ny44kmysn4.png",
      "size": 36610,
      "type": "image/png",
      "filename": "1762309523368_ny44kmysn4.png",
      "originalName": "What-is-a-floor-plan-with-dimensions.png"
    },
    "pricing": {
      "time": 1,
      "price": 4000,
      "currency": "GHS",
      "duration": "monthly",
      "time_span": "months",
      "price_type": "rent",
      "ideal_duration": 12,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 360.24,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 4322.88
    },
    "global_price": {
      "price": 360.24,
      "currency": "USD",
      "exchange_rate": 0.09006,
      "estimated_revenue": 4322.88
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 3,
    "total_leads": 0,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 0,
        "percentage": 0
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "phone": {
        "total": 0,
        "percentage": 0
      },
      "website": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 0,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 0,
        "direct_message": {
          "total": 0,
          "percentage": 0
        }
      },
      "appointment": {
        "total": 0,
        "percentage": 0
      },
      "message_leads": {
        "total": 0,
        "percentage": 0
      },
      "direct_message": {
        "total": 0,
        "percentage": 0
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "fe0669e1-3f27-4350-8cfb-25aefea9adfe",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "1 bedroom for rent",
    "description": "defaffef",
    "size": "22",
    "status": "Sold",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "a709e6f6-a02d-4349-95db-b429dc0800b2"
      ]
    },
    "specifications": {
      "bedrooms": 2,
      "bathrooms": 2,
      "furnishing": "furnished",
      "floor_level": 2,
      "kitchen_type": "kitchenette",
      "living_rooms": 2,
      "property_age": "new",
      "compound_type": "gated_community",
      "building_style": "traditional",
      "property_condition": "good",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "United Kingdom",
    "state": "England",
    "city": "Northampton",
    "town": "North Legon",
    "full_address": "Northampton, UK",
    "latitude": "52.23706500",
    "longitude": "-0.89444210",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "modern-kitchen",
        "kitchen",
        "balcony",
        "terrace",
        "kitchen-appliances",
        "ceiling-fans"
      ]
    },
    "price": "500.00",
    "currency": "GBP",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": "",
    "is_negotiable": false,
    "security_requirements": "",
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_fe0669e1-3f27-4350-8cfb-25aefea9adfe",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762347145635_0emwvzgw9v6v.jpeg",
              "name": "X.jpeg",
              "path": "iskaHomes/property-media/1762347145635_0emwvzgw9v6v.jpeg",
              "size": 15777,
              "type": "image/jpeg",
              "filename": "1762347145635_0emwvzgw9v6v.jpeg",
              "created_at": "2025-11-05T12:52:27.259Z",
              "originalName": "X.jpeg"
            },
            {
              "id": "img_2_fe0669e1-3f27-4350-8cfb-25aefea9adfe",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762816868103_ukeqpt4ulsc.jpg",
              "name": "rgrr.jpg",
              "path": "iskaHomes/property-media/1762816868103_ukeqpt4ulsc.jpg",
              "size": 96386,
              "type": "image/jpeg",
              "filename": "1762816868103_ukeqpt4ulsc.jpg",
              "created_at": "2025-11-10T23:21:09.284Z",
              "originalName": "rgrr.jpg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "mediaFiles": [
        {
          "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762816868103_ukeqpt4ulsc.jpg",
          "path": "iskaHomes/property-media/1762816868103_ukeqpt4ulsc.jpg",
          "size": 96386,
          "type": "image/jpeg",
          "filename": "1762816868103_ukeqpt4ulsc.jpg",
          "originalName": "rgrr.jpg"
        }
      ],
      "youtubeUrl": "",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 12:52:24.055695+00",
    "updated_at": "2025-11-22 08:00:33.388078+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "1-bedroom-for-rent",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 500,
      "currency": "GBP",
      "duration": "monthly",
      "time_span": "years",
      "price_type": "rent",
      "ideal_duration": 1,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 7416.85,
      "currency": "GHS",
      "exchange_rate": 14.8337,
      "estimated_revenue": 89002.2
    },
    "global_price": {
      "price": 658.6,
      "currency": "USD",
      "exchange_rate": 1.3172,
      "estimated_revenue": 7903.2
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 35,
    "total_leads": 3,
    "total_saved": 0,
    "total_appointments": 1,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 0,
        "percentage": 0
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": "0.00"
      },
      "phone": {
        "total": 1,
        "percentage": "33.33"
      },
      "website": {
        "total": 0,
        "percentage": "0.00"
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 3,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 100,
        "direct_message": {
          "total": 3,
          "percentage": 100
        }
      },
      "appointment": {
        "total": 1,
        "percentage": "33.33"
      },
      "message_leads": {
        "total": 3,
        "percentage": 100
      },
      "direct_message": {
        "total": 3,
        "percentage": 100
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "08227056-22db-44ab-929c-ab4fb0871d02",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "1 bedroom property at villagio",
    "description": "Some nice plae and vibes",
    "size": "677",
    "status": "Available",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "35bb40ab-eb02-4176-82af-d476abc04be4"
      ]
    },
    "specifications": {
      "bedrooms": 1,
      "bathrooms": 1,
      "furnishing": "furnished",
      "guest_room": "yes",
      "floor_level": 1,
      "kitchen_type": "open_kitchen",
      "living_rooms": 1,
      "property_age": "new",
      "compound_type": "gated_community",
      "building_style": "minimalist",
      "guest_washroom": "yes",
      "property_condition": "excellent",
      "number_of_balconies": 1,
      "shared_electricity_meter": "shared"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Accra",
    "town": "Teshi",
    "full_address": "Koriey Kofi Ave, Accra, Ghana",
    "latitude": "5.62438010",
    "longitude": "-0.14288030",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "electricity",
        "gas-supply",
        "water-supply",
        "phone-lines",
        "air-conditioning",
        "balcony",
        "ceiling-fans",
        "terrace",
        "kitchen",
        "modern-kitchen",
        "kitchen-appliances"
      ],
      "database": []
    },
    "price": "1000.00",
    "currency": "USD",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": null,
    "is_negotiable": false,
    "security_requirements": null,
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_08227056-22db-44ab-929c-ab4fb0871d02",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762348273412_w6u426e6wt.jpeg",
              "name": "accra-villagio-aqua-photo-1.jpeg",
              "path": "iskaHomes/property-media/1762348273412_w6u426e6wt.jpeg",
              "size": 52852,
              "type": "image/jpeg",
              "filename": "1762348273412_w6u426e6wt.jpeg",
              "created_at": "2025-11-05T13:11:14.436Z",
              "originalName": "accra-villagio-aqua-photo-1.jpeg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "youtubeUrl": "",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": null,
    "available_until": null,
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 13:11:12.086848+00",
    "updated_at": "2025-11-22 07:59:56.362085+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "1-bedroom-property-at-villagio",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 1000,
      "currency": "USD",
      "duration": "monthly",
      "time_span": "years",
      "price_type": "rent",
      "ideal_duration": 1,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 1000,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 12000
    },
    "global_price": {
      "price": 1000,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 12000
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 27,
    "total_leads": 6,
    "total_saved": 1,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 1,
        "percentage": 14.29
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 1,
        "percentage": 14.29
      },
      "whatsapp": {
        "total": 1,
        "percentage": 14.29
      },
      "copy_link": {
        "total": 4,
        "percentage": 57.14
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": "0.00"
      },
      "phone": {
        "total": 3,
        "percentage": "50.00"
      },
      "website": {
        "total": 0,
        "percentage": "0.00"
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 6,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 100,
        "direct_message": {
          "total": 6,
          "percentage": 100
        }
      },
      "appointment": {
        "total": 1,
        "percentage": "16.67"
      },
      "message_leads": {
        "total": 6,
        "percentage": 100
      },
      "direct_message": {
        "total": 6,
        "percentage": 100
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "aa3c7bec-f3b4-43c7-952b-416bdadaad44",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "Erudite's Enclave",
    "description": "This is one of the best properties ever",
    "size": "2000",
    "status": "Available",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "db22c93d-00d3-4bd6-9e27-a6393e1925c1",
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "ce852865-9553-4f5a-8e70-80131cf40b97"
      ]
    },
    "specifications": {
      "kitchen": 3,
      "toilets": 4,
      "bedrooms": 1,
      "bathrooms": 2,
      "condition": "excellent",
      "furnishing": "furnished",
      "floor_level": 5,
      "living_rooms": 2,
      "property_age": "new",
      "property_size": 200
    },
    "country": "United Kingdom",
    "state": "England",
    "city": "Greater London",
    "town": "Ashalebotwe",
    "full_address": "78 Kensington Park Rd, London W11 2PL, UK",
    "latitude": "51.51231940",
    "longitude": "-0.20217340",
    "location_additional_information": "",
    "amenities": {
      "custom": [],
      "general": [
        "water-supply",
        "electricity"
      ],
      "database": [
        "277bbbf8-8028-4035-8074-976b106e3766"
      ]
    },
    "price": "4000.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": "None",
    "is_negotiable": true,
    "security_requirements": "",
    "flexible_terms": false,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_aa3c7bec-f3b4-43c7-952b-416bdadaad44",
          "name": "General",
          "images": [
            {
              "id": "img_1_aa3c7bec-f3b4-43c7-952b-416bdadaad44",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1759924512620_dn71m7dtq96.png",
              "name": "h.png",
              "path": "iskaHomes/property-media/1759924512620_dn71m7dtq96.png",
              "size": 4741373,
              "type": "image/png",
              "filename": "1759924512620_dn71m7dtq96.png",
              "created_at": "2025-10-08 11:55:13.287966+00",
              "originalName": "h.png"
            }
          ],
          "isDefault": true,
          "created_at": "2025-10-08 11:55:13.287966+00"
        }
      ],
      "youtubeUrl": "",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": "2025-10-15",
    "available_until": "2025-10-29",
    "acquisition_rules": "None",
    "additional_information": "",
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-10-08 11:55:13.287966+00",
    "updated_at": "2025-11-22 08:00:33.38744+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": "",
    "meta_keywords": "",
    "seo_title": "",
    "slug": "erudites-enclave",
    "3d_model": {
      "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/3d-models/1759924507185_eq0gcjjtkq9.glb",
      "path": "iskaHomes/3d-models/1759924507185_eq0gcjjtkq9.glb",
      "size": 12203544,
      "type": "application/octet-stream",
      "filename": "1759924507185_eq0gcjjtkq9.glb",
      "originalName": "main.glb"
    },
    "floor_plan": null,
    "pricing": {
      "price": 4000,
      "currency": "GHS",
      "duration": "monthly",
      "price_type": "rent",
      "security_requirements": ""
    },
    "estimated_revenue": {},
    "global_price": {},
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 13,
    "total_leads": 0,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "twitter": {
        "total": 0,
        "percentage": 0
      },
      "facebook": {
        "total": 0,
        "percentage": 0
      },
      "linkedin": {
        "total": 0,
        "percentage": 0
      },
      "telegram": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 0,
        "percentage": 0
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": 0
      },
      "phone": {
        "total": 0,
        "percentage": 0
      },
      "website": {
        "total": 0,
        "percentage": 0
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 0,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 0,
        "direct_message": {
          "total": 0,
          "percentage": 0
        }
      },
      "appointment": {
        "total": 0,
        "percentage": 0
      },
      "message_leads": {
        "total": 0,
        "percentage": 0
      },
      "direct_message": {
        "total": 0,
        "percentage": 0
      }
    },
    "leads_breakdown": {}
  },
  {
    "id": "54ff8159-e583-4a8e-8647-cd5bc53e8780",
    "account_type": "developer",
    "user_id": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "listing_type": "unit",
    "title": "Chloe's Avenue 2 bedroom duplex",
    "description": "I am Chloe and this is my test property",
    "size": "2888",
    "status": "Available",
    "development_id": "aa40d1d0-754d-4e2b-9987-19b1267a24b4",
    "purposes": [
      "05376238-304b-45d8-8cff-55ba30a5d2a3"
    ],
    "types": [
      "16f02534-40e4-445f-94f2-2a01531b8503"
    ],
    "categories": [
      "b92a429c-b6c1-4e67-94ac-aae083bfc069"
    ],
    "listing_types": {
      "custom": [],
      "inbuilt": [],
      "database": [
        "a709e6f6-a02d-4349-95db-b429dc0800b2"
      ]
    },
    "specifications": {
      "bedrooms": 1,
      "bathrooms": 1,
      "furnishing": "furnished",
      "floor_level": 1,
      "kitchen_type": "open_kitchen",
      "living_rooms": 1,
      "property_age": "1-5",
      "compound_type": "gated_community",
      "building_style": "mediterranean",
      "property_condition": "good",
      "number_of_balconies": 1,
      "shared_electricity_meter": "prepaid"
    },
    "country": "Ghana",
    "state": "Greater Accra Region",
    "city": "Amasaman",
    "town": null,
    "full_address": "PM4X+F6F, Amasaman, Ghana",
    "latitude": "5.70883446",
    "longitude": "-0.29693000",
    "location_additional_information": null,
    "amenities": {
      "custom": [],
      "inbuilt": [
        "water-supply",
        "gas-supply",
        "phone-lines",
        "cable-tv",
        "sewer-system",
        "drainage",
        "24-7-security",
        "ceiling-fans",
        "heating",
        "air-conditioning",
        "natural-light",
        "modern-kitchen",
        "microwave",
        "refrigerator"
      ],
      "database": []
    },
    "price": "4000.00",
    "currency": "GHS",
    "duration": "monthly",
    "price_type": "rent",
    "cancellation_policy": null,
    "is_negotiable": true,
    "security_requirements": null,
    "flexible_terms": true,
    "media": {
      "video": null,
      "albums": [
        {
          "id": "album_general_default",
          "name": "General",
          "images": [
            {
              "id": "img_1_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344071341_z5dh6hjgc9r.jpg",
              "name": "STAY IN SHAPE.jpg",
              "path": "iskaHomes/property-media/1762344071341_z5dh6hjgc9r.jpg",
              "size": 46461,
              "type": "image/jpeg",
              "filename": "1762344071341_z5dh6hjgc9r.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "STAY IN SHAPE.jpg"
            },
            {
              "id": "img_2_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344072596_dl1y72e4ir6.jpg",
              "name": "download (2).jpg",
              "path": "iskaHomes/property-media/1762344072596_dl1y72e4ir6.jpg",
              "size": 33570,
              "type": "image/jpeg",
              "filename": "1762344072596_dl1y72e4ir6.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "download (2).jpg"
            },
            {
              "id": "img_3_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344072836_tjbcqjdsig.jpg",
              "name": "UXC_Design2020_Project Research - Donerzozo _.jpg",
              "path": "iskaHomes/property-media/1762344072836_tjbcqjdsig.jpg",
              "size": 40513,
              "type": "image/jpeg",
              "filename": "1762344072836_tjbcqjdsig.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "UXC_Design2020_Project Research - Donerzozo _.jpg"
            },
            {
              "id": "img_4_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344073087_oqkek9qhttg.jpg",
              "name": "GG.jpg",
              "path": "iskaHomes/property-media/1762344073087_oqkek9qhttg.jpg",
              "size": 56993,
              "type": "image/jpeg",
              "filename": "1762344073087_oqkek9qhttg.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "GG.jpg"
            },
            {
              "id": "img_5_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344073358_l6ad36rnd9.jpg",
              "name": "Huawei - Stickers P30 Pro - Leo Natsume.jpg",
              "path": "iskaHomes/property-media/1762344073358_l6ad36rnd9.jpg",
              "size": 28711,
              "type": "image/jpeg",
              "filename": "1762344073358_l6ad36rnd9.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "Huawei - Stickers P30 Pro - Leo Natsume.jpg"
            },
            {
              "id": "img_6_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344073617_2bvn1h02aei.jpg",
              "name": "LOGO 4.jpg",
              "path": "iskaHomes/property-media/1762344073617_2bvn1h02aei.jpg",
              "size": 40059,
              "type": "image/jpeg",
              "filename": "1762344073617_2bvn1h02aei.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "LOGO 4.jpg"
            },
            {
              "id": "img_7_54ff8159-e583-4a8e-8647-cd5bc53e8780",
              "url": "https://nijtqzjaojduuqpagxqj.supabase.co/storage/v1/object/public/iskaHomes/iskaHomes/property-media/1762344073860_qwjr77849qb.jpg",
              "name": "Packaging-Design-The-Forgotten-D.jpg",
              "path": "iskaHomes/property-media/1762344073860_qwjr77849qb.jpg",
              "size": 46729,
              "type": "image/jpeg",
              "filename": "1762344073860_qwjr77849qb.jpg",
              "created_at": "2025-11-05T12:01:14.155Z",
              "originalName": "Packaging-Design-The-Forgotten-D.jpg"
            }
          ],
          "isDefault": true,
          "created_at": "2024-01-01T00:00:00.000Z"
        },
        {
          "id": "album_album_6_1",
          "name": "Parking",
          "images": [],
          "created_at": "2025-11-05T11:57:01.939Z"
        }
      ],
      "youtubeUrl": "https://www.youtube.com/watch?v=-a-b0jO248Q&list=RD-a-b0jO248Q&start_radio=1&t=1766s&pp=oAcB",
      "virtualTourUrl": ""
    },
    "additional_files": [],
    "available_from": "2025-11-06",
    "available_until": "2025-11-27",
    "acquisition_rules": null,
    "additional_information": null,
    "listing_status": "active",
    "is_featured": false,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-11-05 12:01:09.98072+00",
    "updated_at": "2025-11-22 08:00:33.349012+00",
    "published_at": null,
    "expires_at": null,
    "created_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "last_modified_by": "2110cf0f-11c5-40a9-9a00-97bc581d2cee",
    "tags": [],
    "meta_description": null,
    "meta_keywords": null,
    "seo_title": null,
    "slug": "chloes-avenue-2-bedroom-duplex",
    "3d_model": {},
    "floor_plan": null,
    "pricing": {
      "time": 1,
      "price": 4000,
      "currency": "GHS",
      "duration": "monthly",
      "time_span": "years",
      "price_type": "rent",
      "ideal_duration": 2,
      "security_requirements": ""
    },
    "estimated_revenue": {
      "price": 360.24,
      "currency": "USD",
      "exchange_rate": 1,
      "estimated_revenue": 8645.76
    },
    "global_price": {
      "price": 360.24,
      "currency": "USD",
      "exchange_rate": 0.09006,
      "estimated_revenue": 8645.76
    },
    "listing_condition": "completed",
    "upload_status": "completed",
    "total_views": 8,
    "total_leads": 4,
    "total_saved": 0,
    "total_appointments": 0,
    "listing_share_breakdown": {
      "email": {
        "total": 2,
        "percentage": 25
      },
      "twitter": {
        "total": 1,
        "percentage": 12.5
      },
      "facebook": {
        "total": 1,
        "percentage": 12.5
      },
      "linkedin": {
        "total": 1,
        "percentage": 12.5
      },
      "telegram": {
        "total": 1,
        "percentage": 12.5
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "copy_link": {
        "total": 2,
        "percentage": 25
      },
      "instagram": {
        "total": 0,
        "percentage": 0
      }
    },
    "listing_leads_breakdown": {
      "email": {
        "total": 0,
        "percentage": "0.00"
      },
      "phone": {
        "total": 3,
        "percentage": "75.00"
      },
      "website": {
        "total": 0,
        "percentage": "0.00"
      },
      "whatsapp": {
        "total": 0,
        "percentage": 0
      },
      "messaging": {
        "total": 3,
        "whatsapp": {
          "total": 0,
          "percentage": 0
        },
        "percentage": 75,
        "direct_message": {
          "total": 3,
          "percentage": 100
        }
      },
      "appointment": {
        "total": 0,
        "percentage": "0.00"
      },
      "message_leads": {
        "total": 3,
        "percentage": 75
      },
      "direct_message": {
        "total": 3,
        "percentage": 75
      }
    },
    "leads_breakdown": {}
  }
]
export default propertySpecificationsData;

