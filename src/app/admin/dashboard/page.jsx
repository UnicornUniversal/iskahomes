'use client'

import React from 'react'
import { 
  FiUsers, 
  FiMapPin, 
  FiBuilding, 
  FiTrendingUp,
  FiDollarSign,
  FiEye,
  FiCheckCircle
} from 'react-icons/fi'

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'Total Properties',
      value: '1,234',
      change: '+8%',
      changeType: 'positive',
      icon: FiMapPin,
      color: 'green'
    },
    {
      title: 'Active Developers',
      value: '156',
      change: '+5%',
      changeType: 'positive',
      icon: FiBuilding,
      color: 'purple'
    },
    {
      title: 'Active Agents',
      value: '89',
      change: '+3%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'orange'
    },
    {
      title: 'Monthly Revenue',
      value: '$45,678',
      change: '+15%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'green'
    },
    {
      title: 'Property Views',
      value: '12,456',
      change: '+22%',
      changeType: 'positive',
      icon: FiEye,
      color: 'blue'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New developer "ABC Construction" registered',
      time: '2 minutes ago',
      icon: FiBuilding,
      color: 'green'
    },
    {
      id: 2,
      type: 'property_listing',
      message: 'New property listed in Kampala Central',
      time: '15 minutes ago',
      icon: FiMapPin,
      color: 'blue'
    },
    {
      id: 3,
      type: 'user_verification',
      message: 'Agent "John Doe" account verified',
      time: '1 hour ago',
      icon: FiCheckCircle,
      color: 'green'
    },
    {
      id: 4,
      type: 'subscription',
      message: 'Developer upgraded to Premium plan',
      time: '2 hours ago',
      icon: FiTrendingUp,
      color: 'purple'
    }
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activities</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const IconComponent = activity.icon
            return (
              <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className={`p-2 rounded-lg bg-${activity.color}-100`}>
                  <IconComponent className={`w-5 h-5 text-${activity.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
