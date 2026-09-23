'use client'

import React from 'react'
import OrgReport from '@/app/components/reports/OrgReport'

export default function ReportPreviewPage() {
  return (
    <div className="min-h-screen bg-white_bg px-4 py-10 pb-24 sm:px-8 lg:px-12 xl:pb-16">
      <OrgReport accountType="developer" showAccountToggle />
    </div>
  )
}
