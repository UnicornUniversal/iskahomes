'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import propertySeekerNav from '@/app/components/homeSeeker/HomeSeekerNav'

import HomeSeekerNav from '@/app/components/homeSeeker/HomeSeekerNav'

export default function PropertySeekerLayout({ children }) {
  const pathname = usePathname()

  console.log(pathname)
  
  return (
    <div className="min-h-screen ">
      <div className="flex items-start justify-start">
        {/* Navigation Sidebar */}
        <HomeSeekerNav pathname={pathname} />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
