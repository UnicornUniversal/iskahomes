'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { FiUser, FiUsers, FiHome, FiMapPin, FiActivity, FiLayers } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker',
  property_seeker: 'property_seeker'
}

const NAV_CONFIG = {
  developer: [
    { label: 'Profile', href: 'profile', icon: FiUser },
    { label: 'Users', href: 'users', icon: FiUsers },
    { label: 'Units', href: 'units', icon: FiHome },
    { label: 'Developments', href: 'developments', icon: FiLayers },
    { label: 'Activities', href: 'activities', icon: FiActivity }
  ],
  agency: [
    { label: 'Profile', href: 'profile', icon: FiUser },
    { label: 'Agents', href: 'agents', icon: FiUsers },
    { label: 'Users', href: 'users', icon: FiUsers },
    { label: 'Properties', href: 'properties', icon: FiMapPin },
    { label: 'Activities', href: 'activities', icon: FiActivity }
  ],
  agent: [
    { label: 'Profile', href: 'profile', icon: FiUser },
    { label: 'Properties', href: 'properties', icon: FiMapPin },
    { label: 'Activities', href: 'activities', icon: FiActivity }
  ],
  property_seeker: [
    { label: 'Profile', href: 'profile', icon: FiUser }
  ]
}

export default function UserDetailLayout({ children }) {
  const pathname = usePathname()
  const params = useParams()
  const { userType: urlType, userId } = params || {}
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const basePath = `/admin/users/${urlType}/${userId}`
  const navItems = NAV_CONFIG[userType] || NAV_CONFIG.developer

  return (
    <div className="w-full flex flex-col gap-6">
      <Link href={`/admin/users/${urlType}`} className="text-primary_color text-sm hover:underline w-fit">
        ← Back to list
      </Link>
      <nav className="flex flex-wrap gap-2 border-b border-primary_color/20 pb-4">
        {navItems.map((item) => {
          const href = `${basePath}/${item.href}`
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-primary_color text-text_color'
                  : 'bg-primary_color/10 text-primary_color hover:bg-primary_color/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
