/**
 * Property Owner Analytics Dashboard
 * 
 * This component provides property owners with detailed analytics about
 * who viewed their listings, including property seeker information
 * for logged-in users.
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

export default function PropertyOwnerAnalytics({ developerId }) {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    if (developerId) {
      fetchAnalytics()
    }
  }, [developerId, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, you would call your PostHog API or backend
      // to fetch analytics data. For now, we'll show the structure.
      
      // Example API call:
      // const response = await fetch(`/api/analytics/property-owner/${developerId}?range=${timeRange}`)
      // const data = await response.json()
      
      // Mock data for demonstration
      const mockData = {
        totalViews: 1250,
        uniqueViewers: 890,
        loggedInViewers: 340,
        anonymousViewers: 550,
        topListings: [
          {
            id: 'listing-1',
            title: 'Modern 3BR Apartment',
            views: 450,
            loggedInViews: 180,
            anonymousViews: 270,
            recentViewers: [
              {
                seekerId: 'seeker-123',
                seekerName: 'John Doe',
                seekerEmail: 'john@example.com',
                viewedAt: '2024-01-15T10:30:00Z',
                viewedFrom: 'home'
              },
              {
                seekerId: 'seeker-456',
                seekerName: 'Jane Smith',
                seekerEmail: 'jane@example.com',
                viewedAt: '2024-01-15T09:15:00Z',
                viewedFrom: 'search_results'
              }
            ]
          },
          {
            id: 'listing-2',
            title: 'Luxury Villa',
            views: 320,
            loggedInViews: 120,
            anonymousViews: 200,
            recentViewers: [
              {
                seekerId: 'seeker-789',
                seekerName: 'Mike Johnson',
                seekerEmail: 'mike@example.com',
                viewedAt: '2024-01-14T16:45:00Z',
                viewedFrom: 'explore'
              }
            ]
          }
        ],
        leads: {
          phoneClicks: 45,
          messageClicks: 78,
          appointmentClicks: 23,
          totalLeads: 146
        },
        conversionRate: 11.7 // percentage
      }
      
      setAnalytics(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Property Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Track who viewed your listings and generate leads
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalViews.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unique Viewers</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.uniqueViewers.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Logged-in Viewers</h3>
          <p className="text-3xl font-bold text-purple-600">{analytics.loggedInViewers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {((analytics.loggedInViewers / analytics.uniqueViewers) * 100).toFixed(1)}% of total
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-orange-600">{analytics.conversionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Views to leads</p>
        </div>
      </div>

      {/* Leads Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Generation</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.leads.phoneClicks}</p>
            <p className="text-sm text-gray-600">Phone Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.leads.messageClicks}</p>
            <p className="text-sm text-gray-600">Message Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.leads.appointmentClicks}</p>
            <p className="text-sm text-gray-600">Appointment Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{analytics.leads.totalLeads}</p>
            <p className="text-sm text-gray-600">Total Leads</p>
          </div>
        </div>
      </div>

      {/* Top Listings with Viewer Details */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Top Performing Listings</h2>
          <p className="text-gray-600 mt-1">See who viewed your listings and contact them directly</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {analytics.topListings.map((listing) => (
            <div key={listing.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                  <p className="text-gray-600">
                    {listing.views} total views • {listing.loggedInViews} logged-in • {listing.anonymousViews} anonymous
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {((listing.loggedInViews / listing.views) * 100).toFixed(1)}% logged-in viewers
                  </p>
                </div>
              </div>

              {/* Recent Logged-in Viewers */}
              {listing.recentViewers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Recent Logged-in Viewers ({listing.recentViewers.length})
                  </h4>
                  <div className="space-y-3">
                    {listing.recentViewers.map((viewer, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{viewer.seekerName}</p>
                          <p className="text-sm text-gray-600">{viewer.seekerEmail}</p>
                          <p className="text-xs text-gray-500">
                            Viewed from: {viewer.viewedFrom} • {new Date(viewer.viewedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Navigate to messages with this seeker
                              window.location.href = `/messages?seeker=${viewer.seekerId}&listing=${listing.id}`
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            💬 Message
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(viewer.seekerEmail)
                                toast.success('Email copied!')
                              } catch (error) {
                                console.error('Failed to copy email:', error)
                                toast.error('Failed to copy email')
                              }
                            }}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            title="Click to copy email"
                          >
                            📧 Copy Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anonymous Viewers Note */}
              {listing.anonymousViews > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>{listing.anonymousViews} anonymous viewers</strong> - 
                    These users viewed your listing but weren't logged in. 
                    Encourage users to sign up to see who's interested in your properties!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use This Dashboard</h3>
        <ul className="text-blue-800 space-y-2">
          <li>• <strong>Logged-in Viewers:</strong> These are property seekers who have accounts on your platform. You can see their names and contact them directly.</li>
          <li>• <strong>Anonymous Viewers:</strong> These are users who viewed your listing without being logged in. You can't see their details, but you can see how many there are.</li>
          <li>• <strong>Contact Viewers:</strong> Use the "Message" button to start a conversation with logged-in viewers who showed interest in your property.</li>
          <li>• <strong>Track Performance:</strong> Monitor which listings get the most views and leads to optimize your property marketing.</li>
        </ul>
      </div>
    </div>
  )
}
