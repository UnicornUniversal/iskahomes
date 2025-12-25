'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiSettings, FiBarChart2, FiFileText } from 'react-icons/fi'

const PropertyNav = () => {
  const pathname = usePathname()
  
  // Extract propertySlug from pathname: /agents/[slug]/properties/[propertySlug]/...
  const pathParts = pathname?.split('/') || []
  const slugIndex = pathParts.indexOf('properties')
  const propertySlug = slugIndex >= 0 && pathParts[slugIndex + 1] ? pathParts[slugIndex + 1] : null
  
  // Don't show nav if we're not on a property page
  if (!propertySlug || propertySlug === 'addNewProperty') {
    return null
  }
  
  // Build base path
  const basePath = pathname?.substring(0, pathname.indexOf('/properties/') + `/properties/${propertySlug}`.length) || ''
  
  // Determine active tab
  const isManage = pathname === basePath || (pathname?.startsWith(basePath) && !pathname.includes('/analytics') && !pathname.includes('/transactionRecords'))
  const isAnalytics = pathname?.includes('/analytics')
  const isTransactionRecords = pathname?.includes('/transactionRecords')
  
  const navItems = [
    {
      label: 'Property Management',
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
      label: 'Transaction Records',
      icon: FiFileText,
      href: `${basePath}/transactionRecords`,
      active: isTransactionRecords
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

export default PropertyNav

