'use client'

import React from 'react'
import { FiActivity, FiUser, FiMapPin, FiCheckCircle } from 'react-icons/fi'

const DUMMY_ACTIVITIES = [
  { id: 1, message: 'Account created', time: '2 days ago', icon: FiUser },
  { id: 2, message: 'Profile updated', time: '1 day ago', icon: FiUser },
  { id: 3, message: 'First listing added', time: '1 day ago', icon: FiMapPin },
  { id: 4, message: 'Account verified', time: '12 hours ago', icon: FiCheckCircle },
  { id: 5, message: 'Status changed to active', time: '6 hours ago', icon: FiActivity }
]

export default function UserActivitiesPage() {
  return (
    <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-6 py-4 font-semibold text-primary_color border-b border-primary_color/20">Recent Activity</h2>
      <p className="px-6 py-2 text-sm text-primary_color/70">Dummy data - real activity logger coming soon.</p>
      <div className="divide-y divide-primary_color/10">
        {DUMMY_ACTIVITIES.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-primary_color/5 transition-colors">
              <div className="p-2 rounded-lg bg-primary_color/10">
                <Icon className="w-5 h-5 text-primary_color" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary_color">{activity.message}</p>
                <p className="text-sm text-primary_color/70">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
