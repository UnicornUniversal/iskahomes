'use client'

import React, { useState, useEffect } from 'react'
import { FiUsers, FiMapPin, FiHome, FiEye, FiTrendingUp, FiCheckCircle } from 'react-icons/fi'
import Link from 'next/link'
import DataCard from '@/app/components/developers/DataCard'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(result => {
        if (result.success) setStats(result.data)
        else setError(result.error || 'Failed to load stats')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <h1 className="text-primary_color mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="design1 p-6 h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="secondary_bg p-6 rounded-2xl">
        <p className="text-primary_red">{error}</p>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Users', value: stats?.total_users ?? 0, icon: FiUsers, href: '/admin/users/developers' },
    { title: 'Developers', value: stats?.total_developers ?? 0, icon: FiHome, href: '/admin/users/developers' },
    { title: 'Agents', value: stats?.total_agents ?? 0, icon: FiUsers, href: '/admin/users/agents' },
    { title: 'Agencies', value: stats?.total_agencies ?? 0, icon: FiHome, href: '/admin/users/agencies' },
    { title: 'Property Seekers', value: stats?.total_property_seekers ?? 0, icon: FiEye, href: '/admin/users/property-seekers' },
    { title: 'Total Listings', value: stats?.total_listings ?? 0, icon: FiMapPin, href: '/admin/properties' }
  ]

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-primary_color mb-4">Admin Dashboard</h1>
      <p className="text-primary_color/80 text-sm mb-2">Platform overview. Public data only.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <DataCard title={stat.title} value={stat.value} icon={stat.icon} />
          </Link>
        ))}
      </div>

      <div className="secondary_bg p-4 rounded-2xl shadow-sm flex-1">
        <h3 className="text-primary_color font-semibold mb-4">Quick Links</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 p-3 bg-primary_color/5 rounded-lg">
            <FiTrendingUp className="w-5 h-5 text-primary_color" />
            <div>
              <p className="font-medium text-primary_color">Platform overview</p>
              <p className="text-sm text-primary_color/70">View user and listing counts above</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-primary_color/5 rounded-lg">
            <FiCheckCircle className="w-5 h-5 text-primary_color" />
            <div>
              <p className="font-medium text-primary_color">Navigation</p>
              <p className="text-sm text-primary_color/70">Use the sidebar to manage users, properties, and subscriptions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
