const IMAGE_TEMPLATE = "https://plus.unsplash.com/premium_photo-1689609950112-d66095626efb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cmVhbCUyMGVzdGF0ZXxlbnwwfHwwfHx8MA%3D%3D";

// Helper function to create slug from property name
const createSlug = (propertyName) => {
  return propertyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const properties = [
  {
    propertyName: "Skyline Heights Apartment",
    slug: "skyline-heights-apartment",
    price: 250000,
    homeowner: "homeowner_001",
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Duplex"
    },
    description: "A modern duplex apartment with stunning city views.",
    details: {
      bedrooms: 3,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      balcony: true,
      floor: 10
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Air Conditioning", "Lighting", "Garage", "Elevator"],
    videoUrl: "https://example.com/video1.mp4",
    reviews: [
      { user: "John Doe", comment: "Great location and amenities!", rating: 5 },
      { user: "Jane Smith", comment: "Spacious and modern.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Palm Grove Villa",
    slug: "palm-grove-villa",
    price: 500000,
    homeowner: "homeowner_002",
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Villa"
    },
    description: "Luxury villa with private pool and garden.",
    details: {
      bedrooms: 5,
      kitchen: 2,
      washrooms: 4,
      waterAvailability: true,
      pool: true,
      garden: true
    },
    address: {
      country: "Ghana",
      state: "Western Region",
      city: "Takoradi"
    },
    amenities: ["Swimming Pool", "Garage", "Garden", "Security"],
    videoUrl: "https://example.com/video2.mp4",
    reviews: [
      { user: "Alice Brown", comment: "Perfect for families.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Urban Nest Studio",
    slug: "urban-nest-studio",
    price: 90000,
    homeowner: "homeowner_003",
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "Studio"
    },
    description: "Cozy studio apartment in the heart of the city.",
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true,
      furnished: true
    },
    address: {
      country: "Ghana",
      state: "Ashanti Region",
      city: "Kumasi"
    },
    amenities: ["Lighting", "Furnished", "Security"],
    videoUrl: "https://example.com/video3.mp4",
    reviews: [
      { user: "Samuel Osei", comment: "Affordable and well-located.", rating: 4 }
    ],
    status: "Rented Out",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Garden Estate Duplex",
    slug: "garden-estate-duplex",
    price: 320000,
    homeowner: "homeowner_004",
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Double Duplex"
    },
    description: "Spacious double duplex with a beautiful garden.",
    details: {
      bedrooms: 4,
      kitchen: 1,
      washrooms: 3,
      waterAvailability: true,
      garden: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "East Legon"
    },
    amenities: ["Garage", "Garden", "Lighting"],
    videoUrl: "https://example.com/video4.mp4",
    reviews: [
      { user: "Linda Mensah", comment: "Lovely neighborhood.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Central Business Office",
    slug: "central-business-office",
    price: 1500,
    homeowner: "homeowner_005",
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Shop Office"
    },
    description: "Modern office space in the central business district.",
    details: {
      areaSqFt: 1200,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      parking: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Air Conditioning", "Parking", "Security"],
    videoUrl: "https://example.com/video5.mp4",
    reviews: [
      { user: "Kwame Boateng", comment: "Great for startups.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Sunset Commercial Land",
    slug: "sunset-commercial-land",
    price: 80000,
    categorization: {
      purpose: "Buy",
      sector: "Land",
      category: "Commercial",
      type: "Plot"
    },
    description: "Prime commercial land suitable for development.",
    details: {
      areaAcres: 2,
      waterAvailability: false
    },
    address: {
      country: "Ghana",
      state: "Central Region",
      city: "Cape Coast"
    },
    amenities: ["Accessible Road"],
    videoUrl: "https://example.com/video6.mp4",
    reviews: [
      { user: "Nana Yaa", comment: "Good investment opportunity.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Lakeside Family Home",
    slug: "lakeside-family-home",
    price: 200000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Bungalow"
    },
    description: "Family bungalow with lakeside view.",
    details: {
      bedrooms: 3,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      lakeView: true
    },
    address: {
      country: "Ghana",
      state: "Volta Region",
      city: "Ho"
    },
    amenities: ["Garage", "Garden", "Lighting"],
    videoUrl: "https://example.com/video7.mp4",
    reviews: [
      { user: "Emmanuel Kofi", comment: "Peaceful environment.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "City Center Loft",
    slug: "city-center-loft",
    price: 120000,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Commercial",
      type: "Loft"
    },
    description: "Loft apartment ideal for young professionals.",
    details: {
      bedrooms: 2,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true,
      furnished: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Air Conditioning", "Furnished", "Security"],
    videoUrl: "https://example.com/video8.mp4",
    reviews: [
      { user: "Ama Serwaa", comment: "Trendy and convenient.", rating: 5 }
    ],
    status: "Rented Out",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Greenfield Office Park",
    slug: "greenfield-office-park",
    price: 3000,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Office Suite"
    },
    description: "Spacious office suite in a green environment.",
    details: {
      areaSqFt: 2000,
      kitchen: 1,
      washrooms: 3,
      waterAvailability: true,
      parking: true
    },
    address: {
      country: "Ghana",
      state: "Eastern Region",
      city: "Koforidua"
    },
    amenities: ["Parking", "Security", "Lighting"],
    videoUrl: "https://example.com/video9.mp4",
    reviews: [
      { user: "Yaw Mensah", comment: "Lots of space and greenery.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Sunrise Apartments",
    slug: "sunrise-apartments",
    price: 110000,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Single Room"
    },
    description: "Affordable single room apartments for singles.",
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true
    },
    address: {
      country: "Ghana",
      state: "Northern Region",
      city: "Tamale"
    },
    amenities: ["Lighting", "Security"],
    videoUrl: "https://example.com/video10.mp4",
    reviews: [
      { user: "Fatima Yakubu", comment: "Great for students.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Harbor View Land",
    slug: "harbor-view-land",
    price: 95000,
    categorization: {
      purpose: "Buy",
      sector: "Land",
      category: "Commercial",
      type: "Plot"
    },
    description: "Commercial land with harbor view.",
    details: {
      areaAcres: 1.5,
      waterAvailability: false
    },
    address: {
      country: "Ghana",
      state: "Western Region",
      city: "Sekondi"
    },
    amenities: ["Accessible Road"],
    videoUrl: "https://example.com/video11.mp4",
    reviews: [
      { user: "Kojo Asante", comment: "Nice location for business.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Executive Office Tower",
    slug: "executive-office-tower",
    price: 5000,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Office Tower"
    },
    description: "Premium office tower in the city center.",
    details: {
      areaSqFt: 5000,
      kitchen: 2,
      washrooms: 6,
      waterAvailability: true,
      parking: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Parking", "Security", "Elevator", "Air Conditioning"],
    videoUrl: "https://example.com/video12.mp4",
    reviews: [
      { user: "Patricia Owusu", comment: "Impressive building.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Sunshine Duplex",
    slug: "sunshine-duplex",
    price: 210000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Duplex"
    },
    description: "Bright and airy duplex in a quiet neighborhood.",
    details: {
      bedrooms: 4,
      kitchen: 1,
      washrooms: 3,
      waterAvailability: true,
      balcony: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Tema"
    },
    amenities: ["Garage", "Lighting", "Security"],
    videoUrl: "https://example.com/video13.mp4",
    reviews: [
      { user: "Michael Addo", comment: "Spacious and well-lit.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Riverside Commercial Plot",
    slug: "riverside-commercial-plot",
    price: 120000,
    categorization: {
      purpose: "Buy",
      sector: "Land",
      category: "Commercial",
      type: "Plot"
    },
    description: "Commercial plot by the riverside, ideal for resorts.",
    details: {
      areaAcres: 3,
      waterAvailability: true
    },
    address: {
      country: "Ghana",
      state: "Volta Region",
      city: "Sogakope"
    },
    amenities: ["Accessible Road", "Waterfront"],
    videoUrl: "https://example.com/video14.mp4",
    reviews: [
      { user: "Esi Quartey", comment: "Beautiful view.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Metro City Apartment",
    slug: "metro-city-apartment",
    price: 130000,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "Single Room"
    },
    description: "Modern apartment in the metro city area.",
    details: {
      bedrooms: 2,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true,
      furnished: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Air Conditioning", "Furnished", "Lighting"],
    videoUrl: "https://example.com/video15.mp4",
    reviews: [
      { user: "Nii Lamptey", comment: "Very comfortable.", rating: 4 }
    ],
    status: "Rented Out",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Hilltop Mansion",
    slug: "hilltop-mansion",
    price: 750000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Mansion"
    },
    description: "Luxurious mansion with panoramic hill views.",
    details: {
      bedrooms: 7,
      kitchen: 3,
      washrooms: 6,
      waterAvailability: true,
      pool: true,
      gym: true
    },
    address: {
      country: "Ghana",
      state: "Eastern Region",
      city: "Aburi"
    },
    amenities: ["Swimming Pool", "Gym", "Garage", "Security"],
    videoUrl: "https://example.com/video16.mp4",
    reviews: [
      { user: "Gloria Amankwah", comment: "Absolutely stunning!", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Downtown Shop Office",
    slug: "downtown-shop-office",
    price: 2000,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Shop Office"
    },
    description: "Shop office in the heart of downtown.",
    details: {
      areaSqFt: 900,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Lighting", "Security", "Parking"],
    videoUrl: "https://example.com/video17.mp4",
    reviews: [
      { user: "Yaw Sarpong", comment: "Good for small businesses.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Seaside Commercial Land",
    slug: "seaside-commercial-land",
    price: 180000,
    categorization: {
      purpose: "Buy",
      sector: "Land",
      category: "Commercial",
      type: "Plot"
    },
    description: "Commercial land by the seaside, perfect for hotels.",
    details: {
      areaAcres: 2.5,
      waterAvailability: true
    },
    address: {
      country: "Ghana",
      state: "Central Region",
      city: "Elmina"
    },
    amenities: ["Waterfront", "Accessible Road"],
    videoUrl: "https://example.com/video18.mp4",
    reviews: [
      { user: "Kofi Mensah", comment: "Prime location.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Luxury Penthouse",
    slug: "luxury-penthouse",
    price: 600000,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Penthouse"
    },
    description: "Exclusive penthouse with city skyline views.",
    details: {
      bedrooms: 4,
      kitchen: 2,
      washrooms: 4,
      waterAvailability: true,
      balcony: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra"
    },
    amenities: ["Air Conditioning", "Elevator", "Garage", "Security"],
    videoUrl: "https://example.com/video19.mp4",
    reviews: [
      { user: "Ama Koomson", comment: "Top-notch luxury.", rating: 5 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    propertyName: "Cedar Grove Bungalow",
    slug: "cedar-grove-bungalow",
    price: 175000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Bungalow"
    },
    description: "Charming bungalow in a quiet grove.",
    details: {
      bedrooms: 3,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      garden: true
    },
    address: {
      country: "Ghana",
      state: "Ashanti Region",
      city: "Kumasi"
    },
    amenities: ["Garage", "Garden", "Lighting"],
    videoUrl: "https://example.com/video20.mp4",
    reviews: [
      { user: "Felicia Owusu", comment: "Very cozy and peaceful.", rating: 4 }
    ],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  }
];

// Developments Data
export const developments = [
  {
    id: "dev-001",
    developerId: "dev_001",
    title: "Skyline Heights Complex",
    description: "A premium mixed-use development featuring luxury apartments and commercial spaces in the heart of Accra's business district.",
    developmentType: "Mixed-Use",
    size: "25,000 sq ft",
    status: "completed",
    numberOfBuildings: 3,
    unitTypes: ["Studio", "1-Bedroom", "2-Bedroom", "3-Bedroom", "Commercial"],
    total_units: 120,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Mixed-Use"
    },
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "East Legon",
      coordinates: {
        lat: 5.6145,
        lng: -0.1869
      }
    },
    additionalInfo: {
      completionDate: "2023-12-15",
      developer: "Accra Properties Ltd",
      totalUnits: 120,
      availableUnits: 15
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "dev-002",
    developerId: "dev_002",
    title: "Palm Grove Residential Estate",
    description: "Exclusive residential estate with luxury villas and family homes surrounded by lush gardens and modern amenities.",
    developmentType: "Residential",
    size: "50,000 sq ft",
    status: "ongoing",
    numberOfBuildings: 8,
    unitTypes: ["Villa", "Duplex", "Bungalow"],
    total_units: 24,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Estate"
    },
    location: {
      country: "Ghana",
      state: "Western Region",
      city: "Takoradi",
      neighborhood: "Palm Grove",
      coordinates: {
        lat: 4.9020,
        lng: -1.7608
      }
    },
    additionalInfo: {
      expectedCompletion: "2024-08-30",
      developer: "Western Homes Development",
      totalUnits: 24,
      availableUnits: 8
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "dev-003",
    developerId: "dev_003",
    title: "Central Business Plaza",
    description: "Modern office complex designed for businesses seeking premium workspace in the central business district.",
    developmentType: "Commercial",
    size: "15,000 sq ft",
    status: "inDevelopment",
    numberOfBuildings: 1,
    unitTypes: ["Office Suite", "Shop Office", "Retail Space"],
    total_units: 45,
    categorization: {
      purpose: "Buy",
      sector: "Offices",
      category: "Commercial",
      type: "Office Complex"
    },
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "Central Business District",
      coordinates: {
        lat: 5.5600,
        lng: -0.2057
      }
    },
    additionalInfo: {
      expectedCompletion: "2024-12-15",
      developer: "CBD Properties",
      totalUnits: 45,
      availableUnits: 45
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "dev-004",
    developerId: "dev_004",
    title: "Sunrise Apartments",
    description: "Affordable residential apartments designed for young professionals and families seeking quality housing.",
    developmentType: "Residential",
    size: "30,000 sq ft",
    status: "rtc",
    numberOfBuildings: 4,
    unitTypes: ["Studio", "1-Bedroom", "2-Bedroom"],
    total_units: 80,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "Apartment Complex"
    },
    location: {
      country: "Ghana",
      state: "Ashanti Region",
      city: "Kumasi",
      neighborhood: "Sunrise",
      coordinates: {
        lat: 6.6885,
        lng: -1.6244
      }
    },
    additionalInfo: {
      expectedCompletion: "2024-06-30",
      developer: "Kumasi Housing Solutions",
      totalUnits: 80,
      availableUnits: 80
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "dev-005",
    developerId: "dev_005",
    title: "Luxury Waterfront Villas",
    description: "Exclusive waterfront development featuring luxury villas with private beach access and premium amenities.",
    developmentType: "Luxury",
    size: "75,000 sq ft",
    status: "completed",
    numberOfBuildings: 12,
    unitTypes: ["Villa", "Penthouse", "Duplex"],
    total_units: 18,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Luxury",
      type: "Waterfront"
    },
    location: {
      country: "Ghana",
      state: "Central Region",
      city: "Cape Coast",
      neighborhood: "Beachfront",
      coordinates: {
        lat: 5.1053,
        lng: -1.2466
      }
    },
    additionalInfo: {
      completionDate: "2023-08-20",
      developer: "Luxury Coastal Properties",
      totalUnits: 18,
      availableUnits: 3
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "dev-006",
    developerId: "dev_006",
    title: "Industrial Park Complex",
    description: "Modern industrial complex designed for manufacturing and logistics companies with state-of-the-art facilities.",
    developmentType: "Industrial",
    size: "200,000 sq ft",
    status: "ongoing",
    numberOfBuildings: 15,
    unitTypes: ["Warehouse", "Factory", "Office Space"],
    total_units: 25,
    categorization: {
      purpose: "Buy",
      sector: "Industrial",
      category: "Commercial",
      type: "Industrial Park"
    },
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Tema",
      neighborhood: "Industrial Area",
      coordinates: {
        lat: 5.6168,
        lng: -0.0173
      }
    },
    additionalInfo: {
      expectedCompletion: "2024-10-15",
      developer: "Tema Industrial Development",
      totalUnits: 25,
      availableUnits: 25
    },
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  }
];

// Units Data
export const units = [
  {
    id: "unit-001",
    developmentId: "dev-001",
    unitNumber: "A101",
    title: "Luxury Studio Apartment",
    description: "Modern studio apartment with city views and premium finishes.",
    price: 180000,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Studio"
    },
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      areaSqFt: 650,
      floor: 1,
      waterAvailability: true,
      furnished: true,
      balcony: true
    },
    amenities: ["Air Conditioning", "Furnished", "Balcony", "Security", "Elevator"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-002",
    developmentId: "dev-001",
    unitNumber: "A205",
    title: "2-Bedroom Family Apartment",
    description: "Spacious 2-bedroom apartment perfect for families with children.",
    price: 320000,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "2-Bedroom"
    },
    details: {
      bedrooms: 2,
      kitchen: 1,
      washrooms: 2,
      areaSqFt: 1200,
      floor: 2,
      waterAvailability: true,
      furnished: false,
      balcony: true
    },
    amenities: ["Air Conditioning", "Balcony", "Security", "Elevator", "Parking"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-003",
    developmentId: "dev-001",
    unitNumber: "C101",
    title: "Commercial Office Space",
    description: "Premium office space suitable for startups and established businesses.",
    price: 2500,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Office Suite"
    },
    details: {
      areaSqFt: 1500,
      kitchen: 1,
      washrooms: 2,
      floor: 1,
      waterAvailability: true,
      parking: true
    },
    amenities: ["Air Conditioning", "Parking", "Security", "Elevator", "Reception"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-004",
    developmentId: "dev-002",
    unitNumber: "Villa-01",
    title: "Luxury 5-Bedroom Villa",
    description: "Exclusive villa with private pool, garden, and premium amenities.",
    price: 850000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Villa"
    },
    details: {
      bedrooms: 5,
      kitchen: 2,
      washrooms: 4,
      areaSqFt: 3500,
      waterAvailability: true,
      pool: true,
      garden: true,
      garage: true
    },
    amenities: ["Swimming Pool", "Garden", "Garage", "Security", "Air Conditioning"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-005",
    developmentId: "dev-002",
    unitNumber: "Duplex-03",
    title: "Modern Duplex House",
    description: "Contemporary duplex with open floor plan and modern design.",
    price: 420000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Duplex"
    },
    details: {
      bedrooms: 4,
      kitchen: 1,
      washrooms: 3,
      areaSqFt: 2200,
      waterAvailability: true,
      garden: true,
      balcony: true
    },
    amenities: ["Garden", "Balcony", "Security", "Air Conditioning", "Garage"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-006",
    developmentId: "dev-003",
    unitNumber: "Office-201",
    title: "Executive Office Suite",
    description: "Premium office suite with conference facilities and modern amenities.",
    price: 4500,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Office Suite"
    },
    details: {
      areaSqFt: 2500,
      kitchen: 1,
      washrooms: 3,
      floor: 2,
      waterAvailability: true,
      parking: true,
      conferenceRoom: true
    },
    amenities: ["Conference Room", "Parking", "Security", "Air Conditioning", "Reception"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-007",
    developmentId: "dev-003",
    unitNumber: "Shop-101",
    title: "Retail Shop Space",
    description: "Prime retail space in high-traffic commercial area.",
    price: 3000,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Shop Office"
    },
    details: {
      areaSqFt: 800,
      kitchen: 0,
      washrooms: 1,
      floor: 1,
      waterAvailability: true,
      parking: true
    },
    amenities: ["Parking", "Security", "Air Conditioning", "Storefront"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-008",
    developmentId: "dev-004",
    unitNumber: "Studio-301",
    title: "Affordable Studio Apartment",
    description: "Cozy studio apartment perfect for students and young professionals.",
    price: 800,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "Studio"
    },
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      areaSqFt: 450,
      floor: 3,
      waterAvailability: true,
      furnished: true
    },
    amenities: ["Furnished", "Security", "Lighting", "Air Conditioning"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-009",
    developmentId: "dev-004",
    unitNumber: "1BR-401",
    title: "1-Bedroom Family Apartment",
    description: "Comfortable 1-bedroom apartment with modern amenities.",
    price: 1200,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "1-Bedroom"
    },
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      areaSqFt: 750,
      floor: 4,
      waterAvailability: true,
      furnished: false,
      balcony: true
    },
    amenities: ["Balcony", "Security", "Lighting", "Air Conditioning", "Parking"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  },
  {
    id: "unit-010",
    developmentId: "dev-004",
    unitNumber: "2BR-502",
    title: "Spacious 2-Bedroom Apartment",
    description: "Large 2-bedroom apartment with extra storage and modern design.",
    price: 1800,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "2-Bedroom"
    },
    details: {
      bedrooms: 2,
      kitchen: 1,
      washrooms: 2,
      areaSqFt: 1100,
      floor: 5,
      waterAvailability: true,
      furnished: false,
      balcony: true,
      storage: true
    },
    amenities: ["Balcony", "Storage", "Security", "Lighting", "Air Conditioning", "Parking"],
    status: "Available",
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE]
  }
];

// Appointments Data
export const appointments = [
  {
    id: "appt_85738",
    homeseeker_id: "user_9876",
    developer_id: "agent_1234",
    property_id: "prop_9012",
    appointment_type: "in_person",
    date: "2025-07-10",
    start_time: "14:30",
    end_time: "15:00",
    status: "pending",
    location: "12 Boundary Road, East Legon, Accra",
    notes: "I'd like to know more about the kitchen and outdoor space.",
    created_at: "2025-07-07T08:32:00Z",
    updated_at: "2025-07-07T08:32:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+233 24 123 4567"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Client showed strong interest in the property. Will follow up with detailed pricing information.",
      response_date: "2025-07-07T10:15:00Z"
    },
    development_and_unit: {
      development_name: "Skyline Heights Complex",
      unit_name: "Luxury Studio Apartment",
      location: "12 Boundary Road, East Legon, Accra"
    }
  },
  {
    id: "appt_85739",
    homeseeker_id: "user_9877",
    developer_id: "dev_5678",
    property_id: "prop_9013",
    appointment_type: "video_call",
    date: "2025-07-11",
    start_time: "10:00",
    end_time: "10:30",
    status: "confirmed",
    location: "Zoom Meeting",
    notes: "Interested in the 3-bedroom apartment. Would like to see the floor plan and discuss payment options.",
    created_at: "2025-07-07T09:15:00Z",
    updated_at: "2025-07-07T14:20:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Michael Osei",
      email: "michael.osei@email.com",
      phone: "+233 26 234 5678"
    },
    developer: {
      name: "Accra Properties Ltd",
      email: "info@accraproperties.com",
      phone: "+233 30 111 2222"
    },
    response: {
      additional_notes: "Meeting confirmed. Will share floor plan and payment schedule. Client seems serious about purchase.",
      response_date: "2025-07-07T14:20:00Z"
    },
    development_and_unit: {
      development_name: "Palm Grove Residential Estate",
      unit_name: "Luxury 5-Bedroom Villa",
      location: "45 Ring Road Central, Accra"
    }
  },
  {
    id: "appt_85740",
    homeseeker_id: "user_9878",
    developer_id: "agent_1235",
    property_id: "prop_9014",
    appointment_type: "in_person",
    date: "2025-07-12",
    start_time: "16:00",
    end_time: "16:30",
    status: "completed",
    location: "45 Ring Road Central, Accra",
    notes: "Want to see the commercial office space and discuss lease terms.",
    created_at: "2025-07-06T11:30:00Z",
    updated_at: "2025-07-12T16:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Ama Serwaa",
      email: "ama.serwaa@email.com",
      phone: "+233 27 345 6789"
    },
    agent: {
      name: "Grace Mensah",
      email: "grace.mensah@iskahomes.com",
      phone: "+233 24 876 5432"
    },
    response: {
      additional_notes: "Meeting completed successfully. Client signed lease agreement. Property will be ready for occupancy next month.",
      response_date: "2025-07-12T16:45:00Z"
    },
    development_and_unit: {
      development_name: "Central Business Plaza",
      unit_name: "Commercial Office Space",
      location: "45 Ring Road Central, Accra"
    }
  },
  {
    id: "appt_85741",
    homeseeker_id: "user_9879",
    developer_id: "dev_5679",
    property_id: "prop_9015",
    appointment_type: "video_call",
    date: "2025-07-13",
    start_time: "11:00",
    end_time: "11:30",
    status: "cancelled",
    location: "Google Meet",
    notes: "Interested in the luxury villa. Need to discuss financing options.",
    created_at: "2025-07-07T13:45:00Z",
    updated_at: "2025-07-12T09:30:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "David Kofi",
      email: "david.kofi@email.com",
      phone: "+233 25 456 7890"
    },
    developer: {
      name: "Western Homes Development",
      email: "contact@westernhomes.com",
      phone: "+233 31 222 3333"
    },
    response: {
      additional_notes: "Client cancelled due to emergency. Rescheduled for next week. Will send new appointment details.",
      response_date: "2025-07-12T09:30:00Z"
    },
    development_and_unit: {
      development_name: "Palm Grove Residential Estate",
      unit_name: "Luxury 5-Bedroom Villa",
      location: "Google Meet"
    }
  },
  {
    id: "appt_85742",
    homeseeker_id: "user_9880",
    developer_id: "agent_1236",
    property_id: "prop_9016",
    appointment_type: "in_person",
    date: "2025-07-14",
    start_time: "13:00",
    end_time: "13:30",
    status: "pending",
    location: "78 Cantonments Road, Accra",
    notes: "Looking for a family home. Want to see the garden and check the neighborhood.",
    created_at: "2025-07-08T10:20:00Z",
    updated_at: "2025-07-08T10:20:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Linda Addo",
      email: "linda.addo@email.com",
      phone: "+233 23 567 8901"
    },
    agent: {
      name: "Yaw Sarpong",
      email: "yaw.sarpong@iskahomes.com",
      phone: "+233 26 765 4321"
    },
    response: {
      additional_notes: "Awaiting confirmation from client. Property is perfect for families with children.",
      response_date: "2025-07-08T15:30:00Z"
    },
    development_and_unit: {
      development_name: "Lakeside Family Home",
      unit_name: "Family Bungalow",
      location: "78 Cantonments Road, Accra"
    }
  },
  {
    id: "appt_85743",
    homeseeker_id: "user_9881",
    developer_id: "dev_5680",
    property_id: "prop_9017",
    appointment_type: "video_call",
    date: "2025-07-15",
    start_time: "15:00",
    end_time: "15:30",
    status: "confirmed",
    location: "Microsoft Teams",
    notes: "Interested in the studio apartment for investment purposes. Need rental yield information.",
    created_at: "2025-07-08T14:15:00Z",
    updated_at: "2025-07-08T16:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Kwame Boateng",
      email: "kwame.boateng@email.com",
      phone: "+233 28 678 9012"
    },
    developer: {
      name: "Kumasi Housing Solutions",
      email: "sales@kumasihousing.com",
      phone: "+233 32 333 4444"
    },
    response: {
      additional_notes: "Confirmed meeting. Will prepare rental yield analysis and investment projections.",
      response_date: "2025-07-08T16:45:00Z"
    },
    development_and_unit: {
      development_name: "Sunrise Apartments",
      unit_name: "Affordable Studio Apartment",
      location: "Microsoft Teams"
    }
  },
  {
    id: "appt_85744",
    homeseeker_id: "user_9882",
    developer_id: "agent_1237",
    property_id: "prop_9018",
    appointment_type: "in_person",
    date: "2025-07-16",
    start_time: "09:00",
    end_time: "09:30",
    status: "pending",
    location: "23 Airport Residential Area, Accra",
    notes: "Want to see the penthouse. Interested in the city views and amenities.",
    created_at: "2025-07-09T08:30:00Z",
    updated_at: "2025-07-09T08:30:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Patricia Owusu",
      email: "patricia.owusu@email.com",
      phone: "+233 29 789 0123"
    },
    agent: {
      name: "Felicia Amankwah",
      email: "felicia.amankwah@iskahomes.com",
      phone: "+233 25 654 3210"
    },
    response: {
      additional_notes: "Client has high purchasing power. Penthouse matches their requirements perfectly.",
      response_date: "2025-07-09T12:00:00Z"
    },
    development_and_unit: {
      development_name: "Hilltop Mansion",
      unit_name: "Luxury Penthouse",
      location: "23 Airport Residential Area, Accra"
    }
  },
  {
    id: "appt_85745",
    homeseeker_id: "user_9883",
    developer_id: "dev_5681",
    property_id: "prop_9019",
    appointment_type: "video_call",
    date: "2025-07-17",
    start_time: "12:00",
    end_time: "12:30",
    status: "confirmed",
    location: "Zoom Meeting",
    notes: "Looking for commercial land. Need to discuss development potential and zoning regulations.",
    created_at: "2025-07-09T11:45:00Z",
    updated_at: "2025-07-09T14:20:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Emmanuel Kofi",
      email: "emmanuel.kofi@email.com",
      phone: "+233 24 890 1234"
    },
    developer: {
      name: "CBD Properties",
      email: "info@cbdproperties.com",
      phone: "+233 33 444 5555"
    },
    response: {
      additional_notes: "Meeting confirmed. Will provide zoning documentation and development feasibility study.",
      response_date: "2025-07-09T14:20:00Z"
    },
    development_and_unit: {
      development_name: "Sunset Commercial Land",
      unit_name: "Prime Commercial Land",
      location: "Microsoft Teams"
    }
  },
  {
    id: "appt_85746",
    homeseeker_id: "user_9884",
    developer_id: "agent_1238",
    property_id: "prop_9020",
    appointment_type: "in_person",
    date: "2025-07-18",
    start_time: "14:00",
    end_time: "14:30",
    status: "completed",
    location: "56 Tema Community 1, Tema",
    notes: "Interested in the bungalow. Want to check the water supply and electricity.",
    created_at: "2025-07-07T16:20:00Z",
    updated_at: "2025-07-18T14:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Nana Yaa",
      email: "nana.yaa@email.com",
      phone: "+233 26 901 2345"
    },
    agent: {
      name: "Samuel Osei",
      email: "samuel.osei@iskahomes.com",
      phone: "+233 27 543 2109"
    },
    response: {
      additional_notes: "Property inspection completed. Client satisfied with utilities. Will proceed with purchase agreement.",
      response_date: "2025-07-18T14:45:00Z"
    },
    development_and_unit: {
      development_name: "Lakeside Family Home",
      unit_name: "Family Bungalow",
      location: "56 Tema Community 1, Tema"
    }
  },
  {
    id: "appt_85747",
    homeseeker_id: "user_9885",
    developer_id: "dev_5682",
    property_id: "prop_9021",
    appointment_type: "video_call",
    date: "2025-07-19",
    start_time: "10:30",
    end_time: "11:00",
    status: "pending",
    location: "Google Meet",
    notes: "Looking for office space for startup. Need flexible lease terms.",
    created_at: "2025-07-10T09:15:00Z",
    updated_at: "2025-07-10T09:15:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Ama Koomson",
      email: "ama.koomson@email.com",
      phone: "+233 25 012 3456"
    },
    developer: {
      name: "Greenfield Office Park",
      email: "leasing@greenfieldoffice.com",
      phone: "+233 34 555 6666"
    },
    response: {
      additional_notes: "Startup-friendly leasing options available. Will prepare flexible terms proposal.",
      response_date: "2025-07-10T13:30:00Z"
    },
    development_and_unit: {
      development_name: "Greenfield Office Park",
      unit_name: "Spacious Office Suite",
      location: "Google Meet"
    }
  },
  {
    id: "appt_85748",
    homeseeker_id: "user_9886",
    developer_id: "agent_1239",
    property_id: "prop_9022",
    appointment_type: "in_person",
    date: "2025-07-20",
    start_time: "16:30",
    end_time: "17:00",
    status: "confirmed",
    location: "34 East Legon, Accra",
    notes: "Want to see the duplex. Interested in the modern design and finishes.",
    created_at: "2025-07-10T14:30:00Z",
    updated_at: "2025-07-10T15:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Yaw Mensah",
      email: "yaw.mensah@email.com",
      phone: "+233 27 123 4567"
    },
    agent: {
      name: "Gloria Addo",
      email: "gloria.addo@iskahomes.com",
      phone: "+233 28 432 1098"
    },
    response: {
      additional_notes: "Meeting confirmed. Property features premium finishes and modern amenities.",
      response_date: "2025-07-10T15:45:00Z"
    },
    development_and_unit: {
      development_name: "Sunrise Apartments",
      unit_name: "Spacious 2-Bedroom Apartment",
      location: "34 East Legon, Accra"
    }
  },
  {
    id: "appt_85749",
    homeseeker_id: "user_9887",
    developer_id: "dev_5683",
    property_id: "prop_9023",
    appointment_type: "video_call",
    date: "2025-07-21",
    start_time: "13:30",
    end_time: "14:00",
    status: "cancelled",
    location: "Microsoft Teams",
    notes: "Interested in the mansion. Need to discuss financing and payment plans.",
    created_at: "2025-07-11T10:00:00Z",
    updated_at: "2025-07-20T11:15:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Fatima Yakubu",
      email: "fatima.yakubu@email.com",
      phone: "+233 24 234 5678"
    },
    developer: {
      name: "Luxury Homes Ghana",
      email: "sales@luxuryhomesgh.com",
      phone: "+233 35 666 7777"
    },
    response: {
      additional_notes: "Client requested cancellation due to travel. Will reschedule upon return.",
      response_date: "2025-07-20T11:15:00Z"
    },
    development_and_unit: {
      development_name: "Hilltop Mansion",
      unit_name: "Luxurious Mansion",
      location: "Microsoft Teams"
    }
  },
  {
    id: "appt_85750",
    homeseeker_id: "user_9888",
    developer_id: "agent_1240",
    property_id: "prop_9024",
    appointment_type: "in_person",
    date: "2025-07-22",
    start_time: "11:00",
    end_time: "11:30",
    status: "pending",
    location: "12 Kumasi Road, Kumasi",
    notes: "Looking for student accommodation. Need furnished single room.",
    created_at: "2025-07-11T15:45:00Z",
    updated_at: "2025-07-11T15:45:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Kofi Asante",
      email: "kofi.asante@email.com",
      phone: "+233 26 345 6789"
    },
    agent: {
      name: "Nii Lamptey",
      email: "nii.lamptey@iskahomes.com",
      phone: "+233 29 321 0987"
    },
    response: {
      additional_notes: "Perfect for student accommodation. Will prepare lease agreement with student-friendly terms.",
      response_date: "2025-07-11T17:20:00Z"
    },
    development_and_unit: {
      development_name: "Sunrise Apartments",
      unit_name: "Affordable Studio Apartment",
      location: "12 Kumasi Road, Kumasi"
    }
  },
  {
    id: "appt_85751",
    homeseeker_id: "user_9889",
    developer_id: "dev_5684",
    property_id: "prop_9025",
    appointment_type: "video_call",
    date: "2025-07-23",
    start_time: "14:00",
    end_time: "14:30",
    status: "confirmed",
    location: "Zoom Meeting",
    notes: "Interested in commercial plot. Need to discuss development timeline and costs.",
    created_at: "2025-07-12T08:30:00Z",
    updated_at: "2025-07-12T10:15:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Esi Quartey",
      email: "esi.quartey@email.com",
      phone: "+233 25 456 7890"
    },
    developer: {
      name: "Prime Land Developers",
      email: "info@primelandgh.com",
      phone: "+233 36 777 8888"
    },
    response: {
      additional_notes: "Meeting confirmed. Will provide detailed development cost breakdown and timeline.",
      response_date: "2025-07-12T10:15:00Z"
    },
    development_and_unit: {
      development_name: "Riverside Commercial Plot",
      unit_name: "Commercial Plot by the River",
      location: "Zoom Meeting"
    }
  },
  {
    id: "appt_85752",
    homeseeker_id: "user_9890",
    developer_id: "agent_1241",
    property_id: "prop_9026",
    appointment_type: "in_person",
    date: "2025-07-24",
    start_time: "15:30",
    end_time: "16:00",
    status: "completed",
    location: "78 Ho Central, Ho",
    notes: "Want to see the lakeside property. Interested in the view and tranquility.",
    created_at: "2025-07-12T12:00:00Z",
    updated_at: "2025-07-24T16:15:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Alice Brown",
      email: "alice.brown@email.com",
      phone: "+233 27 567 8901"
    },
    agent: {
      name: "Mensah Kwame",
      email: "mensah.kwame@iskahomes.com",
      phone: "+233 30 210 9876"
    },
    response: {
      additional_notes: "Property viewing completed. Client impressed with the lake view and peaceful environment.",
      response_date: "2025-07-24T16:15:00Z"
    },
    development_and_unit: {
      development_name: "Lakeside Family Home",
      unit_name: "Family Bungalow",
      location: "78 Ho Central, Ho"
    }
  },
  {
    id: "appt_85753",
    homeseeker_id: "user_9891",
    developer_id: "dev_5685",
    property_id: "prop_9027",
    appointment_type: "video_call",
    date: "2025-07-25",
    start_time: "09:30",
    end_time: "10:00",
    status: "pending",
    location: "Google Meet",
    notes: "Looking for retail space. Need high foot traffic location.",
    created_at: "2025-07-13T14:20:00Z",
    updated_at: "2025-07-13T14:20:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Kojo Sarpong",
      email: "kojo.sarpong@email.com",
      phone: "+233 24 678 9012"
    },
    developer: {
      name: "Retail Space Ghana",
      email: "leasing@retailspacegh.com",
      phone: "+233 37 888 9999"
    },
    response: {
      additional_notes: "High foot traffic location available. Will provide traffic analysis and lease terms.",
      response_date: "2025-07-13T16:45:00Z"
    },
    development_and_unit: {
      development_name: "Sunrise Apartments",
      unit_name: "Affordable Single Room Apartment",
      location: "Google Meet"
    }
  },
  {
    id: "appt_85754",
    homeseeker_id: "user_9892",
    developer_id: "agent_1242",
    property_id: "prop_9028",
    appointment_type: "in_person",
    date: "2025-07-26",
    start_time: "12:30",
    end_time: "13:00",
    status: "confirmed",
    location: "45 Cape Coast Road, Cape Coast",
    notes: "Interested in the seaside property. Want to check the beach access.",
    created_at: "2025-07-13T16:30:00Z",
    updated_at: "2025-07-13T18:00:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Nana Kwame",
      email: "nana.kwame@email.com",
      phone: "+233 26 789 0123"
    },
    agent: {
      name: "Adwoa Serwaa",
      email: "adwoa.serwaa@iskahomes.com",
      phone: "+233 31 109 8765"
    },
    response: {
      additional_notes: "Meeting confirmed. Property has direct beach access and stunning ocean views.",
      response_date: "2025-07-13T18:00:00Z"
    },
    development_and_unit: {
      development_name: "Harbor View Land",
      unit_name: "Commercial Land with Harbor View",
      location: "45 Cape Coast Road, Cape Coast"
    }
  },
  {
    id: "appt_85755",
    homeseeker_id: "user_9893",
    developer_id: "dev_5686",
    property_id: "prop_9029",
    appointment_type: "video_call",
    date: "2025-07-27",
    start_time: "16:00",
    end_time: "16:30",
    status: "pending",
    location: "Microsoft Teams",
    notes: "Looking for warehouse space. Need large storage area and loading dock.",
    created_at: "2025-07-14T09:45:00Z",
    updated_at: "2025-07-14T09:45:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Yaw Owusu",
      email: "yaw.owusu@email.com",
      phone: "+233 25 890 1234"
    },
    developer: {
      name: "Industrial Properties Ltd",
      email: "info@industrialproperties.com",
      phone: "+233 38 999 0000"
    },
    response: {
      additional_notes: "Large warehouse space available with loading dock. Will provide floor plan and lease terms.",
      response_date: "2025-07-14T12:30:00Z"
    },
    development_and_unit: {
      development_name: "Riverside Commercial Plot",
      unit_name: "Commercial Plot by the River",
      location: "Microsoft Teams"
    }
  },
  {
    id: "appt_85756",
    homeseeker_id: "user_9894",
    developer_id: "agent_1243",
    property_id: "prop_9030",
    appointment_type: "in_person",
    date: "2025-07-28",
    start_time: "10:00",
    end_time: "10:30",
    status: "confirmed",
    location: "23 Takoradi Harbor, Takoradi",
    notes: "Interested in the harbor view property. Want to discuss investment potential.",
    created_at: "2025-07-14T13:15:00Z",
    updated_at: "2025-07-14T15:30:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Ama Osei",
      email: "ama.osei@email.com",
      phone: "+233 27 901 2345"
    },
    agent: {
      name: "Kwame Addo",
      email: "kwame.addo@iskahomes.com",
      phone: "+233 32 098 7654"
    },
    response: {
      additional_notes: "Meeting confirmed. Property has excellent investment potential with harbor views.",
      response_date: "2025-07-14T15:30:00Z"
    },
    development_and_unit: {
      development_name: "Harbor View Land",
      unit_name: "Commercial Land with Harbor View",
      location: "23 Takoradi Harbor, Takoradi"
    }
  },
  {
    id: "appt_85757",
    homeseeker_id: "user_9895",
    developer_id: "dev_5687",
    property_id: "prop_9031",
    appointment_type: "video_call",
    date: "2025-07-29",
    start_time: "13:00",
    end_time: "13:30",
    status: "pending",
    location: "Zoom Meeting",
    notes: "Looking for agricultural land. Need fertile soil and water access.",
    created_at: "2025-07-15T11:00:00Z",
    updated_at: "2025-07-15T11:00:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Kofi Mensah",
      email: "kofi.mensah@email.com",
      phone: "+233 24 012 3456"
    },
    developer: {
      name: "Agricultural Land Ghana",
      email: "sales@aglandgh.com",
      phone: "+233 39 000 1111"
    },
    response: {
      additional_notes: "Fertile agricultural land available with water access. Will provide soil test results.",
      response_date: "2025-07-15T14:20:00Z"
    },
    development_and_unit: {
      development_name: "Sunset Commercial Land",
      unit_name: "Prime Commercial Land",
      location: "Zoom Meeting"
    }
  }
];

// Leads Data - Profile views and bookings over time
export const leadsData = [
  { date: '2024-01-01', prospects: 45, leads: 12 },
  { date: '2024-01-02', prospects: 52, leads: 15 },
  { date: '2024-01-03', prospects: 38, leads: 8 },
  { date: '2024-01-04', prospects: 67, leads: 22 },
  { date: '2024-01-05', prospects: 78, leads: 28 },
  { date: '2024-01-06', prospects: 89, leads: 35 },
  { date: '2024-01-07', prospects: 95, leads: 42 },
  { date: '2024-01-08', prospects: 103, leads: 48 },
  { date: '2024-01-09', prospects: 112, leads: 55 },
  { date: '2024-01-10', prospects: 125, leads: 62 },
  { date: '2024-01-11', prospects: 138, leads: 68 },
  { date: '2024-01-12', prospects: 145, leads: 75 },
  { date: '2024-01-13', prospects: 132, leads: 71 },
  { date: '2024-01-14', prospects: 156, leads: 82 },
  { date: '2024-01-15', prospects: 167, leads: 89 },
  { date: '2024-01-16', prospects: 178, leads: 95 },
  { date: '2024-01-17', prospects: 189, leads: 102 },
  { date: '2024-01-18', prospects: 195, leads: 108 },
  { date: '2024-01-19', prospects: 208, leads: 115 },
  { date: '2024-01-20', prospects: 220, leads: 122 },
  { date: '2024-01-21', prospects: 235, leads: 128 },
  { date: '2024-01-22', prospects: 248, leads: 135 },
  { date: '2024-01-23', prospects: 256, leads: 142 },
  { date: '2024-01-24', prospects: 267, leads: 148 },
  { date: '2024-01-25', prospects: 278, leads: 155 },
  { date: '2024-01-26', prospects: 289, leads: 162 },
  { date: '2024-01-27', prospects: 295, leads: 168 },
  { date: '2024-01-28', prospects: 308, leads: 175 },
  { date: '2024-01-29', prospects: 320, leads: 182 },
  { date: '2024-01-30', prospects: 335, leads: 188 }
];

// Detailed leads information
export const detailedLeads = [
  {
    id: "lead_001",
    type: "prospect",
    propertyId: "prop_001",
    propertyName: "Skyline Heights Apartment",
    userId: "user_001",
    userName: "John Doe",
    userEmail: "john.doe@email.com",
    userPhone: "+233 24 123 4567",
    action: "profile_view",
    timestamp: "2024-01-15T10:30:00Z",
    duration: 45, // seconds spent viewing
    source: "search_results",
    status: "new"
  },
  {
    id: "lead_002",
    type: "lead",
    propertyId: "prop_001",
    propertyName: "Skyline Heights Apartment",
    userId: "user_002",
    userName: "Sarah Johnson",
    userEmail: "sarah.johnson@email.com",
    userPhone: "+233 26 234 5678",
    action: "message_sent",
    timestamp: "2024-01-15T14:20:00Z",
    messageContent: "I'm interested in this property. Can you provide more details about the payment plan?",
    source: "property_page",
    status: "contacted"
  },
  {
    id: "lead_003",
    type: "lead",
    propertyId: "prop_002",
    propertyName: "Palm Grove Villa",
    userId: "user_003",
    userName: "Michael Osei",
    userEmail: "michael.osei@email.com",
    userPhone: "+233 27 345 6789",
    action: "appointment_scheduled",
    timestamp: "2024-01-16T09:15:00Z",
    appointmentDate: "2024-01-18T14:00:00Z",
    source: "property_page",
    status: "scheduled"
  },
  {
    id: "lead_004",
    type: "prospect",
    propertyId: "prop_003",
    propertyName: "Urban Nest Studio",
    userId: "user_004",
    userName: "Alice Brown",
    userEmail: "alice.brown@email.com",
    userPhone: "+233 25 456 7890",
    action: "profile_view",
    timestamp: "2024-01-16T16:45:00Z",
    duration: 120,
    source: "social_media",
    status: "new"
  },
  {
    id: "lead_005",
    type: "lead",
    propertyId: "prop_004",
    propertyName: "Garden Estate Duplex",
    userId: "user_005",
    userName: "Linda Mensah",
    userEmail: "linda.mensah@email.com",
    userPhone: "+233 28 567 8901",
    action: "message_sent",
    timestamp: "2024-01-17T11:30:00Z",
    messageContent: "Is this property still available? I'd like to schedule a viewing.",
    source: "property_page",
    status: "contacted"
  },
  {
    id: "lead_006",
    type: "prospect",
    propertyId: "prop_005",
    propertyName: "Central Business Office",
    userId: "user_006",
    userName: "Kwame Boateng",
    userEmail: "kwame.boateng@email.com",
    userPhone: "+233 29 678 9012",
    action: "profile_view",
    timestamp: "2024-01-17T15:20:00Z",
    duration: 85,
    source: "search_results",
    status: "new"
  },
  {
    id: "lead_007",
    type: "lead",
    propertyId: "prop_006",
    propertyName: "Sunset Commercial Land",
    userId: "user_007",
    userName: "Nana Yaa",
    userEmail: "nana.yaa@email.com",
    userPhone: "+233 24 789 0123",
    action: "appointment_scheduled",
    timestamp: "2024-01-18T08:45:00Z",
    appointmentDate: "2024-01-20T10:00:00Z",
    source: "property_page",
    status: "scheduled"
  },
  {
    id: "lead_008",
    type: "prospect",
    propertyId: "prop_007",
    propertyName: "Lakeside Family Home",
    userId: "user_008",
    userName: "Emmanuel Kofi",
    userEmail: "emmanuel.kofi@email.com",
    userPhone: "+233 26 890 1234",
    action: "profile_view",
    timestamp: "2024-01-18T13:10:00Z",
    duration: 200,
    source: "email_campaign",
    status: "new"
  },
  {
    id: "lead_009",
    type: "lead",
    propertyId: "prop_008",
    propertyName: "City Center Loft",
    userId: "user_009",
    userName: "Ama Serwaa",
    userEmail: "ama.serwaa@email.com",
    userPhone: "+233 27 901 2345",
    action: "message_sent",
    timestamp: "2024-01-17T12:00:00Z",
    messageContent: "What are the monthly rental terms? Is it pet-friendly?",
    source: "property_page",
    status: "contacted"
  },
  {
    id: "lead_010",
    type: "prospect",
    propertyId: "prop_009",
    propertyName: "Greenfield Office Park",
    userId: "user_010",
    userName: "Yaw Mensah",
    userEmail: "yaw.mensah@email.com",
    userPhone: "+233 25 012 3456",
    action: "profile_view",
    timestamp: "2024-01-19T17:30:00Z",
    duration: 65,
    source: "search_results",
    status: "new"
  }
];

// Agent Appointments Data - Simplified for agents dealing with properties
export const agentAppointments = [
  {
    id: "agent_appt_001",
    agent_id: "agent_1234",
    homeseeker_id: "user_001",
    property_id: "prop_001",
    propertyName: "Skyline Heights Apartment",
    appointment_type: "in_person",
    date: "2025-01-15",
    start_time: "14:30",
    end_time: "15:00",
    status: "confirmed",
    location: "12 Boundary Road, East Legon, Accra",
    notes: "Client interested in the 2-bedroom apartment. Wants to see the kitchen and balcony.",
    created_at: "2025-01-12T08:30:00Z",
    updated_at: "2025-01-12T10:15:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+233 24 123 4567"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Client showed strong interest. Will follow up with pricing details.",
      response_date: "2025-01-12T10:15:00Z"
    }
  },
  {
    id: "agent_appt_002",
    agent_id: "agent_1234",
    homeseeker_id: "user_002",
    property_id: "prop_002",
    propertyName: "Palm Grove Villa",
    appointment_type: "video_call",
    date: "2025-01-16",
    start_time: "10:00",
    end_time: "10:30",
    status: "pending",
    location: "Zoom Meeting",
    notes: "Interested in the luxury villa. Wants to discuss financing options.",
    created_at: "2025-01-13T09:15:00Z",
    updated_at: "2025-01-13T09:15:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Michael Osei",
      email: "michael.osei@email.com",
      phone: "+233 26 234 5678"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Awaiting client confirmation for video call.",
      response_date: "2025-01-13T14:20:00Z"
    }
  },
  {
    id: "agent_appt_003",
    agent_id: "agent_1234",
    homeseeker_id: "user_003",
    property_id: "prop_003",
    propertyName: "Urban Nest Studio",
    appointment_type: "in_person",
    date: "2025-01-17",
    start_time: "16:00",
    end_time: "16:30",
    status: "completed",
    location: "45 Ring Road Central, Accra",
    notes: "Student looking for affordable studio apartment near university.",
    created_at: "2025-01-10T11:30:00Z",
    updated_at: "2025-01-17T16:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Alice Brown",
      email: "alice.brown@email.com",
      phone: "+233 27 345 6789"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Property viewing completed. Client signed rental agreement.",
      response_date: "2025-01-17T16:45:00Z"
    }
  },
  {
    id: "agent_appt_004",
    agent_id: "agent_1234",
    homeseeker_id: "user_004",
    property_id: "prop_004",
    propertyName: "Garden Estate Duplex",
    appointment_type: "in_person",
    date: "2025-01-18",
    start_time: "13:00",
    end_time: "13:30",
    status: "confirmed",
    location: "78 Cantonments Road, Accra",
    notes: "Family interested in the duplex. Want to check the garden and neighborhood.",
    created_at: "2025-01-14T14:20:00Z",
    updated_at: "2025-01-14T15:30:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Linda Mensah",
      email: "linda.mensah@email.com",
      phone: "+233 25 456 7890"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Meeting confirmed. Property is perfect for families.",
      response_date: "2025-01-14T15:30:00Z"
    }
  },
  {
    id: "agent_appt_005",
    agent_id: "agent_1234",
    homeseeker_id: "user_005",
    property_id: "prop_005",
    propertyName: "Central Business Office",
    appointment_type: "video_call",
    date: "2025-01-19",
    start_time: "11:00",
    end_time: "11:30",
    status: "cancelled",
    location: "Google Meet",
    notes: "Startup looking for office space. Need flexible lease terms.",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-18T09:30:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Kwame Boateng",
      email: "kwame.boateng@email.com",
      phone: "+233 28 567 8901"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Client cancelled due to emergency. Will reschedule.",
      response_date: "2025-01-18T09:30:00Z"
    }
  },
  {
    id: "agent_appt_006",
    agent_id: "agent_1234",
    homeseeker_id: "user_006",
    property_id: "prop_006",
    propertyName: "Sunset Commercial Land",
    appointment_type: "in_person",
    date: "2025-01-20",
    start_time: "09:00",
    end_time: "09:30",
    status: "confirmed",
    location: "23 Airport Residential Area, Accra",
    notes: "Investor interested in commercial land for development.",
    created_at: "2025-01-16T13:15:00Z",
    updated_at: "2025-01-16T14:45:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Nana Yaa",
      email: "nana.yaa@email.com",
      phone: "+233 29 678 9012"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Meeting confirmed. Will provide development feasibility study.",
      response_date: "2025-01-16T14:45:00Z"
    }
  },
  {
    id: "agent_appt_007",
    agent_id: "agent_1234",
    homeseeker_id: "user_007",
    property_id: "prop_007",
    propertyName: "Lakeside Family Home",
    appointment_type: "in_person",
    date: "2025-01-21",
    start_time: "15:30",
    end_time: "16:00",
    status: "pending",
    location: "56 Tema Community 1, Tema",
    notes: "Family looking for lakeside property. Interested in the view and tranquility.",
    created_at: "2025-01-17T16:20:00Z",
    updated_at: "2025-01-17T16:20:00Z",
    confirmed_by_agent: false,
    is_reminder_sent: false,
    homeseeker: {
      name: "Emmanuel Kofi",
      email: "emmanuel.kofi@email.com",
      phone: "+233 24 789 0123"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Awaiting client confirmation. Property has excellent lake views.",
      response_date: "2025-01-17T17:30:00Z"
    }
  },
  {
    id: "agent_appt_008",
    agent_id: "agent_1234",
    homeseeker_id: "user_008",
    property_id: "prop_008",
    propertyName: "City Center Loft",
    appointment_type: "video_call",
    date: "2025-01-22",
    start_time: "12:00",
    end_time: "12:30",
    status: "confirmed",
    location: "Microsoft Teams",
    notes: "Young professional interested in loft apartment. Wants to see virtual tour.",
    created_at: "2025-01-18T11:45:00Z",
    updated_at: "2025-01-18T13:00:00Z",
    confirmed_by_agent: true,
    is_reminder_sent: true,
    homeseeker: {
      name: "Ama Serwaa",
      email: "ama.serwaa@email.com",
      phone: "+233 26 890 1234"
    },
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    },
    response: {
      additional_notes: "Meeting confirmed. Will prepare virtual tour presentation.",
      response_date: "2025-01-18T13:00:00Z"
    }
  }
];

// Agent Properties Data - Properties listed by agents
export const agentProperties = [
  {
    id: "agent_prop_001",
    agent_id: "agent_1234",
    propertyName: "Skyline Heights Apartment",
    slug: "skyline-heights-apartment-agent",
    price: 250000,
    categorization: {
      purpose: "Buy",
      sector: "Apartment",
      category: "Residential",
      type: "Duplex"
    },
    description: "A modern duplex apartment with stunning city views, perfect for young professionals.",
    details: {
      bedrooms: 3,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      balcony: true,
      floor: 10
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "East Legon",
      street: "12 Boundary Road"
    },
    amenities: ["Air Conditioning", "Lighting", "Garage", "Elevator", "Security"],
    status: "Available",
    listingDate: "2024-12-15",
    views: 156,
    inquiries: 23,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_002",
    agent_id: "agent_1234",
    propertyName: "Palm Grove Villa",
    slug: "palm-grove-villa-agent",
    price: 500000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Villa"
    },
    description: "Luxury villa with private pool and garden, ideal for families seeking exclusivity.",
    details: {
      bedrooms: 5,
      kitchen: 2,
      washrooms: 4,
      waterAvailability: true,
      pool: true,
      garden: true
    },
    address: {
      country: "Ghana",
      state: "Western Region",
      city: "Takoradi",
      neighborhood: "Palm Grove",
      street: "45 Ring Road Central"
    },
    amenities: ["Swimming Pool", "Garage", "Garden", "Security", "Air Conditioning"],
    status: "Available",
    listingDate: "2024-12-10",
    views: 89,
    inquiries: 12,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_003",
    agent_id: "agent_1234",
    propertyName: "Urban Nest Studio",
    slug: "urban-nest-studio-agent",
    price: 90000,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Residential",
      type: "Studio"
    },
    description: "Cozy studio apartment in the heart of the city, perfect for students and young professionals.",
    details: {
      bedrooms: 1,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true,
      furnished: true
    },
    address: {
      country: "Ghana",
      state: "Ashanti Region",
      city: "Kumasi",
      neighborhood: "Central Business District",
      street: "78 Cantonments Road"
    },
    amenities: ["Lighting", "Furnished", "Security", "Air Conditioning"],
    status: "Rented Out",
    listingDate: "2024-11-20",
    views: 234,
    inquiries: 45,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_004",
    agent_id: "agent_1234",
    propertyName: "Garden Estate Duplex",
    slug: "garden-estate-duplex-agent",
    price: 320000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Double Duplex"
    },
    description: "Spacious double duplex with a beautiful garden, perfect for large families.",
    details: {
      bedrooms: 4,
      kitchen: 1,
      washrooms: 3,
      waterAvailability: true,
      garden: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "East Legon",
      neighborhood: "Garden Estate",
      street: "23 Airport Residential Area"
    },
    amenities: ["Garage", "Garden", "Lighting", "Security"],
    status: "Available",
    listingDate: "2024-12-05",
    views: 123,
    inquiries: 18,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_005",
    agent_id: "agent_1234",
    propertyName: "Central Business Office",
    slug: "central-business-office-agent",
    price: 1500,
    categorization: {
      purpose: "Lease",
      sector: "Offices",
      category: "Commercial",
      type: "Shop Office"
    },
    description: "Modern office space in the central business district, ideal for startups and established businesses.",
    details: {
      areaSqFt: 1200,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      parking: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "Central Business District",
      street: "56 Tema Community 1"
    },
    amenities: ["Air Conditioning", "Parking", "Security", "Reception"],
    status: "Available",
    listingDate: "2024-12-12",
    views: 67,
    inquiries: 8,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_006",
    agent_id: "agent_1234",
    propertyName: "Sunset Commercial Land",
    slug: "sunset-commercial-land-agent",
    price: 80000,
    categorization: {
      purpose: "Buy",
      sector: "Land",
      category: "Commercial",
      type: "Plot"
    },
    description: "Prime commercial land suitable for development, with excellent road access.",
    details: {
      areaAcres: 2,
      waterAvailability: false
    },
    address: {
      country: "Ghana",
      state: "Central Region",
      city: "Cape Coast",
      neighborhood: "Sunset Area",
      street: "34 East Legon"
    },
    amenities: ["Accessible Road", "Security"],
    status: "Available",
    listingDate: "2024-11-25",
    views: 45,
    inquiries: 6,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_007",
    agent_id: "agent_1234",
    propertyName: "Lakeside Family Home",
    slug: "lakeside-family-home-agent",
    price: 200000,
    categorization: {
      purpose: "Buy",
      sector: "House",
      category: "Residential",
      type: "Bungalow"
    },
    description: "Family bungalow with lakeside view, offering tranquility and modern amenities.",
    details: {
      bedrooms: 3,
      kitchen: 1,
      washrooms: 2,
      waterAvailability: true,
      lakeView: true
    },
    address: {
      country: "Ghana",
      state: "Volta Region",
      city: "Ho",
      neighborhood: "Lakeside",
      street: "12 Kumasi Road"
    },
    amenities: ["Garage", "Garden", "Lighting", "Security"],
    status: "Available",
    listingDate: "2024-12-08",
    views: 178,
    inquiries: 29,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  },
  {
    id: "agent_prop_008",
    agent_id: "agent_1234",
    propertyName: "City Center Loft",
    slug: "city-center-loft-agent",
    price: 120000,
    categorization: {
      purpose: "Rent",
      sector: "Apartment",
      category: "Commercial",
      type: "Loft"
    },
    description: "Loft apartment ideal for young professionals, featuring modern design and city views.",
    details: {
      bedrooms: 2,
      kitchen: 1,
      washrooms: 1,
      waterAvailability: true,
      furnished: true
    },
    address: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "City Center",
      street: "45 Cape Coast Road"
    },
    amenities: ["Air Conditioning", "Furnished", "Security", "Balcony"],
    status: "Rented Out",
    listingDate: "2024-11-15",
    views: 312,
    inquiries: 67,
    projectImages: [IMAGE_TEMPLATE, IMAGE_TEMPLATE, IMAGE_TEMPLATE],
    agent: {
      name: "Kwame Asante",
      email: "kwame.asante@iskahomes.com",
      phone: "+233 20 987 6543"
    }
  }
];

// Homeowners Data
export const homeowners = [
  {
    id: "homeowner_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+233 24 123 4567",
    details: "Experienced property investor with 10+ years in real estate",
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "East Legon"
    },
    totalProperties: 8,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_002",
    name: "Michael Osei",
    email: "michael.osei@email.com",
    phone: "+233 26 234 5678",
    details: "Business owner looking to expand property portfolio",
    location: {
      country: "Ghana",
      state: "Western Region",
      city: "Takoradi",
      neighborhood: "Palm Grove"
    },
    totalProperties: 12,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_003",
    name: "Alice Brown",
    email: "alice.brown@email.com",
    phone: "+233 27 345 6789",
    details: "Retired professional with residential properties",
    location: {
      country: "Ghana",
      state: "Ashanti Region",
      city: "Kumasi",
      neighborhood: "Central Business District"
    },
    totalProperties: 5,
    membershipPlan: "Standard",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_004",
    name: "Linda Mensah",
    email: "linda.mensah@email.com",
    phone: "+233 28 456 7890",
    details: "Family-oriented homeowner with multiple rental properties",
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "East Legon",
      neighborhood: "Garden Estate"
    },
    totalProperties: 6,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_005",
    name: "Kwame Boateng",
    email: "kwame.boateng@email.com",
    phone: "+233 29 567 8901",
    details: "Startup founder with commercial property interests",
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "Central Business District"
    },
    totalProperties: 3,
    membershipPlan: "Standard",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_006",
    name: "Nana Yaa",
    email: "nana.yaa@email.com",
    phone: "+233 24 678 9012",
    details: "Real estate developer with extensive portfolio",
    location: {
      country: "Ghana",
      state: "Central Region",
      city: "Cape Coast",
      neighborhood: "Sunset Area"
    },
    totalProperties: 15,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_007",
    name: "Emmanuel Kofi",
    email: "emmanuel.kofi@email.com",
    phone: "+233 26 789 0123",
    details: "Young professional with investment properties",
    location: {
      country: "Ghana",
      state: "Volta Region",
      city: "Ho",
      neighborhood: "Lakeside"
    },
    totalProperties: 4,
    membershipPlan: "Standard",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_008",
    name: "Ama Serwaa",
    email: "ama.serwaa@email.com",
    phone: "+233 27 890 1234",
    details: "Property manager with residential and commercial holdings",
    location: {
      country: "Ghana",
      state: "Greater Accra",
      city: "Accra",
      neighborhood: "City Center"
    },
    totalProperties: 9,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_009",
    name: "Yaw Mensah",
    email: "yaw.mensah@email.com",
    phone: "+233 25 901 2345",
    details: "Retired banker with diverse property investments",
    location: {
      country: "Ghana",
      state: "Eastern Region",
      city: "Koforidua",
      neighborhood: "Greenfield"
    },
    totalProperties: 7,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  },
  {
    id: "homeowner_010",
    name: "Patricia Owusu",
    email: "patricia.owusu@email.com",
    phone: "+233 29 012 3456",
    details: "Entrepreneur with luxury property portfolio",
    location: {
      country: "Ghana",
      state: "Eastern Region",
      city: "Aburi",
      neighborhood: "Hilltop"
    },
    totalProperties: 11,
    membershipPlan: "Premium",
    assignedAgents: ["12345"]
  }
];

export default properties;

// Dummy data for views
export const viewsData = [
  { date: '2024-01-01', viewCount: 1250 },
  { date: '2024-01-02', viewCount: 1380 },
  { date: '2024-01-03', viewCount: 1120 },
  { date: '2024-01-04', viewCount: 1650 },
  { date: '2024-01-05', viewCount: 1890 },
  { date: '2024-01-06', viewCount: 2100 },
  { date: '2024-01-07', viewCount: 1950 },
  { date: '2024-01-08', viewCount: 2200 },
  { date: '2024-01-09', viewCount: 2400 },
  { date: '2024-01-10', viewCount: 2600 },
  { date: '2024-01-11', viewCount: 2800 },
  { date: '2024-01-12', viewCount: 3100 },
  { date: '2024-01-13', viewCount: 2900 },
  { date: '2024-01-14', viewCount: 3200 },
  { date: '2024-01-15', viewCount: 3500 },
  { date: '2024-01-16', viewCount: 3800 },
  { date: '2024-01-17', viewCount: 4100 },
  { date: '2024-01-18', viewCount: 4400 },
  { date: '2024-01-19', viewCount: 4700 },
  { date: '2024-01-20', viewCount: 5000 },
  { date: '2024-01-21', viewCount: 5300 },
  { date: '2024-01-22', viewCount: 5600 },
  { date: '2024-01-23', viewCount: 5900 },
  { date: '2024-01-24', viewCount: 6200 },
  { date: '2024-01-25', viewCount: 6500 },
  { date: '2024-01-26', viewCount: 6800 },
  { date: '2024-01-27', viewCount: 7100 },
  { date: '2024-01-28', viewCount: 7400 },
  { date: '2024-01-29', viewCount: 7700 },
  { date: '2024-01-30', viewCount: 8000 }
];

// Dummy data for impressions
export const impressionsData = [
  { date: '2024-01-01', impressionCount: 3200 },
  { date: '2024-01-02', impressionCount: 3500 },
  { date: '2024-01-03', impressionCount: 3100 },
  { date: '2024-01-04', impressionCount: 4200 },
  { date: '2024-01-05', impressionCount: 4800 },
  { date: '2024-01-06', impressionCount: 5200 },
  { date: '2024-01-07', impressionCount: 4900 },
  { date: '2024-01-08', impressionCount: 5500 },
  { date: '2024-01-09', impressionCount: 6000 },
  { date: '2024-01-10', impressionCount: 6500 },
  { date: '2024-01-11', impressionCount: 7000 },
  { date: '2024-01-12', impressionCount: 7500 },
  { date: '2024-01-13', impressionCount: 7200 },
  { date: '2024-01-14', impressionCount: 7800 },
  { date: '2024-01-15', impressionCount: 8200 },
  { date: '2024-01-16', impressionCount: 8700 },
  { date: '2024-01-17', impressionCount: 9200 },
  { date: '2024-01-18', impressionCount: 9700 },
  { date: '2024-01-19', impressionCount: 10200 },
  { date: '2024-01-20', impressionCount: 10700 },
  { date: '2024-01-21', impressionCount: 11200 },
  { date: '2024-01-22', impressionCount: 11700 },
  { date: '2024-01-23', impressionCount: 12200 },
  { date: '2024-01-24', impressionCount: 12700 },
  { date: '2024-01-25', impressionCount: 13200 },
  { date: '2024-01-26', impressionCount: 13700 },
  { date: '2024-01-27', impressionCount: 14200 },
  { date: '2024-01-28', impressionCount: 14700 },
  { date: '2024-01-29', impressionCount: 15200 },
  { date: '2024-01-30', impressionCount: 15700 }
];

// Agent Reviews Data
export const agentReviews = [
  {
    id: "review_001",
    reviewerName: "Sarah Johnson",
    reviewerEmail: "sarah.johnson@email.com",
    stars: 5,
    review: "Kwame was incredibly professional and helped me find the perfect home in East Legon. His knowledge of the area and attention to detail made the entire process smooth and enjoyable.",
    date: "2024-01-15",
    agentId: "12345"
  },
  {
    id: "review_002",
    reviewerName: "Michael Osei",
    reviewerEmail: "michael.osei@email.com",
    stars: 4,
    review: "Great experience working with this agent. Found a beautiful property that met all my requirements. Very responsive and professional throughout the process.",
    date: "2024-01-20",
    agentId: "12345"
  },
  {
    id: "review_003",
    reviewerName: "Alice Brown",
    reviewerEmail: "alice.brown@email.com",
    stars: 5,
    review: "Exceptional service! The agent went above and beyond to help me find the right investment property. Highly recommend for anyone looking to buy or rent.",
    date: "2024-02-05",
    agentId: "12345"
  },
  {
    id: "review_004",
    reviewerName: "Linda Mensah",
    reviewerEmail: "linda.mensah@email.com",
    stars: 4,
    review: "Very knowledgeable about the local market. Helped me understand the best areas for rental properties and provided excellent guidance.",
    date: "2024-02-12",
    agentId: "12345"
  },
  {
    id: "review_005",
    reviewerName: "Kwame Boateng",
    reviewerEmail: "kwame.boateng@email.com",
    stars: 5,
    review: "Outstanding agent! Found me a commercial property that perfectly suited my business needs. The negotiation process was handled professionally.",
    date: "2024-02-18",
    agentId: "12345"
  },
  {
    id: "review_006",
    reviewerName: "Nana Yaa",
    reviewerEmail: "nana.yaa@email.com",
    stars: 5,
    review: "This agent has extensive knowledge of the real estate market. Helped me make informed decisions about my property investments. Excellent communication skills.",
    date: "2024-03-01",
    agentId: "12345"
  },
  {
    id: "review_007",
    reviewerName: "Emmanuel Kofi",
    reviewerEmail: "emmanuel.kofi@email.com",
    stars: 4,
    review: "Professional and reliable agent. Found me a great rental property within my budget. Very patient and understanding of my requirements.",
    date: "2024-03-08",
    agentId: "12345"
  },
  {
    id: "review_008",
    reviewerName: "Ama Serwaa",
    reviewerEmail: "ama.serwaa@email.com",
    stars: 5,
    review: "Excellent service from start to finish. The agent was very thorough in understanding my needs and found the perfect property. Highly recommend!",
    date: "2024-03-15",
    agentId: "12345"
  },
  {
    id: "review_009",
    reviewerName: "Yaw Mensah",
    reviewerEmail: "yaw.mensah@email.com",
    stars: 4,
    review: "Great experience working with this agent. Very knowledgeable about different neighborhoods and helped me make the right choice for my family.",
    date: "2024-03-22",
    agentId: "12345"
  },
  {
    id: "review_010",
    reviewerName: "Patricia Owusu",
    reviewerEmail: "patricia.owusu@email.com",
    stars: 5,
    review: "Outstanding professionalism and market knowledge. Helped me find a luxury property that exceeded my expectations. The entire process was seamless.",
    date: "2024-04-01",
    agentId: "12345"
  },
  {
    id: "review_011",
    reviewerName: "David Addo",
    reviewerEmail: "david.addo@email.com",
    stars: 4,
    review: "Very responsive and professional agent. Found me a great investment property in a prime location. Good understanding of market trends.",
    date: "2024-04-08",
    agentId: "12345"
  },
  {
    id: "review_012",
    reviewerName: "Grace Asante",
    reviewerEmail: "grace.asante@email.com",
    stars: 5,
    review: "Exceptional service! The agent was very patient and helped me find exactly what I was looking for. Great communication throughout the process.",
    date: "2024-04-15",
    agentId: "12345"
  },
  {
    id: "review_013",
    reviewerName: "Kofi Mensah",
    reviewerEmail: "kofi.mensah@email.com",
    stars: 4,
    review: "Professional and knowledgeable agent. Helped me understand the property market and made the buying process much easier than expected.",
    date: "2024-04-22",
    agentId: "12345"
  },
  {
    id: "review_014",
    reviewerName: "Abena Osei",
    reviewerEmail: "abena.osei@email.com",
    stars: 5,
    review: "Amazing experience! The agent was very thorough and found me a beautiful home that perfectly suited my lifestyle. Highly recommend their services.",
    date: "2024-05-01",
    agentId: "12345"
  },
  {
    id: "review_015",
    reviewerName: "Kwesi Addo",
    reviewerEmail: "kwesi.addo@email.com",
    stars: 4,
    review: "Great agent with excellent market knowledge. Helped me find a rental property that met all my requirements. Very professional approach.",
    date: "2024-05-08",
    agentId: "12345"
  },
  {
    id: "review_016",
    reviewerName: "Efua Brown",
    reviewerEmail: "efua.brown@email.com",
    stars: 5,
    review: "Outstanding service! The agent was very attentive to my needs and found me the perfect property. The entire process was smooth and professional.",
    date: "2024-05-15",
    agentId: "12345"
  },
  {
    id: "review_017",
    reviewerName: "Kojo Wilson",
    reviewerEmail: "kojo.wilson@email.com",
    stars: 4,
    review: "Very professional and reliable agent. Helped me navigate the property market and find a great investment opportunity. Good communication skills.",
    date: "2024-05-22",
    agentId: "12345"
  },
  {
    id: "review_018",
    reviewerName: "Ama Kufuor",
    reviewerEmail: "ama.kufuor@email.com",
    stars: 5,
    review: "Excellent agent with deep market knowledge. Found me a beautiful property that exceeded my expectations. Very responsive and professional.",
    date: "2024-06-01",
    agentId: "12345"
  },
  {
    id: "review_019",
    reviewerName: "Yaw Darko",
    reviewerEmail: "yaw.darko@email.com",
    stars: 4,
    review: "Great experience working with this agent. Very knowledgeable about different areas and helped me make an informed decision about my property purchase.",
    date: "2024-06-08",
    agentId: "12345"
  },
  {
    id: "review_020",
    reviewerName: "Akosua Boateng",
    reviewerEmail: "akosua.boateng@email.com",
    stars: 5,
    review: "Outstanding service and professionalism! The agent was very patient and helped me find the perfect home for my family. Highly recommend their services.",
    date: "2024-06-15",
    agentId: "12345"
  }
];
