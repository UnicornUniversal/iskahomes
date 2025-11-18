'use client'

import React from 'react'
import { Phone, MessageCircle, Mail, Calendar, MessageSquare } from 'lucide-react'

export default function LeadsShare({ totalLeadsData }) {
  // Extract lead counts from breakdown (properly separated by message_type)
  const totalLeads = totalLeadsData?.total_leads || 0
  
  // Get individual lead types from leads_breakdown if available, otherwise fallback to direct properties
  const leadsBreakdown = totalLeadsData?.leads_breakdown || {}
  
  const phoneLeads = leadsBreakdown?.phone?.total || totalLeadsData?.phone_leads || 0
  const whatsappLeads = leadsBreakdown?.whatsapp?.total || totalLeadsData?.whatsapp_leads || 0
  const directMessageLeads = leadsBreakdown?.direct_message?.total || totalLeadsData?.direct_message_leads || 0
  const emailLeads = leadsBreakdown?.email?.total || totalLeadsData?.email_leads || 0
  const appointmentLeads = leadsBreakdown?.appointment?.total || totalLeadsData?.appointment_leads || 0

  // Calculate percentages based on total leads
  const phoneShare = totalLeads > 0 ? Math.round((phoneLeads / totalLeads) * 100) : 0
  const whatsappShare = totalLeads > 0 ? Math.round((whatsappLeads / totalLeads) * 100) : 0
  const directMessageShare = totalLeads > 0 ? Math.round((directMessageLeads / totalLeads) * 100) : 0
  const emailShare = totalLeads > 0 ? Math.round((emailLeads / totalLeads) * 100) : 0
  const appointmentShare = totalLeads > 0 ? Math.round((appointmentLeads / totalLeads) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-green-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Phone className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {phoneShare}%
        </div>
        <div className="text-sm text-gray-500">Phone</div>
        <div className="text-xs text-gray-400 mt-1">{phoneLeads} leads</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-blue-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {directMessageShare}%
        </div>
        <div className="text-sm text-gray-500">Direct Message</div>
        <div className="text-xs text-gray-400 mt-1">{directMessageLeads} leads</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-green-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {whatsappShare}%
        </div>
        <div className="text-sm text-gray-500">WhatsApp</div>
        <div className="text-xs text-gray-400 mt-1">{whatsappLeads} leads</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-purple-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Mail className="w-6 h-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {emailShare}%
        </div>
        <div className="text-sm text-gray-500">Email</div>
        <div className="text-xs text-gray-400 mt-1">{emailLeads} leads</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="p-3 bg-orange-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {appointmentShare}%
        </div>
        <div className="text-sm text-gray-500">Appointment</div>
        <div className="text-xs text-gray-400 mt-1">{appointmentLeads} leads</div>
      </div>
    </div>
  )
}

