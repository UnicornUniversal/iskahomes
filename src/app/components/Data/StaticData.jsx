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
// Uses responsive Tailwind classes with w (width) and h (height) for consistent sizing
// Mix of sizes: small (3 per row), medium (2 per row), large (1 per row)
export const dynamicImages = [
  // Small sizes - 3 can fit on screen
  {
    id: 1,
    imageClasses: 'w-[280px] h-[220px] md:w-[300px] md:h-[240px] lg:w-[320px] lg:h-[260px]',
    containerClasses: 'w-full'
  },
  {
    id: 2,
    imageClasses: 'w-[260px] h-[200px] md:w-[290px] md:h-[230px] lg:w-[310px] lg:h-[250px]',
    containerClasses: 'w-full'
  },
  {
    id: 3,
    imageClasses: 'w-[270px] h-[210px] md:w-[295px] md:h-[235px] lg:w-[315px] lg:h-[255px]',
    containerClasses: 'w-full'
  },
  // Medium sizes - 2 can fit on screen
  {
    id: 4,
    imageClasses: 'w-[380px] h-[300px] md:w-[420px] md:h-[340px] lg:w-[450px] lg:h-[380px]',
    containerClasses: 'w-full'
  },
  {
    id: 5,
    imageClasses: 'w-[400px] h-[320px] md:w-[440px] md:h-[360px] lg:w-[470px] lg:h-[400px]',
    containerClasses: 'w-full'
  },
  {
    id: 6,
    imageClasses: 'w-[360px] h-[280px] md:w-[400px] md:h-[320px] lg:w-[430px] lg:h-[360px]',
    containerClasses: 'w-full'
  },
  // Large sizes - 1 per row
  {
    id: 7,
    imageClasses: 'w-[500px] h-[400px] md:w-[550px] md:h-[440px] lg:w-[600px] lg:h-[480px]',
    containerClasses: 'w-full'
  },
  {
    id: 8,
    imageClasses: 'w-[480px] h-[380px] md:w-[530px] md:h-[420px] lg:w-[580px] lg:h-[460px]',
    containerClasses: 'w-full'
  },
  // Extra small - 3+ can fit
  {
    id: 9,
    imageClasses: 'w-[240px] h-[180px] md:w-[270px] md:h-[210px] lg:w-[290px] lg:h-[230px]',
    containerClasses: 'w-full'
  },
  {
    id: 10,
    imageClasses: 'w-[250px] h-[190px] md:w-[280px] md:h-[220px] lg:w-[300px] lg:h-[240px]',
    containerClasses: 'w-full'
  },
]

export default propertySpecificationsData;

