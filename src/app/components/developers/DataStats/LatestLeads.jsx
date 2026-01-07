'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserPlus, Calendar, Loader2, Image as ImageIcon, Phone, Mail, MessageSquare, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Helper function to get lead category from score
function getLeadCategory(score) {
  if (score >= 60) return { label: 'High', color: 'bg-green-100 border-green-200' }
  if (score >= 25) return { label: 'Medium', color: 'bg-yellow-100 border-yellow-200' }
  return { label: 'Base', color: 'bg-gray-100 border-gray-200' }
}

const LatestLeads = ({ listerId: propListerId = null, listerType: propListerType = 'developer' }) => {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  // Use provided listerId/listerType or fall back to auth user
  const listerId = propListerId || user?.id
  const listerType = propListerType || user?.profile?.account_type || 'developer'

  useEffect(() => {
    if (!listerId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchLeads = async () => {
      try {
        const response = await fetch(`/api/leads/latest?lister_id=${listerId}&lister_type=${listerType}&limit=7`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setLeads(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching latest leads:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLeads()

    return () => {
      isMounted = false
    }
  }, [listerId, listerType])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getActionIcon = (actionType) => {
    if (!actionType) return <UserPlus className="w-3.5 h-3.5" />
    if (actionType.includes('phone')) return <Phone className="w-3.5 h-3.5" />
    if (actionType.includes('message')) return <MessageSquare className="w-3.5 h-3.5" />
    if (actionType.includes('email')) return <Mail className="w-3.5 h-3.5" />
    return <UserPlus className="w-3.5 h-3.5" />
  }

  const getActionLabel = (actionType) => {
    if (!actionType) return 'Lead'
    if (actionType.includes('phone')) return 'Phone'
    if (actionType.includes('message')) return 'Message'
    if (actionType.includes('email')) return 'Email'
    if (actionType.includes('appointment')) return 'Appointment'
    return 'Lead'
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-primary_color/10 border-primary_color/20'
      case 'contacted':
        return 'bg-secondary_color/10 border-secondary_color/20'
      case 'qualified':
        return 'bg-primary_color/10 border-primary_color/20'
      case 'converted':
        return 'bg-primary_color/10 border-primary_color/20'
      case 'lost':
        return 'bg-gray-100 border-gray-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className=" border border-gray-200 rounded-lg p-6 flex-1">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className=" border border-gray-200  text-primary_color rounded-lg p-6 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h3 className="text-base font-semibold">Latest Leads</h3>
        </div>
        {leads.length > 0 && (
          <span className="text-xs">{leads.length}</span>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <p className="text-sm">No leads yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Property
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={lead.listing?.slug && lead.listing?.listing_type && lead.listingId ? `/home/property/${lead.listing.listing_type}/${lead.listing.slug}/${lead.listingId}` : '#'}
                        className="flex items-center gap-3 group"
                      >
                        {lead.listing?.image ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                            <Image
                              src={lead.listing.image}
                              alt={lead.listing.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-sm font-medium transition-colors">
                          {lead.listing?.title || (lead.isProfileLead ? 'Profile Lead' : 'Unknown Property')}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        {getActionIcon(lead.lastActionType)}
                        <span>{getActionLabel(lead.lastActionType)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {lead.totalActions || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span className="text-sm font-semibold">{lead.leadScore || 0}</span>
                        </div>
                        {(() => {
                          const category = getLeadCategory(lead.leadScore || 0)
                          return (
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border w-fit ${category.color}`}>
                              {category.label}
                            </span>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {lead.status || 'New'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(lead.lastActionDate)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              href={`/developer/${user?.profile?.slug || user?.profile?.id}/leads`}
              className="flex items-center justify-center gap-1 text-sm font-medium transition-colors"
            >
              View All Leads
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default LatestLeads
