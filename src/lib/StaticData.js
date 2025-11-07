// Static data for amenities and other shared constants
import {
  FaTint,
  FaBolt,
  FaGasPump,
  FaWifi,
  FaPhone,
  FaTv,
  FaShower,
  FaCloudRain,
  FaShieldAlt,
  FaVideo,
  FaUserShield,
  FaKey,
  FaBell,
  FaFireExtinguisher,
  FaDoorOpen,
  FaFirstAid,
  FaParking,
  FaHome,
  FaCar,
  FaCarSide,
  FaBicycle,
  FaBus,
  FaSubway,
  FaSnowflake,
  FaFire,
  FaFan,
  FaSun,
  FaUmbrellaBeach,
  FaMountain,
  FaUtensils,
  FaPlug,
  FaSatellite,
  FaSnowman,
  FaCouch,
  FaBed,
  FaCrown,
  FaTshirt,
  FaBath,
  FaToilet,
  FaDesktop,
  FaFilm,
  FaVolumeUp,
  FaGamepad,
  FaLaptop,
  FaBook,
  FaDumbbell,
  FaSwimmingPool,
  FaTableTennis,
  FaBasketballBall,
  FaChild,
  FaSpa,
  FaHotTub,
  FaTree,
  FaCity,
  FaSun as FaSunPatio,
  FaChair,
  FaSeedling,
  FaLeaf,
  FaBriefcase,
  FaHandshake,
  FaLaptopCode,
  FaPrint,
  FaFax,
  FaCoffee,
  FaCocktail,
  FaUtensils as FaUtensilsRoom,
  FaGift,
  FaDog,
  FaDog as FaDogGrooming,
  FaBaby,
  FaBabyCarriage,
  FaUserMd,
  FaPills,
  FaTooth,
  FaAmbulance,
  FaMobileAlt,
  FaBookOpen,
  FaLaptopCode as FaLaptopLab,
  FaGraduationCap,
  FaCommentDots,
  FaPalette,
  FaWineBottle,
  FaGolfBall,
  FaShip,
  FaHelicopter,
  FaUtensils as FaChefHatPrivate,
  FaUserTie,
  FaCar as FaCarChauffeur,
  FaSchool,
  FaHospital,
  FaShoppingBag,
  FaPlane,
  FaUmbrellaBeach as FaUmbrellaBeachNear,
  FaTree as FaTreePark,
  FaBuilding,
  FaWater,
  FaSolarPanel,
  FaCloudRain as FaCloudRainHarvest,
  FaRecycle,
  FaBolt as FaBoltEfficient,
  FaLeaf as FaLeafGreen,
  FaRobot,
} from 'react-icons/fa';

// Property Type IDs (matching PropertySpecifications.jsx)
export const PROPERTY_TYPE_IDS = {
  LAND: 'a389610d-1d0a-440b-a3c4-91f392ebd27c',
  HOUSES_APARTMENTS: '16f02534-40e4-445f-94f2-2a01531b8503',
  OFFICES: 'fc7d2abc-e19e-40bc-942b-5c1b1561565c',
  WAREHOUSES: '0f2df1a6-86ad-4690-82f6-e9358b973fd7',
  EVENT_CENTERS: '40ae5053-1143-4c74-8f29-8a3e467e9b43',
};

// General Amenities (available for all property types)
export const GENERAL_AMENITIES = [
  // === ESSENTIAL UTILITIES ===
  { id: 'water-supply', name: 'Water Supply', icon: FaTint, description: 'Reliable water supply system' },
  { id: 'electricity', name: 'Electricity', icon: FaBolt, description: 'Electrical power connection' },
  { id: 'gas-supply', name: 'Gas Supply', icon: FaGasPump, description: 'Natural gas or LPG connection' },
  { id: 'internet', name: 'High-Speed Internet', icon: FaWifi, description: 'Broadband internet connection' },
  { id: 'phone-lines', name: 'Phone Lines', icon: FaPhone, description: 'Landline telephone connection' },
  { id: 'cable-tv', name: 'Cable TV', icon: FaTv, description: 'Cable television connection' },
  { id: 'sewer-system', name: 'Sewer System', icon: FaShower, description: 'Proper sewage disposal system' },
  { id: 'drainage', name: 'Drainage', icon: FaCloudRain, description: 'Storm water drainage system' },
  
  // === SECURITY & SAFETY ===
  { id: '24-7-security', name: '24/7 Security', icon: FaShieldAlt, description: 'Round-the-clock security service' },
  { id: 'cctv', name: 'CCTV Surveillance', icon: FaVideo, description: 'Closed-circuit television monitoring' },
  { id: 'security-guards', name: 'Security Guards', icon: FaUserShield, description: 'On-site security personnel' },
  { id: 'access-control', name: 'Access Control', icon: FaKey, description: 'Electronic access control system' },
  { id: 'alarm-system', name: 'Alarm System', icon: FaBell, description: 'Intruder alarm system' },
  { id: 'fire-safety', name: 'Fire Safety', icon: FaFireExtinguisher, description: 'Fire safety equipment and systems' },
  { id: 'emergency-exit', name: 'Emergency Exit', icon: FaDoorOpen, description: 'Emergency exit routes' },
  { id: 'first-aid', name: 'First Aid Kit', icon: FaFirstAid, description: 'First aid medical supplies' },
  
  // === PARKING & TRANSPORTATION ===
  { id: 'parking', name: 'Parking Space', icon: FaParking, description: 'Designated parking areas' },
  { id: 'garage', name: 'Garage', icon: FaHome, description: 'Private garage spaces' },
  { id: 'covered-parking', name: 'Covered Parking', icon: FaCar, description: 'Protected parking spaces' },
  { id: 'visitor-parking', name: 'Visitor Parking', icon: FaCarSide, description: 'Guest parking facilities' },
  { id: 'bike-storage', name: 'Bike Storage', icon: FaBicycle, description: 'Secure bicycle storage' },
  { id: 'public-transport', name: 'Public Transport', icon: FaBus, description: 'Nearby public transportation' },
  { id: 'metro-access', name: 'Metro Access', icon: FaSubway, description: 'Metro station nearby' },
  
  // === SUSTAINABILITY & ECO ===
  { id: 'solar-panels', name: 'Solar Panels', icon: FaSolarPanel, description: 'Solar energy system' },
  { id: 'rainwater-harvesting', name: 'Rainwater Harvesting', icon: FaCloudRainHarvest, description: 'Rainwater collection system' },
  { id: 'recycling', name: 'Recycling', icon: FaRecycle, description: 'Recycling facilities' },
  { id: 'energy-efficient', name: 'Energy Efficient', icon: FaBoltEfficient, description: 'Energy-efficient appliances' },
  { id: 'green-building', name: 'Green Building', icon: FaLeafGreen, description: 'Eco-friendly construction' },
  { id: 'smart-home', name: 'Smart Home', icon: FaRobot, description: 'Smart home automation' },
  
  // === LOCATION & ACCESSIBILITY ===
  { id: 'near-schools', name: 'Near Schools', icon: FaSchool, description: 'Educational institutions nearby' },
  { id: 'near-hospitals', name: 'Near Hospitals', icon: FaHospital, description: 'Medical facilities nearby' },
  { id: 'near-shopping', name: 'Near Shopping', icon: FaShoppingBag, description: 'Shopping centers nearby' },
  { id: 'near-airport', name: 'Near Airport', icon: FaPlane, description: 'Airport access nearby' },
  { id: 'near-beach', name: 'Near Beach', icon: FaUmbrellaBeachNear, description: 'Beach access nearby' },
  { id: 'near-park', name: 'Near Park', icon: FaTreePark, description: 'Parks and recreation nearby' },
  { id: 'city-center', name: 'City Center', icon: FaBuilding, description: 'Located in city center' },
  { id: 'waterfront', name: 'Waterfront', icon: FaWater, description: 'Waterfront location' },
];

// Houses and Apartments Specific Amenities
export const HOUSES_APARTMENTS_AMENITIES = [
  // === COMFORT & CLIMATE ===
  { id: 'air-conditioning', name: 'Air Conditioning', icon: FaSnowflake, description: 'Central or individual AC units' },
  { id: 'heating', name: 'Heating System', icon: FaFire, description: 'Central heating system' },
  { id: 'ceiling-fans', name: 'Ceiling Fans', icon: FaFan, description: 'Ceiling fan installation' },
  { id: 'natural-light', name: 'Natural Light', icon: FaSun, description: 'Abundant natural lighting' },
  { id: 'balcony', name: 'Balcony', icon: FaUmbrellaBeach, description: 'Private balcony space' },
  { id: 'terrace', name: 'Terrace', icon: FaMountain, description: 'Outdoor terrace area' },
  
  // === KITCHEN & DINING ===
  { id: 'kitchen', name: 'Kitchen', icon: FaUtensils, description: 'Fully equipped kitchen' },
  { id: 'modern-kitchen', name: 'Modern Kitchen', icon: FaUtensils, description: 'Contemporary kitchen design' },
  { id: 'kitchen-appliances', name: 'Kitchen Appliances', icon: FaPlug, description: 'Built-in kitchen appliances' },
  { id: 'dishwasher', name: 'Dishwasher', icon: FaPlug, description: 'Built-in dishwasher' },
  { id: 'microwave', name: 'Microwave', icon: FaSatellite, description: 'Microwave oven' },
  { id: 'refrigerator', name: 'Refrigerator', icon: FaSnowman, description: 'Refrigerator included' },
  { id: 'dining-area', name: 'Dining Area', icon: FaUtensils, description: 'Dedicated dining space' },
  
  // === LIVING SPACES ===
  { id: 'living-room', name: 'Living Room', icon: FaCouch, description: 'Spacious living area' },
  { id: 'bedroom', name: 'Bedroom', icon: FaBed, description: 'Comfortable bedroom space' },
  { id: 'master-bedroom', name: 'Master Bedroom', icon: FaCrown, description: 'Large master bedroom' },
  { id: 'walk-in-closet', name: 'Walk-in Closet', icon: FaTshirt, description: 'Spacious wardrobe space' },
  { id: 'bathroom', name: 'Bathroom', icon: FaBath, description: 'Modern bathroom facilities' },
  { id: 'master-bathroom', name: 'Master Bathroom', icon: FaShower, description: 'En-suite master bathroom' },
  { id: 'powder-room', name: 'Powder Room', icon: FaToilet, description: 'Guest powder room' },
  
  // === ENTERTAINMENT & TECHNOLOGY ===
  { id: 'tv', name: 'Television', icon: FaDesktop, description: 'Smart TV included' },
  { id: 'home-theater', name: 'Home Theater', icon: FaFilm, description: 'Private cinema room' },
  { id: 'sound-system', name: 'Sound System', icon: FaVolumeUp, description: 'Built-in audio system' },
  { id: 'gaming-room', name: 'Gaming Room', icon: FaGamepad, description: 'Dedicated gaming space' },
  { id: 'computer-room', name: 'Computer Room', icon: FaLaptop, description: 'Home office/computer space' },
  { id: 'study-room', name: 'Study Room', icon: FaBook, description: 'Quiet study area' },
  
  // === FITNESS & RECREATION ===
  { id: 'gym', name: 'Gym', icon: FaDumbbell, description: 'Fitness center with modern equipment' },
  { id: 'swimming-pool', name: 'Swimming Pool', icon: FaSwimmingPool, description: 'Outdoor or indoor swimming pool' },
  { id: 'tennis-court', name: 'Tennis Court', icon: FaTableTennis, description: 'Tennis facilities' },
  { id: 'basketball-court', name: 'Basketball Court', icon: FaBasketballBall, description: 'Basketball court' },
  { id: 'playground', name: 'Playground', icon: FaChild, description: "Children's play area" },
  { id: 'spa', name: 'Spa & Wellness', icon: FaSpa, description: 'Relaxation and wellness center' },
  { id: 'sauna', name: 'Sauna', icon: FaHotTub, description: 'Private sauna facilities' },
  { id: 'jacuzzi', name: 'Jacuzzi', icon: FaHotTub, description: 'Hot tub or jacuzzi' },
  
  // === OUTDOOR & NATURE ===
  { id: 'garden', name: 'Garden', icon: FaTree, description: 'Landscaped gardens and green spaces' },
  { id: 'rooftop-terrace', name: 'Rooftop Terrace', icon: FaCity, description: 'Rooftop gathering space' },
  { id: 'patio', name: 'Patio', icon: FaSunPatio, description: 'Outdoor patio area' },
  { id: 'bbq-area', name: 'BBQ Area', icon: FaFire, description: 'Outdoor barbecue facilities' },
  { id: 'outdoor-seating', name: 'Outdoor Seating', icon: FaChair, description: 'Outdoor furniture and seating' },
  { id: 'landscaping', name: 'Landscaping', icon: FaSeedling, description: 'Professional landscaping' },
  { id: 'green-space', name: 'Green Space', icon: FaLeaf, description: 'Natural green areas' },
  
  // === SERVICES & AMENITIES ===
  { id: 'concierge', name: 'Concierge', icon: FaUserTie, description: 'Concierge services' },
  { id: 'housekeeping', name: 'Housekeeping', icon: FaBriefcase, description: 'Cleaning and maintenance service' },
  { id: 'laundry-service', name: 'Laundry Service', icon: FaTshirt, description: 'Professional laundry service' },
  { id: 'dry-cleaning', name: 'Dry Cleaning', icon: FaTshirt, description: 'Dry cleaning pickup service' },
  { id: 'maintenance', name: 'Maintenance', icon: FaBriefcase, description: 'On-site maintenance team' },
  { id: 'elevator', name: 'Elevator', icon: FaBuilding, description: 'Modern elevator system' },
  { id: 'storage', name: 'Storage Units', icon: FaHome, description: 'Additional storage space' },
  { id: 'mail-service', name: 'Mail Service', icon: FaBriefcase, description: 'Mail and package handling' },
  
  // === PET & FAMILY ===
  { id: 'pet-friendly', name: 'Pet Friendly', icon: FaDog, description: 'Pet-friendly policies' },
  { id: 'pet-grooming', name: 'Pet Grooming', icon: FaDogGrooming, description: 'Pet grooming services' },
  { id: 'childcare', name: 'Childcare', icon: FaBaby, description: 'Childcare services' },
  { id: 'nursery', name: 'Nursery', icon: FaBabyCarriage, description: 'On-site nursery' },
  { id: 'elderly-care', name: 'Elderly Care', icon: FaUserMd, description: 'Senior care services' },
  
  // === HEALTHCARE & MEDICAL ===
  { id: 'medical-center', name: 'Medical Center', icon: FaHospital, description: 'On-site medical facility' },
  { id: 'pharmacy', name: 'Pharmacy', icon: FaPills, description: 'Pharmacy services' },
  { id: 'dental-clinic', name: 'Dental Clinic', icon: FaTooth, description: 'Dental care services' },
  { id: 'emergency-care', name: 'Emergency Care', icon: FaAmbulance, description: 'Emergency medical services' },
  { id: 'telemedicine', name: 'Telemedicine', icon: FaMobileAlt, description: 'Remote medical consultations' },
  
  // === EDUCATION & LEARNING ===
  { id: 'library', name: 'Library', icon: FaBookOpen, description: 'Quiet reading and study area' },
  { id: 'computer-lab', name: 'Computer Lab', icon: FaLaptopLab, description: 'Computer learning center' },
  { id: 'tutoring', name: 'Tutoring', icon: FaGraduationCap, description: 'Educational tutoring services' },
  { id: 'language-classes', name: 'Language Classes', icon: FaCommentDots, description: 'Language learning programs' },
  { id: 'art-studio', name: 'Art Studio', icon: FaPalette, description: 'Creative workspace for artists' },
  
  // === LUXURY & SPECIAL ===
  { id: 'wine-cellar', name: 'Wine Cellar', icon: FaWineBottle, description: 'Temperature-controlled wine storage' },
  { id: 'golf-course', name: 'Golf Course', icon: FaGolfBall, description: 'Golf course access' },
  { id: 'marina', name: 'Marina', icon: FaShip, description: 'Boat docking facilities' },
  { id: 'helipad', name: 'Helipad', icon: FaHelicopter, description: 'Private helicopter landing pad' },
  { id: 'private-chef', name: 'Private Chef', icon: FaChefHatPrivate, description: 'Personal chef services' },
  { id: 'butler-service', name: 'Butler Service', icon: FaUserTie, description: 'Personal butler service' },
  { id: 'chauffeur', name: 'Chauffeur', icon: FaCarChauffeur, description: 'Personal driver service' },
];

// Offices Specific Amenities
export const OFFICES_AMENITIES = [
  // === BUSINESS & WORK ===
  { id: 'business-center', name: 'Business Center', icon: FaBriefcase, description: 'Professional workspace' },
  { id: 'meeting-room', name: 'Meeting Room', icon: FaHandshake, description: 'Conference and meeting facilities' },
  { id: 'co-working-space', name: 'Co-working Space', icon: FaLaptopCode, description: 'Shared workspace' },
  { id: 'printing-service', name: 'Printing Service', icon: FaPrint, description: 'Print and copy services' },
  { id: 'fax-service', name: 'Fax Service', icon: FaFax, description: 'Fax machine access' },
  { id: 'reception-area', name: 'Reception Area', icon: FaBriefcase, description: 'Professional reception area' },
  { id: 'pantry-cafeteria', name: 'Pantry/Cafeteria', icon: FaCoffee, description: 'On-site dining facilities' },
  { id: 'break-room', name: 'Break Room', icon: FaCoffee, description: 'Employee break area' },
  { id: 'conference-facilities', name: 'Conference Facilities', icon: FaHandshake, description: 'Full conference facilities' },
  { id: 'video-conferencing', name: 'Video Conferencing', icon: FaVideo, description: 'Video conferencing equipment' },
  { id: 'high-speed-internet', name: 'High-Speed Internet', icon: FaWifi, description: 'Dedicated business internet' },
  { id: 'it-support', name: 'IT Support', icon: FaLaptopCode, description: 'On-site IT support' },
];

// Warehouses Specific Amenities
export const WAREHOUSES_AMENITIES = [
  { id: 'loading-docks', name: 'Loading Docks', icon: FaCar, description: 'Dedicated loading dock facilities' },
  { id: 'dock-levelers', name: 'Dock Levelers', icon: FaCarSide, description: 'Loading dock levelers' },
  { id: 'forklift-access', name: 'Forklift Access', icon: FaCar, description: 'Forklift-friendly access' },
  { id: 'high-ceilings', name: 'High Ceilings', icon: FaBuilding, description: 'High ceiling clearance' },
  { id: 'climate-control', name: 'Climate Control', icon: FaSnowflake, description: 'Temperature-controlled storage' },
  { id: 'fire-suppression', name: 'Fire Suppression System', icon: FaFireExtinguisher, description: 'Advanced fire suppression' },
  { id: 'security-system', name: 'Advanced Security System', icon: FaShieldAlt, description: 'Comprehensive security' },
  { id: 'vehicle-access', name: 'Vehicle Access', icon: FaCar, description: 'Large vehicle access' },
  { id: 'rail-access', name: 'Rail Access', icon: FaSubway, description: 'Railway access for freight' },
  { id: 'office-space', name: 'Office Space', icon: FaBriefcase, description: 'On-site office facilities' },
  { id: 'restroom-facilities', name: 'Restroom Facilities', icon: FaToilet, description: 'Employee facilities' },
  { id: 'parking-lot', name: 'Parking Lot', icon: FaParking, description: 'Employee and visitor parking' },
];

// Event Centers Specific Amenities
export const EVENT_CENTERS_AMENITIES = [
  { id: 'main-hall', name: 'Main Hall', icon: FaBuilding, description: 'Large main event hall' },
  { id: 'stage-area', name: 'Stage Area', icon: FaFilm, description: 'Professional stage setup' },
  { id: 'sound-system', name: 'Professional Sound System', icon: FaVolumeUp, description: 'High-quality audio equipment' },
  { id: 'lighting-system', name: 'Lighting System', icon: FaSun, description: 'Professional lighting equipment' },
  { id: 'projector-screen', name: 'Projector & Screen', icon: FaDesktop, description: 'Presentation equipment' },
  { id: 'dressing-rooms', name: 'Dressing Rooms', icon: FaTshirt, description: 'Backstage facilities' },
  { id: 'catering-kitchen', name: 'Catering Kitchen', icon: FaUtensils, description: 'Full-service kitchen' },
  { id: 'dining-area', name: 'Dining Area', icon: FaUtensils, description: 'Serving and dining space' },
  { id: 'bar-service', name: 'Bar Service', icon: FaCocktail, description: 'On-site bar facilities' },
  { id: 'reception-area', name: 'Reception Area', icon: FaHandshake, description: 'Welcome and reception space' },
  { id: 'pre-function-area', name: 'Pre-Function Area', icon: FaBuilding, description: 'Pre-event gathering space' },
  { id: 'parking-facilities', name: 'Parking Facilities', icon: FaParking, description: 'Guest parking' },
  { id: 'accommodation', name: 'Accommodation', icon: FaBed, description: 'On-site accommodation options' },
  { id: 'bridal-suite', name: 'Bridal Suite', icon: FaCrown, description: 'Private bridal preparation area' },
  { id: 'outdoor-space', name: 'Outdoor Space', icon: FaUmbrellaBeach, description: 'Outdoor event area' },
];

// Land Specific Amenities
export const LAND_AMENITIES = [
  { id: 'road-access', name: 'Road Access', icon: FaCar, description: 'Direct road access' },
  { id: 'utilities-ready', name: 'Utilities Ready', icon: FaBolt, description: 'Utility connections available' },
  { id: 'water-access', name: 'Water Access', icon: FaTint, description: 'Water supply connection' },
  { id: 'electricity-ready', name: 'Electricity Ready', icon: FaBolt, description: 'Electrical connection available' },
  { id: 'sewer-ready', name: 'Sewer Ready', icon: FaShower, description: 'Sewer connection available' },
  { id: 'drainage-system', name: 'Drainage System', icon: FaCloudRain, description: 'Proper drainage infrastructure' },
  { id: 'fencing', name: 'Fencing', icon: FaShieldAlt, description: 'Perimeter fencing' },
  { id: 'security-gates', name: 'Security Gates', icon: FaKey, description: 'Gated access' },
  { id: 'surveyed', name: 'Surveyed', icon: FaBuilding, description: 'Professional land survey completed' },
  { id: 'zoning-approved', name: 'Zoning Approved', icon: FaBriefcase, description: 'Proper zoning approvals' },
  { id: 'development-ready', name: 'Development Ready', icon: FaBuilding, description: 'Ready for development' },
  { id: 'environmental-clearance', name: 'Environmental Clearance', icon: FaLeaf, description: 'Environmental approvals' },
];

// Legacy support - keep PREDEFINED_AMENITIES for backward compatibility
export const PREDEFINED_AMENITIES = [...GENERAL_AMENITIES, ...HOUSES_APARTMENTS_AMENITIES];

// Get amenities by property type
export const getAmenitiesByPropertyType = (propertyTypeId) => {
  const allAmenities = [...GENERAL_AMENITIES];
  
  switch (propertyTypeId) {
    case PROPERTY_TYPE_IDS.HOUSES_APARTMENTS:
      return [...allAmenities, ...HOUSES_APARTMENTS_AMENITIES];
    case PROPERTY_TYPE_IDS.OFFICES:
      return [...allAmenities, ...OFFICES_AMENITIES];
    case PROPERTY_TYPE_IDS.WAREHOUSES:
      return [...allAmenities, ...WAREHOUSES_AMENITIES];
    case PROPERTY_TYPE_IDS.EVENT_CENTERS:
      return [...allAmenities, ...EVENT_CENTERS_AMENITIES];
    case PROPERTY_TYPE_IDS.LAND:
      return [...allAmenities, ...LAND_AMENITIES];
    default:
      return allAmenities;
  }
};

// Get all available amenities (for search)
export const getAllAmenities = () => {
  return [
    ...GENERAL_AMENITIES,
    ...HOUSES_APARTMENTS_AMENITIES,
    ...OFFICES_AMENITIES,
    ...WAREHOUSES_AMENITIES,
    ...EVENT_CENTERS_AMENITIES,
    ...LAND_AMENITIES,
  ];
};

// Helper function to get amenity by ID
export const getAmenityById = (id) => {
  const allAmenities = getAllAmenities();
  return allAmenities.find(amenity => amenity.id === id);
}

// Helper function to get amenity icon by ID (returns React component)
export const getAmenityIcon = (id) => {
  const amenity = getAmenityById(id);
  if (!amenity) return null;
  const IconComponent = amenity.icon;
  return IconComponent ? <IconComponent className="text-lg" /> : null;
}

// Helper function to get amenity name by ID
export const getAmenityName = (id) => {
  const amenity = getAmenityById(id);
  return amenity ? amenity.name : id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
