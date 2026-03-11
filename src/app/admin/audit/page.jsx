'use client'

import React from 'react'
import { FiActivity, FiUser, FiSettings, FiShield } from 'react-icons/fi'

const DUMMY_AUDIT_LOGS = [
  { id: 1, action: 'Admin logged in', user: 'admin@iskahomes.com', time: '2 minutes ago', icon: FiUser },
  { id: 2, action: 'User status updated', user: 'admin@iskahomes.com', time: '15 minutes ago', icon: FiSettings },
  { id: 3, action: 'Developer verified', user: 'admin@iskahomes.com', time: '1 hour ago', icon: FiShield },
  { id: 4, action: 'Category updated', user: 'admin@iskahomes.com', time: '2 hours ago', icon: FiSettings },
  { id: 5, action: 'Subscription approved', user: 'admin@iskahomes.com', time: '3 hours ago', icon: FiActivity }
]

export default function AdminAuditPage() {
  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-primary_color mb-2">Admin Audit Log</h1>
      <p className="text-primary_color/80 text-sm mb-4">Track admin actions. Dummy data for now - real logger coming with roles & permissions.</p>

      <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-primary_color/10">
          {DUMMY_AUDIT_LOGS.map((log) => {
            const Icon = log.icon
            return (
              <div key={log.id} className="px-6 py-4 flex items-center gap-4 hover:bg-primary_color/5 transition-colors">
                <div className="p-2 rounded-lg bg-primary_color/10">
                  <Icon className="w-5 h-5 text-primary_color" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary_color">{log.action}</p>
                  <p className="text-sm text-primary_color/70">by {log.user} • {log.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
