'use client'

import React from 'react'
import { Phone, MessageCircle, Mail, Calendar } from 'lucide-react'

export default function LeadsShare({ totalLeadsData }) {
  // Calculate percentages based on total leads
  const totalLeads = totalLeadsData?.total_leads || 0
  const phoneLeads = totalLeadsData?.phone_leads || 0
  const messageLeads = totalLeadsData?.message_leads || 0
  const emailLeads = totalLeadsData?.email_leads || 0
  const appointmentLeads = totalLeadsData?.appointment_leads || 0

  const phoneShare = totalLeads > 0 ? Math.round((phoneLeads / totalLeads) * 100) : 0
  const messageShare = totalLeads > 0 ? Math.round((messageLeads / totalLeads) * 100) : 0
  const emailShare = totalLeads > 0 ? Math.round((emailLeads / totalLeads) * 100) : 0
  const appointmentShare = totalLeads > 0 ? Math.round((appointmentLeads / totalLeads) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-green-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Phone className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {phoneShare}%
        </div>
        <div className="text-sm text-gray-500">Phone Share</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-blue-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {messageShare}%
        </div>
        <div className="text-sm text-gray-500">Message Share</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-purple-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Mail className="w-6 h-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {emailShare}%
        </div>
        <div className="text-sm text-gray-500">Email Share</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-orange-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {appointmentShare}%
        </div>
        <div className="text-sm text-gray-500">Appointment Share</div>
      </div>
    </div>
  )
}

