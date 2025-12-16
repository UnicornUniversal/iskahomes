'use client'

import React, { useState } from 'react'
import { FiChevronDown, FiChevronRight, FiCheck, FiX } from 'react-icons/fi'

// Default permissions structure based on our schema
const DEFAULT_PERMISSIONS = {
  dashboard: { view: false },
  units: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    publish: false,
    unpublish: false,
    archive: false,
    duplicate: false
  },
  developments: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    publish: false,
    unpublish: false
  },
  leads: {
    view: false,
    edit: false,
    delete: false,
    update_status: false,
    add_notes: false,
    export: false,
    assign: false
  },
  analytics: {
    view: false,
    view_overview: false,
    view_properties: false,
    view_leads: false,
    view_sales: false,
    view_profile_brand: false,
    export: false,
    configure: false
  },
  messages: {
    view: false,
    send: false,
    delete: false,
    mark_read: false
  },
  appointments: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
    reject: false,
    cancel: false
  },
  profile: {
    view: false,
    edit: false,
    delete: false,
    manage_locations: false,
    manage_gallery: false,
    manage_documents: false
  },
  subscription: {
    view: false,
    manage: false,
    upgrade: false,
    downgrade: false,
    cancel: false,
    view_billing: false
  },
  team: {
    view: false,
    invite: false,
    edit: false,
    remove: false,
    change_role: false,
    suspend: false
  },
  settings: {
    view: false,
    edit: false,
    manage_integrations: false
  }
}

const PermissionsEditor = ({ permissions, onChange }) => {
  const [expandedSections, setExpandedSections] = useState({})

  // Merge with default structure
  const mergedPermissions = { ...DEFAULT_PERMISSIONS, ...permissions }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const togglePermission = (section, permission) => {
    const updated = {
      ...mergedPermissions,
      [section]: {
        ...mergedPermissions[section],
        [permission]: !mergedPermissions[section]?.[permission]
      }
    }
    onChange(updated)
  }

  const toggleAllInSection = (section) => {
    const sectionPerms = mergedPermissions[section] || {}
    const allTrue = Object.values(sectionPerms).every(v => v === true)
    const updated = {
      ...mergedPermissions,
      [section]: Object.keys(sectionPerms).reduce((acc, key) => {
        acc[key] = !allTrue
        return acc
      }, {})
    }
    onChange(updated)
  }

  const getSectionLabel = (section) => {
    const labels = {
      dashboard: 'Dashboard',
      units: 'Units',
      developments: 'Developments',
      leads: 'Leads',
      analytics: 'Analytics',
      messages: 'Messages',
      appointments: 'Appointments',
      profile: 'Profile',
      subscription: 'Subscription',
      team: 'Team Management',
      settings: 'Settings'
    }
    return labels[section] || section
  }

  return (
    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
      {Object.keys(DEFAULT_PERMISSIONS).map((section) => {
        const isExpanded = expandedSections[section]
        const sectionPerms = mergedPermissions[section] || {}
        const allTrue = Object.values(sectionPerms).every(v => v === true)
        const someTrue = Object.values(sectionPerms).some(v => v === true)

        return (
          <div key={section}>
            {/* Section Header */}
            <div
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => toggleSection(section)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <FiChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-semibold text-gray-900">{getSectionLabel(section)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleAllInSection(section)
                  }}
                  className={`px-3 py-1 text-xs rounded ${
                    allTrue
                      ? 'bg-green-100 text-green-700'
                      : someTrue
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {allTrue ? 'All' : someTrue ? 'Some' : 'None'}
                </button>
              </div>
            </div>

            {/* Section Permissions */}
            {isExpanded && (
              <div className="p-4 bg-gray-50 space-y-2">
                {Object.keys(sectionPerms).map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={sectionPerms[permission] || false}
                      onChange={() => togglePermission(section, permission)}
                      className="w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {permission.replace(/_/g, ' ')}
                    </span>
                    {sectionPerms[permission] ? (
                      <FiCheck className="w-4 h-4 text-green-600 ml-auto" />
                    ) : (
                      <FiX className="w-4 h-4 text-gray-300 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PermissionsEditor

