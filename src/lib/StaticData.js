// Static data for amenities and other shared constants
export const PREDEFINED_AMENITIES = [
  // === ESSENTIAL UTILITIES ===
  { id: 'water-supply', name: 'Water Supply', icon: '💧', description: 'Reliable water supply system' },
  { id: 'electricity', name: 'Electricity', icon: '⚡', description: 'Electrical power connection' },
  { id: 'gas-supply', name: 'Gas Supply', icon: '⛽', description: 'Natural gas or LPG connection' },
  { id: 'internet', name: 'High-Speed Internet', icon: '🌐', description: 'Broadband internet connection' },
  { id: 'phone-lines', name: 'Phone Lines', icon: '📞', description: 'Landline telephone connection' },
  { id: 'cable-tv', name: 'Cable TV', icon: '📺', description: 'Cable television connection' },
  { id: 'sewer-system', name: 'Sewer System', icon: '🚰', description: 'Proper sewage disposal system' },
  { id: 'drainage', name: 'Drainage', icon: '🌧️', description: 'Storm water drainage system' },
  
  // === SECURITY & SAFETY ===
  { id: '24-7-security', name: '24/7 Security', icon: '🛡️', description: 'Round-the-clock security service' },
  { id: 'cctv', name: 'CCTV Surveillance', icon: '📹', description: 'Closed-circuit television monitoring' },
  { id: 'security-guards', name: 'Security Guards', icon: '👮', description: 'On-site security personnel' },
  { id: 'access-control', name: 'Access Control', icon: '🔑', description: 'Electronic access control system' },
  { id: 'alarm-system', name: 'Alarm System', icon: '🚨', description: 'Intruder alarm system' },
  { id: 'fire-safety', name: 'Fire Safety', icon: '🧯', description: 'Fire safety equipment and systems' },
  { id: 'emergency-exit', name: 'Emergency Exit', icon: '🚪', description: 'Emergency exit routes' },
  { id: 'first-aid', name: 'First Aid Kit', icon: '🏥', description: 'First aid medical supplies' },
  
  // === PARKING & TRANSPORTATION ===
  { id: 'parking', name: 'Parking Space', icon: '🚗', description: 'Designated parking areas' },
  { id: 'garage', name: 'Garage', icon: '🏠', description: 'Private garage spaces' },
  { id: 'covered-parking', name: 'Covered Parking', icon: '🚙', description: 'Protected parking spaces' },
  { id: 'visitor-parking', name: 'Visitor Parking', icon: '🚘', description: 'Guest parking facilities' },
  { id: 'bike-storage', name: 'Bike Storage', icon: '🚲', description: 'Secure bicycle storage' },
  { id: 'public-transport', name: 'Public Transport', icon: '🚌', description: 'Nearby public transportation' },
  { id: 'metro-access', name: 'Metro Access', icon: '🚇', description: 'Metro station nearby' },
  
  // === COMFORT & CLIMATE ===
  { id: 'air-conditioning', name: 'Air Conditioning', icon: '❄️', description: 'Central or individual AC units' },
  { id: 'heating', name: 'Heating System', icon: '🔥', description: 'Central heating system' },
  { id: 'ceiling-fans', name: 'Ceiling Fans', icon: '🌀', description: 'Ceiling fan installation' },
  { id: 'natural-light', name: 'Natural Light', icon: '☀️', description: 'Abundant natural lighting' },
  { id: 'balcony', name: 'Balcony', icon: '🌅', description: 'Private balcony space' },
  { id: 'terrace', name: 'Terrace', icon: '🏞️', description: 'Outdoor terrace area' },
  
  // === KITCHEN & DINING ===
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', description: 'Fully equipped kitchen' },
  { id: 'modern-kitchen', name: 'Modern Kitchen', icon: '👨‍🍳', description: 'Contemporary kitchen design' },
  { id: 'kitchen-appliances', name: 'Kitchen Appliances', icon: '🔌', description: 'Built-in kitchen appliances' },
  { id: 'dishwasher', name: 'Dishwasher', icon: '🍽️', description: 'Built-in dishwasher' },
  { id: 'microwave', name: 'Microwave', icon: '📡', description: 'Microwave oven' },
  { id: 'refrigerator', name: 'Refrigerator', icon: '❄️', description: 'Refrigerator included' },
  { id: 'dining-area', name: 'Dining Area', icon: '🍽️', description: 'Dedicated dining space' },
  
  // === LIVING SPACES ===
  { id: 'living-room', name: 'Living Room', icon: '🛋️', description: 'Spacious living area' },
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️', description: 'Comfortable bedroom space' },
  { id: 'master-bedroom', name: 'Master Bedroom', icon: '👑', description: 'Large master bedroom' },
  { id: 'walk-in-closet', name: 'Walk-in Closet', icon: '👗', description: 'Spacious wardrobe space' },
  { id: 'bathroom', name: 'Bathroom', icon: '🛁', description: 'Modern bathroom facilities' },
  { id: 'master-bathroom', name: 'Master Bathroom', icon: '🚿', description: 'En-suite master bathroom' },
  { id: 'powder-room', name: 'Powder Room', icon: '🚽', description: 'Guest powder room' },
  
  // === ENTERTAINMENT & TECHNOLOGY ===
  { id: 'tv', name: 'Television', icon: '📺', description: 'Smart TV included' },
  { id: 'home-theater', name: 'Home Theater', icon: '🎬', description: 'Private cinema room' },
  { id: 'sound-system', name: 'Sound System', icon: '🔊', description: 'Built-in audio system' },
  { id: 'gaming-room', name: 'Gaming Room', icon: '🎮', description: 'Dedicated gaming space' },
  { id: 'computer-room', name: 'Computer Room', icon: '💻', description: 'Home office/computer space' },
  { id: 'study-room', name: 'Study Room', icon: '📚', description: 'Quiet study area' },
  
  // === FITNESS & RECREATION ===
  { id: 'gym', name: 'Gym', icon: '💪', description: 'Fitness center with modern equipment' },
  { id: 'swimming-pool', name: 'Swimming Pool', icon: '🏊', description: 'Outdoor or indoor swimming pool' },
  { id: 'tennis-court', name: 'Tennis Court', icon: '🎾', description: 'Tennis facilities' },
  { id: 'basketball-court', name: 'Basketball Court', icon: '🏀', description: 'Basketball court' },
  { id: 'playground', name: 'Playground', icon: '🎪', description: "Children's play area" },
  { id: 'spa', name: 'Spa & Wellness', icon: '🧘', description: 'Relaxation and wellness center' },
  { id: 'sauna', name: 'Sauna', icon: '🧖', description: 'Private sauna facilities' },
  { id: 'jacuzzi', name: 'Jacuzzi', icon: '🛁', description: 'Hot tub or jacuzzi' },
  
  // === OUTDOOR & NATURE ===
  { id: 'garden', name: 'Garden', icon: '🌳', description: 'Landscaped gardens and green spaces' },
  { id: 'rooftop-terrace', name: 'Rooftop Terrace', icon: '🏙️', description: 'Rooftop gathering space' },
  { id: 'patio', name: 'Patio', icon: '🌞', description: 'Outdoor patio area' },
  { id: 'bbq-area', name: 'BBQ Area', icon: '🔥', description: 'Outdoor barbecue facilities' },
  { id: 'outdoor-seating', name: 'Outdoor Seating', icon: '🪑', description: 'Outdoor furniture and seating' },
  { id: 'landscaping', name: 'Landscaping', icon: '🌲', description: 'Professional landscaping' },
  { id: 'green-space', name: 'Green Space', icon: '🌱', description: 'Natural green areas' },
  
  // === SERVICES & AMENITIES ===
  { id: 'concierge', name: 'Concierge', icon: '🎩', description: 'Concierge services' },
  { id: 'housekeeping', name: 'Housekeeping', icon: '🧹', description: 'Cleaning and maintenance service' },
  { id: 'laundry-service', name: 'Laundry Service', icon: '👕', description: 'Professional laundry service' },
  { id: 'dry-cleaning', name: 'Dry Cleaning', icon: '👔', description: 'Dry cleaning pickup service' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', description: 'On-site maintenance team' },
  { id: 'elevator', name: 'Elevator', icon: '🛗', description: 'Modern elevator system' },
  { id: 'storage', name: 'Storage Units', icon: '📦', description: 'Additional storage space' },
  { id: 'mail-service', name: 'Mail Service', icon: '📮', description: 'Mail and package handling' },
  
  // === BUSINESS & WORK ===
  { id: 'business-center', name: 'Business Center', icon: '💼', description: 'Professional workspace' },
  { id: 'meeting-room', name: 'Meeting Room', icon: '🤝', description: 'Conference and meeting facilities' },
  { id: 'co-working-space', name: 'Co-working Space', icon: '💻', description: 'Shared workspace' },
  { id: 'printing-service', name: 'Printing Service', icon: '🖨️', description: 'Print and copy services' },
  { id: 'fax-service', name: 'Fax Service', icon: '📠', description: 'Fax machine access' },
  
  // === DINING & ENTERTAINMENT ===
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', description: 'Fine dining restaurant' },
  { id: 'cafe', name: 'Café', icon: '☕', description: 'Casual coffee shop' },
  { id: 'bar', name: 'Bar', icon: '🍸', description: 'On-site bar and lounge' },
  { id: 'room-service', name: 'Room Service', icon: '🍴', description: 'In-room dining service' },
  { id: 'catering', name: 'Catering', icon: '🎉', description: 'Catering services available' },
  
  // === PET & FAMILY ===
  { id: 'pet-friendly', name: 'Pet Friendly', icon: '🐕', description: 'Pet-friendly policies' },
  { id: 'pet-grooming', name: 'Pet Grooming', icon: '🐩', description: 'Pet grooming services' },
  { id: 'childcare', name: 'Childcare', icon: '👶', description: 'Childcare services' },
  { id: 'nursery', name: 'Nursery', icon: '🧸', description: 'On-site nursery' },
  { id: 'elderly-care', name: 'Elderly Care', icon: '👴', description: 'Senior care services' },
  
  // === HEALTHCARE & MEDICAL ===
  { id: 'medical-center', name: 'Medical Center', icon: '🏥', description: 'On-site medical facility' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', description: 'Pharmacy services' },
  { id: 'dental-clinic', name: 'Dental Clinic', icon: '🦷', description: 'Dental care services' },
  { id: 'emergency-care', name: 'Emergency Care', icon: '🚑', description: 'Emergency medical services' },
  { id: 'telemedicine', name: 'Telemedicine', icon: '📱', description: 'Remote medical consultations' },
  
  // === EDUCATION & LEARNING ===
  { id: 'library', name: 'Library', icon: '📚', description: 'Quiet reading and study area' },
  { id: 'computer-lab', name: 'Computer Lab', icon: '💻', description: 'Computer learning center' },
  { id: 'tutoring', name: 'Tutoring', icon: '🎓', description: 'Educational tutoring services' },
  { id: 'language-classes', name: 'Language Classes', icon: '🗣️', description: 'Language learning programs' },
  { id: 'art-studio', name: 'Art Studio', icon: '🎨', description: 'Creative workspace for artists' },
  
  // === LUXURY & SPECIAL ===
  { id: 'wine-cellar', name: 'Wine Cellar', icon: '🍷', description: 'Temperature-controlled wine storage' },
  { id: 'golf-course', name: 'Golf Course', icon: '⛳', description: 'Golf course access' },
  { id: 'marina', name: 'Marina', icon: '⛵', description: 'Boat docking facilities' },
  { id: 'helipad', name: 'Helipad', icon: '🚁', description: 'Private helicopter landing pad' },
  { id: 'private-chef', name: 'Private Chef', icon: '👨‍🍳', description: 'Personal chef services' },
  { id: 'butler-service', name: 'Butler Service', icon: '🎩', description: 'Personal butler service' },
  { id: 'chauffeur', name: 'Chauffeur', icon: '🚗', description: 'Personal driver service' },
  
  // === LOCATION & ACCESSIBILITY ===
  { id: 'near-schools', name: 'Near Schools', icon: '🏫', description: 'Educational institutions nearby' },
  { id: 'near-hospitals', name: 'Near Hospitals', icon: '🏥', description: 'Medical facilities nearby' },
  { id: 'near-shopping', name: 'Near Shopping', icon: '🛍️', description: 'Shopping centers nearby' },
  { id: 'near-airport', name: 'Near Airport', icon: '✈️', description: 'Airport access nearby' },
  { id: 'near-beach', name: 'Near Beach', icon: '🏖️', description: 'Beach access nearby' },
  { id: 'near-park', name: 'Near Park', icon: '🌳', description: 'Parks and recreation nearby' },
  { id: 'city-center', name: 'City Center', icon: '🏙️', description: 'Located in city center' },
  { id: 'waterfront', name: 'Waterfront', icon: '🌊', description: 'Waterfront location' },
  
  // === SUSTAINABILITY & ECO ===
  { id: 'solar-panels', name: 'Solar Panels', icon: '☀️', description: 'Solar energy system' },
  { id: 'rainwater-harvesting', name: 'Rainwater Harvesting', icon: '🌧️', description: 'Rainwater collection system' },
  { id: 'recycling', name: 'Recycling', icon: '♻️', description: 'Recycling facilities' },
  { id: 'energy-efficient', name: 'Energy Efficient', icon: '⚡', description: 'Energy-efficient appliances' },
  { id: 'green-building', name: 'Green Building', icon: '🌱', description: 'Eco-friendly construction' },
  { id: 'smart-home', name: 'Smart Home', icon: '🤖', description: 'Smart home automation' }
]

// Helper function to get amenity by ID
export const getAmenityById = (id) => {
  return PREDEFINED_AMENITIES.find(amenity => amenity.id === id)
}

// Helper function to get amenity icon by ID
export const getAmenityIcon = (id) => {
  const amenity = getAmenityById(id)
  return amenity ? amenity.icon : '🏠'
}

// Helper function to get amenity name by ID
export const getAmenityName = (id) => {
  const amenity = getAmenityById(id)
  return amenity ? amenity.name : id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
}
