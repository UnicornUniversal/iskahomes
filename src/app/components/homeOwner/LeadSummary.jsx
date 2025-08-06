import React from 'react'
import { FiTrendingUp, FiEye, FiMessageSquare, FiCalendar } from 'react-icons/fi'

const LeadSummary = () => {
  const leadData = {
    totalInquiries: 25,
    totalVisits: 18,
    conversionRate: 72,
    monthlyGrowth: 15,
    topProperty: "Luxury Villa - East Legon",
    recentActivity: [
      { type: "inquiry", property: "Luxury Villa", time: "2 hours ago" },
      { type: "visit", property: "Modern Apartment", time: "1 day ago" },
      { type: "booking", property: "Townhouse", time: "3 days ago" }
    ]
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'inquiry':
        return <FiMessageSquare className="w-4 h-4 text-blue-500" />
      case 'visit':
        return <FiEye className="w-4 h-4 text-green-500" />
      case 'booking':
        return <FiCalendar className="w-4 h-4 text-purple-500" />
      default:
        return <FiMessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'inquiry':
        return 'text-blue-600'
      case 'visit':
        return 'text-green-600'
      case 'booking':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Lead Summary</h3>
        <FiTrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{leadData.totalInquiries}</div>
          <div className="text-xs text-gray-600">Total Inquiries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{leadData.totalVisits}</div>
          <div className="text-xs text-gray-600">Property Visits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{leadData.conversionRate}%</div>
          <div className="text-xs text-gray-600">Conversion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">+{leadData.monthlyGrowth}%</div>
          <div className="text-xs text-gray-600">Monthly Growth</div>
        </div>
      </div>
      
      {/* Top Performing Property */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Performing Property</h4>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-800 font-medium">{leadData.topProperty}</p>
          <p className="text-xs text-gray-600">Most inquiries this month</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
        <div className="space-y-3">
          {leadData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} - {activity.property}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button className="w-full mt-4 text-primary_color text-sm font-medium hover:text-primary_color/80 transition-colors">
        View Detailed Analytics
      </button>
    </div>
  )
}

export default LeadSummary 