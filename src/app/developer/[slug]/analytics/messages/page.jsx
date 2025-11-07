'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Reply,
  Send
} from 'lucide-react'

const MessagingAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // Dummy data for messaging analytics
  const messagingData = {
    overview: {
      totalMessages: 234,
      sentMessages: 156,
      receivedMessages: 78,
      responseRate: 89.2,
      averageResponseTime: '1.2 hours',
      activeConversations: 23,
      totalMessagesChange: 5.4,
      responseRateChange: 2.1,
      responseTimeChange: -15.3
    },
    messageTypes: [
      { type: 'Property Inquiry', count: 89, responseRate: 92.1, avgResponse: '0.8h' },
      { type: 'General Question', count: 67, responseRate: 85.1, avgResponse: '1.5h' },
      { type: 'Appointment Request', count: 45, responseRate: 95.6, avgResponse: '0.5h' },
      { type: 'Follow-up', count: 33, responseRate: 78.8, avgResponse: '2.1h' }
    ],
    recentMessages: [
      { 
        id: 1, 
        client: 'John Doe', 
        property: 'Luxury Apartments East Legon',
        type: 'Property Inquiry',
        message: 'Hi, I\'m interested in the 3-bedroom apartment. Is it still available?',
        time: '2 minutes ago',
        status: 'unread',
        responseTime: null
      },
      { 
        id: 2, 
        client: 'Jane Smith', 
        property: 'Modern Villas Accra',
        type: 'Appointment Request',
        message: 'Can I schedule a viewing for tomorrow afternoon?',
        time: '15 minutes ago',
        status: 'responded',
        responseTime: '12 min'
      },
      { 
        id: 3, 
        client: 'Mike Johnson', 
        property: 'Premium Condos',
        type: 'General Question',
        message: 'What are the payment plans available?',
        time: '1 hour ago',
        status: 'responded',
        responseTime: '45 min'
      },
      { 
        id: 4, 
        client: 'Sarah Wilson', 
        property: 'Executive Homes',
        type: 'Follow-up',
        message: 'Thank you for the information. I\'ll get back to you soon.',
        time: '2 hours ago',
        status: 'read',
        responseTime: null
      }
    ],
    dailyMessages: [
      { date: '2024-01-01', sent: 8, received: 5, total: 13 },
      { date: '2024-01-02', sent: 12, received: 7, total: 19 },
      { date: '2024-01-03', sent: 6, received: 4, total: 10 },
      { date: '2024-01-04', sent: 15, received: 9, total: 24 },
      { date: '2024-01-05', sent: 9, received: 6, total: 15 },
      { date: '2024-01-06', sent: 11, received: 8, total: 19 },
      { date: '2024-01-07', sent: 7, received: 5, total: 12 }
    ],
    topProperties: [
      { name: 'Luxury Apartments East Legon', messages: 45, responseRate: 91.1, avgResponse: '0.9h' },
      { name: 'Modern Villas Accra', messages: 38, responseRate: 89.5, avgResponse: '1.1h' },
      { name: 'Premium Condos', messages: 32, responseRate: 87.5, avgResponse: '1.3h' },
      { name: 'Executive Homes', messages: 28, responseRate: 85.7, avgResponse: '1.5h' }
    ],
    responseTimeDistribution: {
      'Under 30 min': 45,
      '30 min - 1 hour': 67,
      '1-2 hours': 34,
      '2-4 hours': 23,
      'Over 4 hours': 12
    }
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return XCircle
      case 'read': return CheckCircle
      case 'responded': return Reply
      default: return MessageCircle
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return 'text-red-600'
      case 'read': return 'text-gray-600'
      case 'responded': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'unread': return 'bg-red-100'
      case 'read': return 'bg-gray-100'
      case 'responded': return 'bg-green-100'
      default: return 'bg-gray-100'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messaging Analytics</h1>
          <p className="text-gray-600">Track message volume, response rates, and communication metrics</p>
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
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messagingData.overview.totalMessages}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {messagingData.overview.totalMessagesChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${messagingData.overview.totalMessagesChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(messagingData.overview.totalMessagesChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{messagingData.overview.responseRate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Reply className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {messagingData.overview.responseRateChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${messagingData.overview.responseRateChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(messagingData.overview.responseRateChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{messagingData.overview.averageResponseTime}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {messagingData.overview.responseTimeChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-sm ml-1 ${messagingData.overview.responseTimeChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(messagingData.overview.responseTimeChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{messagingData.overview.activeConversations}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {messagingData.overview.sentMessages} sent, {messagingData.overview.receivedMessages} received
            </div>
          </div>
        </div>

        {/* Message Types & Response Time Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Types</h3>
            <div className="space-y-4">
              {messagingData.messageTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{type.type}</p>
                    <p className="text-xs text-gray-500">Avg response: {type.avgResponse}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{type.count}</div>
                    <div className="text-xs text-gray-500">{type.responseRate}% response</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
            <div className="space-y-4">
              {Object.entries(messagingData.responseTimeDistribution).map(([timeRange, count]) => (
                <div key={timeRange}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{timeRange}</span>
                    <span className="text-sm text-gray-500">{count} messages</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / Math.max(...Object.values(messagingData.responseTimeDistribution))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
          <div className="space-y-4">
            {messagingData.recentMessages.map((message) => {
              const StatusIcon = getStatusIcon(message.status)
              return (
                <div key={message.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${getStatusBgColor(message.status)}`}>
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(message.status)}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{message.client}</p>
                        <p className="text-xs text-gray-500">{message.property} • {message.time}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{message.type}</span>
                      {message.responseTime && (
                        <span>Response time: {message.responseTime}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Properties by Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Properties by Messages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messagingData.topProperties.map((property, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.messages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.responseRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.avgResponse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagingAnalytics
