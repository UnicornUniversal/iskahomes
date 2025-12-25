'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiSettings, FiBarChart2, FiUsers } from 'react-icons/fi'

const ListingNav = () => {
  const pathname = usePathname()
  
  // Extract unitSlug from pathname: /developer/[slug]/units/[unitSlug]/...
  const pathParts = pathname?.split('/') || []
  const slugIndex = pathParts.indexOf('units')
  const unitSlug = slugIndex >= 0 && pathParts[slugIndex + 1] ? pathParts[slugIndex + 1] : null
  
  // Don't show nav if we're not on a unit page (for developers)
  if (!unitSlug || unitSlug === 'addNewUnit') {
    return null
  }
  
  // Build base path
  const basePath = pathname?.substring(0, pathname.indexOf('/units/') + `/units/${unitSlug}`.length) || ''
  
  // Determine active tab
  const isManage = pathname === basePath || pathname?.startsWith(basePath) && !pathname.includes('/analytics') && !pathname.includes('/leads')
  const isAnalytics = pathname?.includes('/analytics')
  const isLeads = pathname?.includes('/leads')
  
  const navItems = [
    {
      label: 'Manage Listing',
      icon: FiSettings,
      href: basePath,
      active: isManage
    },
    {
      label: 'Analytics',
      icon: FiBarChart2,
      href: `${basePath}/analytics`,
      active: isAnalytics
    },
    {
      label: 'Leads',
      icon: FiUsers,
      href: `${basePath}/leads`,
      active: isLeads
    }
  ]

  return (
    <div className="rounded-full bg-white/40 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-1 w-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 p-4 
                ${
                  item.active
                    ? 'secondary_button !text-[0.8em]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <p className="text-[0.8em]">{item.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ListingNav
