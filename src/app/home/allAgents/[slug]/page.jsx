'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Layout1 from '@/app/layout/Layout1'
import { 
  FiStar, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiMessageSquare, 
  FiHome, 
  FiCheckCircle, 
  FiCalendar,
  FiAward,
  FiGlobe,
  FiLinkedin,
  FiTwitter,
  FiInstagram,
  FiArrowLeft,
  FiHeart,
  FiShare2
} from 'react-icons/fi'

const AgentProfile = () => {
  const params = useParams()
  const agentSlug = params.slug
  const [activeTab, setActiveTab] = useState('overview')

  // Dummy data for all agents (in real app, this would be fetched from API)
  const allAgents = [
    {
      id: 1,
      slug: 'kwame-asante',
      name: 'Kwame Asante',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Accra, Greater Accra',
      specializations: ['Residential', 'Commercial', 'Luxury'],
      listings: 24,
      rating: 4.8,
      reviewCount: 156,
      verified: true,
      experience: '8+ years',
      languages: ['English', 'Twi', 'Ga'],
      bio: 'Experienced real estate agent with over 8 years of expertise in residential and commercial properties across Greater Accra. Specializing in luxury properties and investment opportunities. I have helped hundreds of families find their dream homes and investors maximize their returns.',
      phone: '+233 20 987 6543',
      email: 'kwame.asante@iskahomes.com',
      licenseNumber: 'REA-2024-001234',
      joinDate: '2020-03-15',
      socialMedia: {
        linkedin: 'kwame-asante-realestate',
        twitter: '@kwameasante',
        instagram: 'kwame.asante.re'
      },
      achievements: [
        'Top Performer 2023',
        'Best Customer Service 2022',
        'Luxury Property Specialist',
        'Million Dollar Club Member'
      ],
      properties: [
        {
          id: 1,
          title: 'Luxury Villa - East Legon',
          price: '$450,000',
          location: 'East Legon, Accra',
          image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&h=200&fit=crop',
          bedrooms: 5,
          bathrooms: 4,
          area: '450 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Modern Apartment - Airport Residential',
          price: '$280,000',
          location: 'Airport Residential, Accra',
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '180 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 3,
          title: 'Office Space - Cantonments',
          price: '$2,500/month',
          location: 'Cantonments, Accra',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 2,
          area: '300 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 4,
          title: 'Penthouse - Ridge',
          price: '$650,000',
          location: 'Ridge, Accra',
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '320 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 5,
          title: 'Townhouse - Osu',
          price: '$380,000',
          location: 'Osu, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '220 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 6,
          title: 'Studio Apartment - Labone',
          price: '$800/month',
          location: 'Labone, Accra',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 1,
          bathrooms: 1,
          area: '45 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 7,
          title: 'Commercial Building - Adabraka',
          price: '$1,800,000',
          location: 'Adabraka, Accra',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 6,
          area: '1200 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 8,
          title: 'Family Home - Dzorwulu',
          price: '$520,000',
          location: 'Dzorwulu, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '380 sqm',
          type: 'For Sale',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Sarah Johnson',
          rating: 5,
          date: '2024-01-15',
          comment: 'Kwame was incredibly professional and helped us find our dream home. His knowledge of the market is exceptional and he made the entire process smooth and stress-free.',
          property: 'Luxury Villa - East Legon'
        },
        {
          id: 2,
          reviewer: 'Michael Osei',
          rating: 5,
          date: '2024-01-10',
          comment: 'Excellent service! Kwame understood exactly what we were looking for and found us the perfect investment property. Highly recommended!',
          property: 'Modern Apartment - Airport Residential'
        },
        {
          id: 3,
          reviewer: 'Grace Addo',
          rating: 4,
          date: '2024-01-05',
          comment: 'Very knowledgeable agent who really knows the local market. Helped us navigate the buying process with confidence.',
          property: 'Office Space - Cantonments'
        }
      ]
    },
    {
      id: 2,
      slug: 'sarah-johnson',
      name: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Kumasi, Ashanti',
      specializations: ['Residential', 'Rental'],
      listings: 18,
      rating: 4.6,
      reviewCount: 89,
      verified: true,
      experience: '5+ years',
      languages: ['English', 'Twi'],
      bio: 'Dedicated real estate professional with 5 years of experience helping families find their perfect homes in Kumasi and surrounding areas. I specialize in residential properties and rental management, ensuring every client finds their ideal living space.',
      phone: '+233 24 567 8901',
      email: 'sarah.johnson@iskahomes.com',
      licenseNumber: 'REA-2024-005678',
      joinDate: '2019-08-20',
      socialMedia: {
        linkedin: 'sarah-johnson-realestate',
        twitter: '@sarahjohnson',
        instagram: 'sarah.johnson.re'
      },
      achievements: [
        'Customer Choice Award 2023',
        'Rental Specialist 2022',
        'Top 10 Agents Kumasi Region'
      ],
      properties: [
        {
          id: 1,
          title: 'Family Home - Ahodwo',
          price: '$320,000',
          location: 'Ahodwo, Kumasi',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '280 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Apartment - Bantama',
          price: '$800/month',
          location: 'Bantama, Kumasi',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 1,
          area: '120 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 3,
          title: 'Townhouse - Manhyia',
          price: '$280,000',
          location: 'Manhyia, Kumasi',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '200 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 4,
          title: 'Studio - Adum',
          price: '$600/month',
          location: 'Adum, Kumasi',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 1,
          bathrooms: 1,
          area: '60 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 5,
          title: 'Family Compound - Santasi',
          price: '$450,000',
          location: 'Santasi, Kumasi',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 5,
          bathrooms: 4,
          area: '500 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 6,
          title: '2-Bedroom Apartment - Kwadaso',
          price: '$950/month',
          location: 'Kwadaso, Kumasi',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 2,
          area: '100 sqm',
          type: 'For Rent',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Kwame Asante',
          rating: 5,
          date: '2024-01-12',
          comment: 'Sarah helped us find the perfect rental property. She was very patient and understood our requirements perfectly.',
          property: 'Apartment - Bantama'
        },
        {
          id: 2,
          reviewer: 'Ama Kufuor',
          rating: 4,
          date: '2024-01-08',
          comment: 'Professional service and great knowledge of the Kumasi market. Highly recommended for families.',
          property: 'Family Home - Ahodwo'
        }
      ]
    },
    {
      id: 3,
      slug: 'michael-osei',
      name: 'Michael Osei',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Tema, Greater Accra',
      specializations: ['Commercial', 'Industrial'],
      listings: 32,
      rating: 4.9,
      reviewCount: 203,
      verified: true,
      experience: '12+ years',
      languages: ['English', 'Twi', 'Ewe'],
      bio: 'Commercial real estate expert with over 12 years of experience in industrial and office properties. I specialize in helping businesses find the perfect commercial spaces and investment opportunities.',
      phone: '+233 26 345 6789',
      email: 'michael.osei@iskahomes.com',
      licenseNumber: 'REA-2024-003456',
      joinDate: '2012-03-10',
      socialMedia: {
        linkedin: 'michael-osei-commercial',
        twitter: '@michaelosei',
        instagram: 'michael.osei.re'
      },
      achievements: [
        'Commercial Agent of the Year 2023',
        'Industrial Property Expert',
        'Million Dollar Sales Club'
      ],
      properties: [
        {
          id: 1,
          title: 'Industrial Warehouse - Tema Port',
          price: '$1,200,000',
          location: 'Tema Port, Tema',
          image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 2,
          area: '2000 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Office Complex - Community 1',
          price: '$15,000/month',
          location: 'Community 1, Tema',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 8,
          area: '800 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 3,
          title: 'Retail Space - Community 2',
          price: '$8,500/month',
          location: 'Community 2, Tema',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 3,
          area: '400 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 4,
          title: 'Manufacturing Facility - Industrial Area',
          price: '$2,500,000',
          location: 'Industrial Area, Tema',
          image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 4,
          area: '3500 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 5,
          title: 'Office Building - Community 3',
          price: '$950,000',
          location: 'Community 3, Tema',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 12,
          area: '1500 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 6,
          title: 'Storage Facility - Tema Port',
          price: '$12,000/month',
          location: 'Tema Port, Tema',
          image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 2,
          area: '2500 sqm',
          type: 'For Rent',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'David Mensah',
          rating: 5,
          date: '2024-01-14',
          comment: 'Michael is the go-to person for commercial properties. His expertise in industrial real estate is unmatched.',
          property: 'Industrial Warehouse - Tema Port'
        },
        {
          id: 2,
          reviewer: 'Emmanuel Boateng',
          rating: 5,
          date: '2024-01-09',
          comment: 'Excellent commercial property specialist. Helped us secure the perfect office space for our business.',
          property: 'Office Complex - Community 1'
        }
      ]
    },
    {
      id: 4,
      slug: 'ama-kufuor',
      name: 'Ama Kufuor',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Cape Coast, Central',
      specializations: ['Residential', 'Vacation Homes'],
      listings: 15,
      rating: 4.4,
      reviewCount: 67,
      verified: false,
      experience: '3+ years',
      languages: ['English', 'Fante'],
      bio: 'Specializing in residential properties and vacation homes along the beautiful Cape Coast. I help families find their dream homes and investors discover profitable vacation rental opportunities.',
      phone: '+233 27 890 1234',
      email: 'ama.kufuor@iskahomes.com',
      licenseNumber: 'REA-2024-007890',
      joinDate: '2021-06-15',
      socialMedia: {
        linkedin: 'ama-kufuor-properties',
        twitter: '@amakufuor',
        instagram: 'ama.kufuor.re'
      },
      achievements: [
        'Rising Star 2023',
        'Vacation Home Specialist',
        'Best New Agent Central Region'
      ],
      properties: [
        {
          id: 1,
          title: 'Beachfront Villa - Elmina',
          price: '$380,000',
          location: 'Elmina, Cape Coast',
          image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '320 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Holiday Apartment - Cape Coast Castle',
          price: '$120/night',
          location: 'Cape Coast Castle Area',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 1,
          area: '100 sqm',
          type: 'Vacation Rental',
          featured: false
        },
        {
          id: 3,
          title: 'Seaside Cottage - Anomabo',
          price: '$280,000',
          location: 'Anomabo, Cape Coast',
          image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '200 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 4,
          title: 'Vacation Villa - Kakum National Park',
          price: '$200/night',
          location: 'Kakum National Park Area',
          image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '280 sqm',
          type: 'Vacation Rental',
          featured: true
        },
        {
          id: 5,
          title: 'Family Home - Cape Coast Central',
          price: '$220,000',
          location: 'Cape Coast Central',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '180 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 6,
          title: 'Beach Resort Unit - Saltpond',
          price: '$150/night',
          location: 'Saltpond, Central Region',
          image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 1,
          area: '80 sqm',
          type: 'Vacation Rental',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Grace Addo',
          rating: 4,
          date: '2024-01-11',
          comment: 'Ama helped us find a beautiful vacation home. Great knowledge of the Cape Coast area.',
          property: 'Beachfront Villa - Elmina'
        },
        {
          id: 2,
          reviewer: 'Fatima Alhassan',
          rating: 5,
          date: '2024-01-06',
          comment: 'Excellent service for vacation rentals. The property was exactly as described.',
          property: 'Holiday Apartment - Cape Coast Castle'
        }
      ]
    },
    {
      id: 5,
      slug: 'david-mensah',
      name: 'David Mensah',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Accra, Greater Accra',
      specializations: ['Luxury', 'Investment'],
      listings: 28,
      rating: 4.7,
      reviewCount: 134,
      verified: true,
      experience: '10+ years',
      languages: ['English', 'Twi', 'Ga'],
      bio: 'Luxury property specialist with over 10 years of experience helping high-net-worth clients find exceptional investment opportunities and premium residential properties in Accra.',
      phone: '+233 20 123 4567',
      email: 'david.mensah@iskahomes.com',
      licenseNumber: 'REA-2024-001234',
      joinDate: '2014-01-20',
      socialMedia: {
        linkedin: 'david-mensah-luxury',
        twitter: '@davidmensah',
        instagram: 'david.mensah.re'
      },
      achievements: [
        'Luxury Property Specialist 2023',
        'Investment Advisor of the Year',
        'Premium Client Service Award'
      ],
      properties: [
        {
          id: 1,
          title: 'Penthouse - Airport City',
          price: '$850,000',
          location: 'Airport City, Accra',
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 4,
          area: '380 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Investment Property - East Legon',
          price: '$650,000',
          location: 'East Legon, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 6,
          bathrooms: 5,
          area: '520 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 3,
          title: 'Luxury Villa - Trasacco Valley',
          price: '$1,200,000',
          location: 'Trasacco Valley, Accra',
          image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&h=200&fit=crop',
          bedrooms: 5,
          bathrooms: 5,
          area: '600 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 4,
          title: 'Premium Apartment - Cantonments',
          price: '$3,500/month',
          location: 'Cantonments, Accra',
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 3,
          area: '200 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 5,
          title: 'Executive Office Space - Ridge',
          price: '$25,000/month',
          location: 'Ridge, Accra',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 4,
          area: '500 sqm',
          type: 'For Rent',
          featured: true
        },
        {
          id: 6,
          title: 'Luxury Townhouse - Labone',
          price: '$750,000',
          location: 'Labone, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 4,
          area: '350 sqm',
          type: 'For Sale',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Kwame Asante',
          rating: 5,
          date: '2024-01-13',
          comment: 'David is the best luxury property agent in Accra. His investment advice was invaluable.',
          property: 'Penthouse - Airport City'
        },
        {
          id: 2,
          reviewer: 'Sarah Johnson',
          rating: 4,
          date: '2024-01-07',
          comment: 'Excellent service for high-end properties. Very professional and knowledgeable.',
          property: 'Investment Property - East Legon'
        }
      ]
    },
    {
      id: 6,
      slug: 'grace-addo',
      name: 'Grace Addo',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Tamale, Northern',
      specializations: ['Residential', 'Agricultural'],
      listings: 12,
      rating: 4.3,
      reviewCount: 45,
      verified: false,
      experience: '4+ years',
      languages: ['English', 'Dagbani'],
      bio: 'Northern region specialist with expertise in residential and agricultural properties. I help families find homes and farmers secure agricultural land in the Tamale region.',
      phone: '+233 25 678 9012',
      email: 'grace.addo@iskahomes.com',
      licenseNumber: 'REA-2024-006789',
      joinDate: '2020-09-10',
      socialMedia: {
        linkedin: 'grace-addo-northern',
        twitter: '@graceaddo',
        instagram: 'grace.addo.re'
      },
      achievements: [
        'Northern Region Specialist',
        'Agricultural Property Expert',
        'Community Service Award'
      ],
      properties: [
        {
          id: 1,
          title: 'Family Compound - Tamale Central',
          price: '$180,000',
          location: 'Tamale Central',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 5,
          bathrooms: 3,
          area: '400 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 2,
          title: 'Agricultural Land - Yendi',
          price: '$50,000',
          location: 'Yendi, Northern Region',
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 0,
          area: '10 acres',
          type: 'For Sale',
          featured: false
        },
        {
          id: 3,
          title: 'Farm House - Savelugu',
          price: '$120,000',
          location: 'Savelugu, Northern Region',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 2,
          area: '300 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 4,
          title: 'Agricultural Land - Tolon',
          price: '$35,000',
          location: 'Tolon, Northern Region',
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 0,
          area: '15 acres',
          type: 'For Sale',
          featured: false
        },
        {
          id: 5,
          title: 'Residential Plot - Tamale South',
          price: '$25,000',
          location: 'Tamale South',
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 0,
          area: '500 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 6,
          title: 'Family Home - Tamale North',
          price: '$150,000',
          location: 'Tamale North',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '250 sqm',
          type: 'For Sale',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Ama Kufuor',
          rating: 4,
          date: '2024-01-10',
          comment: 'Grace helped us find agricultural land. Very knowledgeable about the northern region.',
          property: 'Agricultural Land - Yendi'
        },
        {
          id: 2,
          reviewer: 'Emmanuel Boateng',
          rating: 4,
          date: '2024-01-04',
          comment: 'Great service for residential properties in Tamale. Highly recommended.',
          property: 'Family Compound - Tamale Central'
        }
      ]
    },
    {
      id: 7,
      slug: 'emmanuel-boateng',
      name: 'Emmanuel Boateng',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Kumasi, Ashanti',
      specializations: ['Commercial', 'Residential'],
      listings: 21,
      rating: 4.5,
      reviewCount: 78,
      verified: true,
      experience: '6+ years',
      languages: ['English', 'Twi'],
      bio: 'Versatile real estate agent handling both commercial and residential properties in the Ashanti region. I provide comprehensive real estate solutions for all types of clients.',
      phone: '+233 24 345 6789',
      email: 'emmanuel.boateng@iskahomes.com',
      licenseNumber: 'REA-2024-004567',
      joinDate: '2018-04-15',
      socialMedia: {
        linkedin: 'emmanuel-boateng-properties',
        twitter: '@emmanuelboateng',
        instagram: 'emmanuel.boateng.re'
      },
      achievements: [
        'Versatile Agent Award 2023',
        'Commercial & Residential Expert',
        'Client Satisfaction Award'
      ],
      properties: [
        {
          id: 1,
          title: 'Retail Space - Adum',
          price: '$3,500/month',
          location: 'Adum, Kumasi',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 2,
          area: '250 sqm',
          type: 'For Rent',
          featured: true
        },
        {
          id: 2,
          title: 'Family Home - Manhyia',
          price: '$280,000',
          location: 'Manhyia, Kumasi',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '300 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 3,
          title: 'Office Space - Kejetia',
          price: '$2,800/month',
          location: 'Kejetia, Kumasi',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 3,
          area: '200 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 4,
          title: 'Apartment - Ahodwo',
          price: '$1,200/month',
          location: 'Ahodwo, Kumasi',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 2,
          area: '120 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 5,
          title: 'Commercial Building - Santasi',
          price: '$450,000',
          location: 'Santasi, Kumasi',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          bedrooms: 0,
          bathrooms: 4,
          area: '600 sqm',
          type: 'For Sale',
          featured: true
        },
        {
          id: 6,
          title: 'Townhouse - Kwadaso',
          price: '$320,000',
          location: 'Kwadaso, Kumasi',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 2,
          area: '220 sqm',
          type: 'For Sale',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Sarah Johnson',
          rating: 5,
          date: '2024-01-12',
          comment: 'Emmanuel is very versatile. Helped us with both residential and commercial properties.',
          property: 'Retail Space - Adum'
        },
        {
          id: 2,
          reviewer: 'Grace Addo',
          rating: 4,
          date: '2024-01-08',
          comment: 'Great service for family homes in Kumasi. Very professional and reliable.',
          property: 'Family Home - Manhyia'
        }
      ]
    },
    {
      id: 8,
      slug: 'fatima-alhassan',
      name: 'Fatima Alhassan',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
      location: 'Accra, Greater Accra',
      specializations: ['Residential', 'Rental'],
      listings: 19,
      rating: 4.6,
      reviewCount: 92,
      verified: true,
      experience: '7+ years',
      languages: ['English', 'Hausa', 'Twi'],
      bio: 'Multilingual real estate agent specializing in residential properties and rental management. I help families find their perfect homes and landlords manage their rental properties effectively.',
      phone: '+233 20 987 6543',
      email: 'fatima.alhassan@iskahomes.com',
      licenseNumber: 'REA-2024-009876',
      joinDate: '2017-11-05',
      socialMedia: {
        linkedin: 'fatima-alhassan-properties',
        twitter: '@fatimaalhassan',
        instagram: 'fatima.alhassan.re'
      },
      achievements: [
        'Multilingual Service Award 2023',
        'Rental Management Expert',
        'Customer Service Excellence'
      ],
      properties: [
        {
          id: 1,
          title: 'Apartment - Osu',
          price: '$1,200/month',
          location: 'Osu, Accra',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 2,
          area: '120 sqm',
          type: 'For Rent',
          featured: true
        },
        {
          id: 2,
          title: 'Townhouse - Labone',
          price: '$420,000',
          location: 'Labone, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 3,
          area: '220 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 3,
          title: 'Studio Apartment - Cantonments',
          price: '$900/month',
          location: 'Cantonments, Accra',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 1,
          bathrooms: 1,
          area: '50 sqm',
          type: 'For Rent',
          featured: false
        },
        {
          id: 4,
          title: 'Family Home - Airport Residential',
          price: '$380,000',
          location: 'Airport Residential, Accra',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
          bedrooms: 4,
          bathrooms: 3,
          area: '280 sqm',
          type: 'For Sale',
          featured: false
        },
        {
          id: 5,
          title: '2-Bedroom Apartment - Ridge',
          price: '$1,800/month',
          location: 'Ridge, Accra',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          bedrooms: 2,
          bathrooms: 2,
          area: '100 sqm',
          type: 'For Rent',
          featured: true
        },
        {
          id: 6,
          title: 'Penthouse - East Legon',
          price: '$580,000',
          location: 'East Legon, Accra',
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop',
          bedrooms: 3,
          bathrooms: 3,
          area: '250 sqm',
          type: 'For Sale',
          featured: false
        }
      ],
      reviews: [
        {
          id: 1,
          reviewer: 'Ama Kufuor',
          rating: 5,
          date: '2024-01-11',
          comment: 'Fatima is excellent with rental properties. Very helpful and speaks multiple languages.',
          property: 'Apartment - Osu'
        },
        {
          id: 2,
          reviewer: 'David Mensah',
          rating: 4,
          date: '2024-01-06',
          comment: 'Great service for residential properties. Very professional and multilingual.',
          property: 'Townhouse - Labone'
        }
      ]
    }
  ]

  // Find the specific agent based on slug
  const agent = allAgents.find(a => a.slug === agentSlug)

  // If agent not found, show 404 or redirect
  if (!agent) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h1>
            <p className="text-gray-600 mb-6">The agent you're looking for doesn't exist.</p>
            <a
              href="/allAgents"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to All Agents
            </a>
          </div>
        </div>
      </Layout1>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'properties', label: 'Properties' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ]

  return (
    <Layout1>
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <a
              href="/allAgents"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to All Agents
            </a>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={agent.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          {/* Agent Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
                {agent.verified && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-2 rounded-full">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Agent Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{agent.name}</h1>
                    <div className="flex items-center text-gray-600 mb-3">
                      <FiMapPin className="w-5 h-5 mr-2" />
                      <span>{agent.location}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(agent.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600">
                        {agent.rating} ({agent.reviewCount} reviews)
                      </span>
                    </div>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.specializations.map(spec => (
                        <span
                          key={spec}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                      <FiMessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                    <button className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                      <FiShare2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About {agent.name}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{agent.bio}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agent.listings}</div>
                        <div className="text-sm text-gray-600">Properties</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agent.experience}</div>
                        <div className="text-sm text-gray-600">Experience</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agent.rating}</div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{agent.reviewCount}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Achievements</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {agent.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-xl">
                            <FiAward className="w-5 h-5 text-yellow-600 mr-3" />
                            <span className="text-gray-700">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <FiPhone className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-700">{agent.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <FiMail className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-700">{agent.email}</span>
                        </div>
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-700">{agent.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.languages.map(lang => (
                          <span
                            key={lang}
                            className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border border-gray-200"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h4>
                      <div className="space-y-3">
                        {agent.socialMedia.linkedin && (
                          <a href="#" className="flex items-center text-blue-600 hover:text-blue-700">
                            <FiLinkedin className="w-4 h-4 mr-3" />
                            LinkedIn
                          </a>
                        )}
                        {agent.socialMedia.twitter && (
                          <a href="#" className="flex items-center text-blue-400 hover:text-blue-500">
                            <FiTwitter className="w-4 h-4 mr-3" />
                            Twitter
                          </a>
                        )}
                        {agent.socialMedia.instagram && (
                          <a href="#" className="flex items-center text-pink-600 hover:text-pink-700">
                            <FiInstagram className="w-4 h-4 mr-3" />
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Properties ({agent.properties.length})</h3>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        All
                      </button>
                      <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        For Sale
                      </button>
                      <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        For Rent
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agent.properties.map(property => (
                      <div key={property.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img
                            src={property.image}
                            alt={property.title}
                            className="w-full h-48 object-cover"
                          />
                          {property.featured && (
                            <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Featured
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                              <FiHeart className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{property.title}</h4>
                            <span className="text-lg font-bold text-blue-600">{property.price}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <FiMapPin className="w-4 h-4 mr-1" />
                            <span>{property.location}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-4">
                              <span>{property.bedrooms} beds</span>
                              <span>{property.bathrooms} baths</span>
                              <span>{property.area}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.type === 'For Sale' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {property.type}
                            </span>
                          </div>

                          <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Reviews ({agent.reviews.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{agent.rating}</div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {agent.reviews.map(review => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{review.reviewer}</h4>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        
                        <div className="text-sm text-gray-600">
                          Property: <span className="font-medium">{review.property}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h3>
                    <p className="text-gray-600 mb-6">
                      Ready to work with {agent.name}? Send a message or schedule a consultation to discuss your property needs.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <FiPhone className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">Call</div>
                          <div className="text-gray-600">{agent.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <FiMail className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">Email</div>
                          <div className="text-gray-600">{agent.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <FiMapPin className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">Location</div>
                          <div className="text-gray-600">{agent.location}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Message</h3>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about your property needs..."
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default AgentProfile
