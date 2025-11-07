'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PropertiesByCategories from '@/app/components/developers/DataStats/PropertiesByCategories'
import PropertiesByType from '@/app/components/developers/DataStats/PropertiesByType'
import PropertiesBySubType from '@/app/components/developers/DataStats/PropertiesBySubType'
import DataCard from '@/app/components/developers/DataCard'


import Link from 'next/link'
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  MapPin,
  Building2
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const PropertyAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')

  // Dummy property analytics data based on listing_analytics schema
  const propertyData = {
    overview: {
      totalViews: 2847,
      totalLeads: 156,
      totalImpressions: 892,
      conversionRate: 5.5,
      viewsChange: 12.3,
      leadsChange: 8.7,
      impressionsChange: 15.2,
      conversionChange: -2.1
    },
    properties: [
      {
        id: '1',
        name: 'Premium Apartments East Legon',
        location: 'East Legon, Accra',
        status: 'Available',
        views: 1247,
        leads: 68,
        impressions: 234,
        conversion: 5.5,
        viewsChange: 15.2,
        leadsChange: 8.7,
        impressionsChange: 12.3
      },
      {
        id: '2',
        name: 'Karl\'s Manet Ville',
        location: 'Jonkobri, Accra',
        status: 'Available',
        views: 892,
        leads: 45,
        impressions: 156,
        conversion: 5.0,
        viewsChange: 8.3,
        leadsChange: 12.1,
        impressionsChange: 6.7
      },
      {
        id: '3',
        name: 'Jojo Jones',
        location: 'Bālā Bōkan, Afghanistan',
        status: 'Sold',
        views: 456,
        leads: 23,
        impressions: 89,
        conversion: 5.0,
        viewsChange: -2.1,
        leadsChange: 4.5,
        impressionsChange: -1.2
      },
      {
        id: '4',
        name: 'Peter\'s Apartments',
        location: 'East Toorale, Australia',
        status: 'Available',
        views: 234,
        leads: 12,
        impressions: 67,
        conversion: 5.1,
        viewsChange: 22.8,
        leadsChange: 18.9,
        impressionsChange: 25.4
      },
      {
        id: '5',
        name: 'Karls Homes',
        location: 'Abokobi, Accra',
        status: 'Available',
        views: 18,
        leads: 8,
        impressions: 12,
        conversion: 44.4,
        viewsChange: 150.0,
        leadsChange: 300.0,
        impressionsChange: 200.0
      }
    ],
    performance: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      views: [650, 720, 680, 797],
      leads: [32, 38, 35, 51],
      impressions: [180, 220, 195, 297]
    }
  }

  const developerInfo = {
    name: 'Premium Developers Ltd',
    slug: params.slug
  }

  // Using dummy data - no API calls needed

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Performance</h1>
          <p className="text-gray-600">Track views, engagement, and performance metrics for your listings</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <DataCard
            title="Total Units"
            value={developerInfo?.total_units?.toLocaleString() || 0}
            icon={Building2}
          />
          
          <DataCard
            title="Total Developments"
            value={developerInfo?.total_developments?.toLocaleString() || 0}
            icon={BarChart3}
          />

          <DataCard
            title="Total Views"
            value={propertyData?.overview?.totalViews?.toLocaleString() || 0}
            icon={Eye}
          />
          
        
          
          <DataCard
            title="Total Impressions"
            value={propertyData?.overview?.totalImpressions?.toLocaleString() || 0}
            icon={Share2}
          />
          
          <DataCard
            title="Conversion Rate"
            value={`${propertyData?.overview?.conversionRate || 0}%`}
            icon={TrendingUp}
          />
        </div>

       

        {/* Monthly Property Views (Chart) */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Property Views</h3>
          <div className="h-72">
            <Line 
              data={{
                labels: propertyData?.viewsSeries?.labels || [],
                datasets: [
                  {
                    label: 'Views',
                    data: propertyData?.viewsSeries?.views || [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' }, title: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                  x: { grid: { color: 'rgba(0,0,0,0.1)' } }
                }
              }}
            />
          </div>

       


      

</div>






{/* Property Breakdown Components */}
<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <PropertiesByCategories />
          <PropertiesByType />
          <PropertiesBySubType />
        </div>

 {/* Top Performing Developments */}
 <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Developments</h3>
            <div className="text-sm text-gray-500">
              Ranked by total engagement
            </div>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    id: 1,
                    name: "Premium Apartments East Legon",
                    location: "East Legon, Accra",
                    status: "Under Construction",
                    views: 2847,
                    impressions: 892,
                    leads: 156,
                    conversionRate: 5.5,
                    trend: "up"
                  },
                  {
                    id: 2,
                    name: "Karl's Manet Ville",
                    location: "Jonkobri, Accra",
                    status: "Pre-Construction",
                    views: 1923,
                    impressions: 654,
                    leads: 98,
                    conversionRate: 5.1,
                    trend: "up"
                  },
                  {
                    id: 3,
                    name: "Jojo Jones",
                    location: "Bālā Bōkan, Afghanistan",
                    status: "Ready for Occupancy",
                    views: 1654,
                    impressions: 432,
                    leads: 87,
                    conversionRate: 5.3,
                    trend: "down"
                  },
                  {
                    id: 4,
                    name: "Peter's Apartments",
                    location: "East Toorale, Australia",
                    status: "Planning",
                    views: 1234,
                    impressions: 321,
                    leads: 65,
                    conversionRate: 5.3,
                    trend: "up"
                  },
                  {
                    id: 5,
                    name: "Luxury Heights",
                    location: "Cantonments, Accra",
                    status: "Under Construction",
                    views: 987,
                    impressions: 298,
                    leads: 54,
                    conversionRate: 5.5,
                    trend: "up"
                  },
                  {
                    id: 6,
                    name: "Garden City Residences",
                    location: "Labone, Accra",
                    status: "Ready for Occupancy",
                    views: 876,
                    impressions: 234,
                    leads: 43,
                    conversionRate: 4.9,
                    trend: "down"
                  },
                  {
                    id: 7,
                    name: "Modern Living Complex",
                    location: "Osu, Accra",
                    status: "Under Construction",
                    views: 765,
                    impressions: 198,
                    leads: 38,
                    conversionRate: 5.0,
                    trend: "up"
                  },
                  {
                    id: 8,
                    name: "Elite Towers",
                    location: "Airport Residential, Accra",
                    status: "Pre-Construction",
                    views: 654,
                    impressions: 167,
                    leads: 32,
                    conversionRate: 4.9,
                    trend: "down"
                  }
                ].map((development, index) => (
                  <div key={development.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {development.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">{development.location}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            development.status === 'Ready for Occupancy' 
                              ? 'bg-green-100 text-green-800'
                              : development.status === 'Under Construction'
                              ? 'bg-blue-100 text-blue-800'
                              : development.status === 'Pre-Construction'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {development.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* Views */}
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-900">{development.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                      
                      {/* Impressions */}
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Share2 className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-semibold text-gray-900">{development.impressions.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">Impressions</p>
                      </div>
                      
                      {/* Leads */}
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-gray-900">{development.leads}</span>
                        </div>
                        <p className="text-xs text-gray-500">Leads</p>
                      </div>
                      
                      {/* Conversion Rate */}
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          {development.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm font-semibold text-gray-900">{development.conversionRate}%</span>
                        </div>
                        <p className="text-xs text-gray-500">Conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Show more indicator if there are more developments */}
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Developments →
            </button>
          </div>
        </div>


        {/* Properties Performance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favorites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  
                </tr>
              </thead>





              <tbody className="bg-white divide-y divide-gray-200">
                {propertyData?.properties?.length > 0 ? (
                  propertyData.properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/property/${property.listing_type}/${property.slug}/${property.id}`} className="flex items-center space-x-3">
                          <img
                            src={property.imageUrl || '/placeholder.png'}
                            alt={property.title}
                            className="w-12 h-12 rounded object-cover border"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{property.title}</div>
                            <div className="text-sm text-gray-500 capitalize">{property.status}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property?.metrics?.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property?.metrics?.saves || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property?.metrics?.shares || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property?.metrics?.leads || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(property?.metrics?.conversion ?? 0)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No properties found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyAnalytics
