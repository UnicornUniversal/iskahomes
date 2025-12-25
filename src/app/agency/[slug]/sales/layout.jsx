'use client'

import React from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Percent } from 'lucide-react'

export default function SalesLayout({ children }) {
  const params = useParams()
  const pathname = usePathname()
  const slug = params.slug || ''
  
  // Determine active tab
  const isCommissionRatePage = pathname?.includes('/commissionRate')

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <Link
              href={`/agency/${slug}/sales`}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                !isCommissionRatePage
                  ? 'border-primary_color text-primary_color'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sales Analytics</span>
            </Link>
            <Link
              href={`/agency/${slug}/sales/commissionRate`}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isCommissionRatePage
                  ? 'border-primary_color text-primary_color'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Commission Rates</span>
            </Link>
          </nav>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

