'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Eye, 
  Share2, 
  Heart, 
  Globe, 
  Facebook, 
  Instagram, 
  Linkedin,
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ExternalLink,
  MessageCircle
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

// Register Chart.js components
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

const ProfileAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // Dummy data for profile analytics
  const profileData = {
    overview: {
      profileViews: 892,
      socialClicks: 156,
      websiteClicks: 89,
      shares: 45,
      favorites: 23,
      brandMentions: 12,
      profileViewsChange: 15.6,
      socialClicksChange: 8.2,
      websiteClicksChange: -3.1,
      sharesChange: 12.4,
      favoritesChange: 5.7
    },
    socialMedia: {
      facebook: { clicks: 45, shares: 12, reach: 2340 },
      instagram: { clicks: 67, shares: 18, reach: 1890 },
      linkedin: { clicks: 34, shares: 8, reach: 1230 },
      tiktok: { clicks: 10, shares: 7, reach: 890 }
    },
    profileTraffic: [
      { source: 'Search Results', visitors: 234, percentage: 26.2 },
      { source: 'Property Listings', visitors: 189, percentage: 21.2 },
      { source: 'Direct', visitors: 156, percentage: 17.5 },
      { source: 'Social Media', visitors: 123, percentage: 13.8 },
      { source: 'Referrals', visitors: 98, percentage: 11.0 },
      { source: 'Other', visitors: 92, percentage: 10.3 }
    ],
    brandMetrics: {
      brandAwareness: 4.2,
      brandRecognition: 3.8,
      brandLoyalty: 3.5,
      netPromoterScore: 7.2
    },
    recentActivity: [
      { 
        type: 'profile_view', 
        source: 'Google Search', 
        time: '2 minutes ago',
        details: 'Searched for "luxury apartments developer"'
      },
      { 
        type: 'social_click', 
        source: 'Facebook', 
        time: '15 minutes ago',
        details: 'Clicked on Facebook profile link'
      },
      { 
        type: 'website_click', 
        source: 'Property Listing', 
        time: '1 hour ago',
        details: 'Visited company website'
      },
      { 
        type: 'share', 
        source: 'Instagram', 
        time: '2 hours ago',
        details: 'Shared developer profile on Instagram'
      }
    ],
    dailyProfileViews: [
      { date: '2024-01-01', views: 23, social: 5, website: 3, impressions: 45 },
      { date: '2024-01-02', views: 31, social: 7, website: 4, impressions: 52 },
      { date: '2024-01-03', views: 28, social: 6, website: 2, impressions: 38 },
      { date: '2024-01-04', views: 35, social: 8, website: 5, impressions: 61 },
      { date: '2024-01-05', views: 29, social: 5, website: 3, impressions: 48 },
      { date: '2024-01-06', views: 32, social: 9, website: 4, impressions: 55 },
      { date: '2024-01-07', views: 26, social: 6, website: 2, impressions: 42 },
      { date: '2024-01-08', views: 38, social: 10, website: 6, impressions: 68 },
      { date: '2024-01-09', views: 42, social: 12, website: 7, impressions: 72 },
      { date: '2024-01-10', views: 35, social: 8, website: 5, impressions: 58 },
      { date: '2024-01-11', views: 29, social: 6, website: 3, impressions: 45 },
      { date: '2024-01-12', views: 33, social: 9, website: 4, impressions: 52 },
      { date: '2024-01-13', views: 40, social: 11, website: 6, impressions: 65 },
      { date: '2024-01-14', views: 37, social: 8, website: 5, impressions: 59 }
    ]
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
    },
  }

  // Chart data for profile views and impressions
  const profileViewsChartData = {
    labels: profileData.dailyProfileViews.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Profile Views',
        data: profileData.dailyProfileViews.map(item => item.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Impressions',
        data: profileData.dailyProfileViews.map(item => item.impressions),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Social Clicks',
        data: profileData.dailyProfileViews.map(item => item.social),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Website Clicks',
        data: profileData.dailyProfileViews.map(item => item.website),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile_view': return Eye
      case 'social_click': return Share2
      case 'website_click': return Globe
      case 'share': return Share2
      default: return Users
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'profile_view': return 'bg-blue-50 text-blue-600'
      case 'social_click': return 'bg-green-50 text-green-600'
      case 'website_click': return 'bg-purple-50 text-purple-600'
      case 'share': return 'bg-orange-50 text-orange-600'
      default: return 'bg-gray-50 text-gray-600'
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Brand Analytics</h1>
          <p className="text-gray-600">Track profile views, social media engagement, and brand awareness</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{profileData.overview.profileViews}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {profileData.overview.profileViewsChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${profileData.overview.profileViewsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(profileData.overview.profileViewsChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Social Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{profileData.overview.socialClicks}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Share2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {profileData.overview.socialClicksChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${profileData.overview.socialClicksChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(profileData.overview.socialClicksChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Website Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{profileData.overview.websiteClicks}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {profileData.overview.websiteClicksChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${profileData.overview.websiteClicksChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(profileData.overview.websiteClicksChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brand Mentions</p>
                <p className="text-2xl font-bold text-gray-900">{profileData.overview.brandMentions}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Online mentions
            </div>
          </div>
        </div>

        {/* Social Media Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(profileData.socialMedia).map(([platform, data]) => {
              const getPlatformIcon = (platform) => {
                switch (platform) {
                  case 'facebook': return Facebook
                  case 'instagram': return Instagram
                  case 'linkedin': return Linkedin
                  case 'tiktok': return Share2
                  default: return Share2
                }
              }
              const IconComponent = getPlatformIcon(platform)
              return (
                <div key={platform} className="text-center">
                  <div className="p-3 bg-gray-50 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">{platform}</h4>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-gray-900">{data.clicks}</div>
                    <div className="text-xs text-gray-500">Clicks</div>
                    <div className="text-sm text-gray-600">{data.shares} shares</div>
                    <div className="text-xs text-gray-500">{data.reach.toLocaleString()} reach</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Profile Views & Impressions Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Views & Impressions Trend</h3>
          <div className="h-80">
            <Line data={profileViewsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Profile Traffic Sources & Brand Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Traffic Sources</h3>
            <div className="space-y-4">
              {profileData.profileTraffic.map((source, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    <span className="text-sm text-gray-500">{source.visitors} visitors</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{source.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Metrics</h3>
            <div className="space-y-4">
              {Object.entries(profileData.brandMetrics).map(([metric, value]) => (
                <div key={metric} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {metric.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(value / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Brand Activity</h3>
          <div className="space-y-4">
            {profileData.recentActivity.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type)
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                      <p className="text-xs text-gray-500">{activity.source} • {activity.time}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileAnalytics
