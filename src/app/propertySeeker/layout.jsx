'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import HomeSeekerNav from '@/app/components/homeSeeker/HomeSeekerNav'

export default function PropertySeekerLayout({ children }) {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen gradient_bg">
      <div className="flex items-start justify-start w-full">
        {/* Navigation Sidebar */}
        <HomeSeekerNav pathname={pathname} />
        
        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 transition-all duration-300">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
