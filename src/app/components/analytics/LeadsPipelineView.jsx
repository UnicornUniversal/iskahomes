'use client'

import React, { useMemo, useState } from 'react'
import { FiUser, FiImage, FiExternalLink, FiEye } from 'react-icons/fi'
import { buildPipelineColumns } from '@/lib/leadsPipelineHelper'

function getLeadCategory(score) {
  if (score >= 60) return { label: 'High', color: 'bg-green-100 text-green-800 border-green-200' }
  if (score >= 25) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  return { label: 'Base', color: 'bg-gray-100 text-secondary_color-800 border-gray-200' }
}

function LeadPipelineCard({ lead, isDragging, isUpdating, onDragStart, onDragEnd, onViewModal, onOpenPage }) {
  const category = getLeadCategory(lead.lead_score || 0)
  const seekerName =
    lead.seeker_name && lead.seeker_name !== lead.seeker_id ? lead.seeker_name : 'Unknown Seeker'

  return (
    <div
      draggable={!isUpdating}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : ''
      } ${isUpdating ? 'opacity-60 pointer-events-none' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FiUser className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-secondary_color-900 truncate">{seekerName}</p>
            <p className="text-xs text-secondary_color-500">{lead.total_actions || 0} actions</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onViewModal()
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Quick view"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenPage()
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Open lead page"
          >
            <FiExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {lead.listing_image ? (
          <img
            src={lead.listing_image}
            alt=""
            className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
            <FiImage className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-secondary_color-900 truncate">
            {lead.listing_title || 'No listing'}
          </p>
          {lead.listing_location && (
            <p className="text-xs text-secondary_color-500 truncate">{lead.listing_location}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className="inline-flex px-1.5 py-0.5 rounded text-xs border bg-gray-100 text-secondary_color-800">
          {lead.lead_classification || 'Standard'}
        </span>
        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs border ${category.color}`}>
          {lead.lead_score ?? 0} - {category.label}
        </span>
      </div>
      {(lead.lead_actions || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {(lead.lead_actions || []).slice(0, 2).map((action, idx) => (
            <span
              key={idx}
              className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700"
            >
              {(action.action_type || '').replace('lead_', '')}
            </span>
          ))}
          {(lead.lead_actions || []).length > 2 && (
            <span className="text-[10px] text-secondary_color-500">
              +{(lead.lead_actions || []).length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function LeadsPipelineView({
  stages = [],
  leads = [],
  loading = false,
  updatingLeadId = null,
  onLeadClick,
  onOpenLeadPage,
  onStatusChange,
}) {
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const columns = useMemo(() => buildPipelineColumns(stages, leads), [stages, leads])

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
  }

  const handleDragEnd = () => {
    setDraggedLeadId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnStatus)
  }

  const handleDrop = async (e, columnStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId
    if (!leadId) return

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === columnStatus) {
      setDraggedLeadId(null)
      return
    }

    setDraggedLeadId(null)
    await onStatusChange(leadId, columnStatus)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => (
          <div key={column.id || column.status} className="flex-shrink-0 w-72 flex flex-col">
            <h3 className="text-sm font-semibold text-secondary_color-900 mb-2 px-1">
              {column.value}{' '}
              <span className="text-secondary_color-500 font-normal">({column.leads.length})</span>
            </h3>
            <div
              className={`flex-1 flex flex-col rounded-xl bg-gray-100 border min-h-[200px] ${
                dragOverColumn === column.status
                  ? 'border-primary_color ring-2 ring-primary_color/30'
                  : 'border-gray-200'
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="flex-1 p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-22rem)] overflow-y-auto">
                {column.leads.length === 0 ? (
                  <p className="text-xs text-secondary_color-400 text-center py-6 px-2">
                    Drop leads here
                  </p>
                ) : (
                  column.leads.map((lead) => (
                    <LeadPipelineCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggedLeadId === lead.id}
                      isUpdating={updatingLeadId === lead.id}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      onViewModal={() => onLeadClick(lead)}
                      onOpenPage={() => onOpenLeadPage(lead.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
