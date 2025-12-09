'use client'

import React, { useState } from 'react'
import { 
  FiBell, 
  FiMessageCircle, 
  FiUser, 
  FiCalendar, 
  FiCheckCircle,
  FiX,
  FiCheck,
  FiTrash2
} from 'react-icons/fi'
import { 
  FaHome,
  FaExclamationCircle
} from 'react-icons/fa'

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      title: 'New Message',
      message: 'John Doe sent you a message about the 4-bedroom apartment',
      timestamp: '2 minutes ago',
      isRead: false,
      link: '/messages'
    },
    {
      id: 2,
      type: 'lead',
      title: 'New Lead',
      message: 'Sarah Johnson showed interest in your property listing',
      timestamp: '15 minutes ago',
      isRead: false,
      link: '/leads'
    },
    {
      id: 3,
      type: 'appointment',
      title: 'Appointment Scheduled',
      message: 'Property viewing scheduled for tomorrow at 2:00 PM',
      timestamp: '1 hour ago',
      isRead: true,
      link: '/appointments'
    },
    {
      id: 4,
      type: 'system',
      title: 'System Update',
      message: 'Your property listing has been approved and is now live',
      timestamp: '3 hours ago',
      isRead: true,
      link: '/properties'
    },
    {
      id: 5,
      type: 'message',
      title: 'New Message',
      message: 'Michael Brown wants to know more about the property location',
      timestamp: '5 hours ago',
      isRead: false,
      link: '/messages'
    },
    {
      id: 6,
      type: 'lead',
      title: 'New Lead',
      message: 'Emma Wilson requested contact information for your development',
      timestamp: '1 day ago',
      isRead: true,
      link: '/leads'
    },
    {
      id: 7,
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'You have an appointment scheduled in 2 hours',
      timestamp: '2 days ago',
      isRead: true,
      link: '/appointments'
    },
    {
      id: 8,
      type: 'system',
      title: 'Payment Received',
      message: 'Your subscription payment has been processed successfully',
      timestamp: '3 days ago',
      isRead: true,
      link: '/billing'
    }
  ])

  const [showAll, setShowAll] = useState(false)

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageCircle className="w-5 h-5" />
      case 'lead':
        return <FiUser className="w-5 h-5" />
      case 'appointment':
        return <FiCalendar className="w-5 h-5" />
      case 'system':
        return <FaExclamationCircle className="w-5 h-5" />
      default:
        return <FiBell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-600'
      case 'lead':
        return 'bg-green-100 text-green-600'
      case 'appointment':
        return 'bg-purple-100 text-purple-600'
      case 'system':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5)

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  return (
    <div className="w-full max-w-4xl mx-auto secondary_bg !p-4 ">
      {/* Header */}
      <div className="flex items-center flex-wrap justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary_color/10 flex items-center justify-center">
            <FiBell className="text-primary_color text-xl" />
          </div>
          <div>
            <h5 className=" text-primary_color">Notifications</h5>
            {unreadCount > 0 && (
              <p className="text-sm text-secondary_color-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 secondary_button   px-4 py-2 !text-[0.8em] font-medium text-primary_color hover:bg-primary_color/10 rounded-lg transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications</p>
            <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative secondary_bg rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                notification.isRead 
                  ? 'border-gray-200 opacity-75' 
                  : 'border-primary_color/30 bg-primary_color/5'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${notification.isRead ? 'text-gray-700' : 'text-primary_color'}`}>
                        {notification.title}
                      </p>
                      <p className="text-[0.8em] text-secondary_color-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-secondary_color-400">
                          {notification.timestamp}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary_color"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <FiCheckCircle className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {/* <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                  </button> */}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {notifications.length > 5 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 text-primary_color font-medium hover:bg-primary_color/10 rounded-lg transition-colors"
          >
            {showAll ? 'Show Less' : `Show All (${notifications.length})`}
          </button>
        </div>
      )}
    </div>
  )
}

export default Notifications
