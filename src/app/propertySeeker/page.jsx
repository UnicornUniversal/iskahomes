import React from 'react'
import { FiHome, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient_bg p-4">
      <div className="default_bg rounded-2xl shadow-xl border border-primary_color/10 p-8 lg:p-12 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary_color to-secondary_color rounded-2xl flex items-center justify-center shadow-lg">
            <FiHome className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-primary_color mb-3">
            Welcome to Property Seeker
          </h1>
          <p className="text-primary_color/70 text-lg">
            Your dashboard for finding the perfect home
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-primary_color/60">
            Please navigate to your dashboard to get started.
          </p>
          <Link 
            href="/propertySeeker/[slug]/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary_color text-white rounded-xl hover:bg-primary_color/90 transition-all duration-300 shadow-lg shadow-primary_color/20 font-medium"
          >
            <span>Go to Dashboard</span>
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default page
