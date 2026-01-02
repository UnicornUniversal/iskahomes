'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileText, BarChart3, Receipt } from 'lucide-react'

const PropertiesLayout = ({ children }) => {
  const pathname = usePathname()
  
  // Extract propertySlug from pathname: /agency/[slug]/properties/[propertySlug]/...
  const pathParts = pathname?.split('/') || []
  const slugIndex = pathParts.indexOf('properties')
  const propertySlug = slugIndex >= 0 && pathParts[slugIndex + 1] ? pathParts[slugIndex + 1] : null
  const slug = pathParts[2] || ''
  
  // Don't show nav if we're not on a property page
  if (!propertySlug || propertySlug === 'addNewProperty') {
    return <>{children}</>
  }
  
  // Build base path
  const basePath = `/agency/${slug}/properties/${propertySlug}`
  
  // Determine active tab
  const isPropertyDetails = pathname === basePath || (pathname?.startsWith(basePath) && !pathname.includes('/analytics') && !pathname.includes('/transactionRecords'))
  const isAnalytics = pathname?.includes('/analytics')
  const isTransactionRecords = pathname?.includes('/transactionRecords')
  
  const navItems = [
    {
      label: 'Property Details',
      icon: FileText,
      href: basePath,
      active: isPropertyDetails
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: `${basePath}/analytics`,
      active: isAnalytics
    },
    {
      label: 'Transaction Records',
      icon: Receipt,
      href: `${basePath}/transactionRecords`,
      active: isTransactionRecords
    }
  ]

  return (
    <div className='w-full flex flex-col gap-4'>
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
      {children}
    </div>
  )
}

export default PropertiesLayout

