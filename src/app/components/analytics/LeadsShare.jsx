'use client'

import React from 'react'
import { Calendar, Mail, MessageCircle, MessageSquare, Phone } from 'lucide-react'
import { analyticsClasses, formatNumber, formatPercent } from './analyticsTheme'

const actionCards = [
  {
    key: 'phone',
    label: 'Phone',
    icon: Phone,
    iconClass: 'bg-teal-50 text-teal-700 ring-teal-100'
  },
  {
    key: 'direct_message',
    label: 'Direct Message',
    icon: MessageSquare,
    iconClass: 'bg-sky-50 text-sky-700 ring-sky-100'
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    iconClass: 'bg-indigo-50 text-indigo-700 ring-indigo-100'
  },
  {
    key: 'appointment',
    label: 'Appointment',
    icon: Calendar,
    iconClass: 'bg-amber-50 text-amber-700 ring-amber-100'
  }
]

export default function LeadsShare({ totalLeadsData }) {
  const leadsBreakdown = totalLeadsData?.leads_breakdown || {}
  const messagingData = leadsBreakdown?.messaging || totalLeadsData?.messaging || {}

  const actionCounts = {
    phone: leadsBreakdown?.phone?.total || totalLeadsData?.phone_leads || 0,
    whatsapp:
      messagingData?.whatsapp?.total ??
      leadsBreakdown?.whatsapp?.total ??
      totalLeadsData?.whatsapp_leads ??
      0,
    direct_message:
      messagingData?.direct_message?.total ??
      leadsBreakdown?.direct_message?.total ??
      totalLeadsData?.direct_message_leads ??
      0,
    email: leadsBreakdown?.email?.total || totalLeadsData?.email_leads || 0,
    appointment: leadsBreakdown?.appointment?.total || totalLeadsData?.appointment_leads || 0
  }

  const totalTrackedActions = Object.values(actionCounts).reduce((sum, count) => sum + count, 0)
  const topAction = actionCards.reduce((best, card) => {
    const count = actionCounts[card.key] || 0
    if (!best || count > best.count) {
      return { key: card.key, label: card.label, count }
    }
    return best
  }, null)

  return (
    <div className={analyticsClasses.section}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className={analyticsClasses.eyebrow}>Action Share</span>
          <div>
            <h3 className={analyticsClasses.title}>Lead Action Distribution</h3>
            <p className={analyticsClasses.subtitle}>
              Shares are calculated from tracked lead actions, not unique leads, so the totals stay mathematically consistent.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className={analyticsClasses.compactCard}>
            <p className={analyticsClasses.metricLabel}>Tracked Actions</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">
              {formatNumber(totalTrackedActions)}
            </p>
          </div>
          <div className={analyticsClasses.compactCard}>
            <p className={analyticsClasses.metricLabel}>Unique Leads</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">
              {formatNumber(totalLeadsData?.total_leads || 0)}
            </p>
          </div>
          <div className={analyticsClasses.compactCard}>
            <p className={analyticsClasses.metricLabel}>Top Action</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">
              {topAction?.label || 'N/A'}
            </p>
            <p className="mt-1 text-xs text-primary_color/70">
              {formatNumber(topAction?.count || 0)} actions
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {actionCards.map(card => {
          const Icon = card.icon
          const count = actionCounts[card.key] || 0
          const share = totalTrackedActions > 0 ? (count / totalTrackedActions) * 100 : 0

          return (
            <div key={card.key} className={analyticsClasses.compactCard}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${analyticsClasses.iconWrap} ${card.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary_color">{card.label}</p>
                    <p className="text-xs text-primary_color/70">{formatNumber(count)} actions</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-primary_color">
                  {formatPercent(share, 0)}
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${Math.min(share, 100)}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-primary_color/70">
                {totalTrackedActions > 0
                  ? `${formatNumber(count)} of ${formatNumber(totalTrackedActions)} tracked actions`
                  : 'No tracked actions yet'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

