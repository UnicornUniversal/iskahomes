'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiCheckCircle,
  FiCalendar,
  FiUsers,
  FiHome,
  FiFileText,
  FiImage,
  FiMessageCircle,
  FiLinkedin,
  FiInstagram,
  FiTwitter,
  FiFacebook
} from 'react-icons/fi'

const ID_FIELDS = {
  developer: 'developer_id',
  agent: 'agent_id',
  agency: 'agency_id',
  property_seeker: 'id'
}

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'unapproved', label: 'Unapproved' },
  { value: 'inactive', label: 'Inactive' }
]

const getImageUrl = (img) => {
  if (!img) return null
  if (typeof img === 'string') {
    try {
      const parsed = JSON.parse(img)
      return parsed?.url || parsed?.path || img
    } catch {
      return img
    }
  }
  return img?.url || img?.path || null
}

export default function UserProfilePage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const userId = params?.userId
  const idField = ID_FIELDS[userType]

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setUser(result.data)
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  const getCurrentStatus = () => {
    if (!user) return 'pending'
    // Use admin_status when available; fallback for backwards compatibility
    if (user.admin_status) return user.admin_status
    if (userType === 'property_seeker') {
      return user.status === 'inactive' ? 'inactive' : 'approved'
    }
    if (user.verified && user.account_status === 'active') return 'approved'
    if (user.account_status === 'suspended') return 'unapproved'
    if (user.account_status === 'inactive') return 'inactive'
    return user.account_status || 'pending'
  }

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      const body = { admin_status: newStatus }
      const res = await fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await res.json()
      if (result.success) setUser(result.data)
    } finally {
      setUpdating(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '—'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const parseJson = (val) => {
    if (!val) return null
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse">
        <div className="h-20 bg-primary_color/10 rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <p className="text-red-600">User not found</p>
      </div>
    )
  }

  const coverUrl = getImageUrl(user.cover_image)
  const profileUrl = getImageUrl(user.profile_image)
  const companyGallery = parseJson(user.company_gallery) || []
  const companyLocations = parseJson(user.company_locations) || []
  const companyStatistics = parseJson(user.company_statistics) || []
  const socialMedia = parseJson(user.social_media) || {}
  const customerCare = parseJson(user.customer_care) || []
  const specialization = parseJson(user.specialization)
  const registrationFiles = parseJson(user.registration_files) || []

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Status dropdown at top */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-primary_color">Account Status</h3>
          <select
            value={getCurrentStatus()}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="px-4 py-2 rounded-lg border border-primary_color/30 text-primary_color bg-white font-medium"
          >
            {userType === 'property_seeker' ? (
              <>
                <option value="approved">Active</option>
                <option value="inactive">Inactive</option>
              </>
            ) : (
              STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Cover + Profile Header */}
      <div className="relative h-48 bg-primary_color/10 rounded-xl overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary_color/50">
            <FiUser className="w-16 h-16 mb-2" />
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              {profileUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img src={profileUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary_color/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-2xl font-semibold text-primary_color">{getInitials(user.name)}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary_color mb-1">{user.name || '—'}</h2>
              <div className="flex flex-col gap-1">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm text-primary_color/80">
                    <FiMail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-primary_color/80">
                    <FiPhone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="text-xs text-primary_color/60 mt-1">{user.slug || user[idField]}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Location - solid white cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {user.phone && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-primary_color/70 mb-1">Phone</p>
            <p className="font-medium text-primary_color">{user.phone}</p>
          </div>
        )}
        {user.website && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-primary_color/70 mb-1">Website</p>
            <a href={user.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary_color hover:underline flex items-center gap-2">
              <FiGlobe className="w-4 h-4" /> {user.website}
            </a>
          </div>
        )}
        {(user.city || user.address) && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-primary_color/70 mb-1">Location</p>
            <p className="font-medium text-primary_color flex items-center gap-2">
              <FiMapPin className="w-4 h-4" />
              {[user.address, user.city, user.region, user.state, user.country].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* About / Description */}
      {(user.description || user.bio) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">About</h3>
          <p className="text-sm text-primary_color/90 leading-relaxed whitespace-pre-wrap">{user.description || user.bio}</p>
        </div>
      )}

      {/* Secondary contact - Developer & Agent */}
      {(userType === 'developer' || userType === 'agent') && (user.secondary_email || user.secondary_phone || user.tertiary_email || user.tertiary_phone) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Additional Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.secondary_email && <div><p className="text-xs text-primary_color/70">Secondary Email</p><p className="text-primary_color">{user.secondary_email}</p></div>}
            {user.secondary_phone && <div><p className="text-xs text-primary_color/70">Secondary Phone</p><p className="text-primary_color">{user.secondary_phone}</p></div>}
            {user.tertiary_email && <div><p className="text-xs text-primary_color/70">Tertiary Email</p><p className="text-primary_color">{user.tertiary_email}</p></div>}
            {user.tertiary_phone && <div><p className="text-xs text-primary_color/70">Tertiary Phone</p><p className="text-primary_color">{user.tertiary_phone}</p></div>}
          </div>
        </div>
      )}

      {/* Registration & Documentation - Developer/Agency */}
      {(userType === 'developer' || userType === 'agency') && (user.license_number || registrationFiles?.length > 0) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Registration & Documentation</h3>
          {user.license_number && (
            <div className="mb-4">
              <p className="text-xs text-primary_color/70 mb-1">License Number</p>
              <p className="text-primary_color font-medium">{user.license_number}</p>
            </div>
          )}
          {registrationFiles?.length > 0 && (
            <div>
              <p className="text-xs text-primary_color/70 mb-2">Registration Documents</p>
              <div className="flex flex-wrap gap-2">
                {registrationFiles.map((f, i) => (
                  <a key={i} href={f?.url || f?.path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-primary_color/10 rounded-lg text-primary_color hover:bg-primary_color/20">
                    <FiFileText className="w-4 h-4" />
                    {f?.name || `Document ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Company Overview - Developer/Agency */}
      {(userType === 'developer' || userType === 'agency') && (user.founded_year || user.company_size) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Company Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.founded_year && <div><p className="text-xs text-primary_color/70">Founded</p><p className="text-primary_color">{user.founded_year}</p></div>}
            {user.company_size && <div><p className="text-xs text-primary_color/70">Company Size</p><p className="text-primary_color">{user.company_size} employees</p></div>}
            {user.total_developments != null && userType === 'developer' && <div><p className="text-xs text-primary_color/70">Total Developments</p><p className="text-primary_color">{user.total_developments}</p></div>}
            {user.total_units != null && userType === 'developer' && <div><p className="text-xs text-primary_color/70">Total Units</p><p className="text-primary_color">{user.total_units}</p></div>}
            {user.total_listings != null && <div><p className="text-xs text-primary_color/70">Total Listings</p><p className="text-primary_color">{user.total_listings}</p></div>}
            {user.total_agents != null && userType === 'agency' && <div><p className="text-xs text-primary_color/70">Total Agents</p><p className="text-primary_color">{user.total_agents}</p></div>}
          </div>
        </div>
      )}

      {/* Specialization - Developer */}
      {userType === 'developer' && specialization && (specialization.database?.length > 0 || specialization.custom?.length > 0) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Property Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {specialization.database?.map((s, i) => (
              <span key={i} className="px-4 py-2 border border-primary_color rounded-full text-sm text-primary_color">{typeof s === 'string' ? s : s?.name}</span>
            ))}
            {specialization.custom?.map((s, i) => (
              <span key={`c-${i}`} className="px-4 py-2 border border-primary_color rounded-full text-sm text-primary_color">{typeof s === 'string' ? s : s?.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Company Statistics */}
      {companyStatistics?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Company Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyStatistics.map((stat, i) => (
              <div key={i}>
                <p className="text-xs text-primary_color/70">{stat.label}</p>
                <p className="text-primary_color font-medium">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Locations */}
      {companyLocations?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Locations</h3>
          <div className="space-y-2">
            {companyLocations.map((loc, i) => (
              <div key={i} className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-primary_color flex-shrink-0" />
                <span className="text-primary_color">
                  {[loc.city, loc.region, loc.country].filter(Boolean).join(', ') || loc.address || 'Location'}
                  {loc.primary_location && ' (Primary)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Gallery */}
      {companyGallery?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {companyGallery.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={img?.url || img} alt={img?.name || `Image ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media */}
      {socialMedia && Object.keys(socialMedia).length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Social Media</h3>
          <div className="flex flex-wrap gap-4">
            {socialMedia.instagram && <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary_color hover:underline"><FiInstagram className="w-5 h-5" /> Instagram</a>}
            {socialMedia.linkedin && <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary_color hover:underline"><FiLinkedin className="w-5 h-5" /> LinkedIn</a>}
            {socialMedia.twitter && <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary_color hover:underline"><FiTwitter className="w-5 h-5" /> Twitter</a>}
            {socialMedia.facebook && <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary_color hover:underline"><FiFacebook className="w-5 h-5" /> Facebook</a>}
          </div>
        </div>
      )}

      {/* Customer Care */}
      {customerCare?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Customer Care</h3>
          <div className="space-y-2">
            {customerCare.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <FiMessageCircle className="w-4 h-4 text-primary_color" />
                <span className="text-primary_color">{c.name}: {c.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent: Agency info */}
      {userType === 'agent' && (user.agency_id || user.agency) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Agency</h3>
          <p className="text-primary_color">
            {user.agency?.name ? user.agency.name : `Agency ID: ${user.agency_id}`}
            {user.agency?.slug && <span className="text-primary_color/70 ml-2">({user.agency.slug})</span>}
          </p>
        </div>
      )}
    </div>
  )
}
