'use client'

import React, { useState, useMemo } from 'react'
import { FiChevronDown, FiChevronRight, FiCheck, FiX } from 'react-icons/fi'
import { getDefaultPermissionsStructure, getPermissions } from '@/lib/rolesAndPermissions'

const PermissionsEditor = ({ permissions, onChange, organizationType = 'developer' }) => {
  const [expandedSections, setExpandedSections] = useState({})

  // Get default permissions structure based on organization type
  const defaultPermissions = useMemo(() => {
    return getDefaultPermissionsStructure(organizationType)
  }, [organizationType])

  // Get permissions structure for labels
  const permissionsStructure = useMemo(() => {
    return getPermissions(organizationType)
  }, [organizationType])

  // Merge with default structure
  const mergedPermissions = useMemo(() => {
    const merged = { ...defaultPermissions }
    
    // Handle both array and object formats
    Object.keys(permissions || {}).forEach(category => {
      if (permissions[category]) {
        if (Array.isArray(permissions[category])) {
          // Convert array format to object format
          merged[category] = { ...defaultPermissions[category] }
          permissions[category].forEach(action => {
            if (merged[category].hasOwnProperty(action)) {
              merged[category][action] = true
            }
          })
        } else if (typeof permissions[category] === 'object') {
          // Already in object format
          merged[category] = { ...defaultPermissions[category], ...permissions[category] }
        }
      }
    })
    
    return merged
  }, [permissions, defaultPermissions])

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
      listings: 'Listings',
      developments: 'Developments',
      leads: 'Leads',
      analytics: 'Analytics',
      messages: 'Messages',
      appointments: 'Appointments',
      profile: 'Profile',
      subscriptions: 'Subscriptions',
      subscription: 'Subscription',
      team: 'Team Management',
      agents: 'Agents',
      media: 'Media',
      financial: 'Financial',
      favorites: 'Favorites',
      reviews: 'Reviews',
      settings: 'Settings'
    }
    return labels[section] || section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, ' ')
  }

  const getPermissionLabel = (permission, section) => {
    // If permission name matches section name, it's the parent permission
    if (permission === section) {
      return `Access ${getSectionLabel(section)} Route`
    }
    
    const labels = {
      read: 'Read',
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      publish: 'Publish',
      unpublish: 'Unpublish',
      feature: 'Feature',
      view_analytics: 'View Analytics',
      view_leads: 'View Leads',
      manage: 'Manage',
      send: 'Send',
      reply: 'Reply',
      view_all: 'View All',
      assign: 'Assign',
      update: 'Update',
      export: 'Export',
      invite: 'Invite',
      remove: 'Remove',
      manage_roles: 'Manage Roles',
      assign_roles: 'Assign Roles',
      manage_permissions: 'Manage Permissions',
      view_overview: 'View Overview',
      view_properties: 'View Properties',
      view_sales: 'View Sales',
      view_profile_brand: 'View Profile & Brand',
      view_appointments: 'View Appointments',
      view_messages: 'View Messages',
      view_market: 'View Market',
      view_agents: 'View Agents',
      manage_branding: 'Manage Branding',
      manage_settings: 'Manage Settings',
      manage_locations: 'Manage Locations',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      cancel: 'Cancel',
      upload: 'Upload',
      view_pricing: 'View Pricing',
      edit_pricing: 'Edit Pricing',
      view_revenue: 'View Revenue',
      view_commission: 'View Commission',
      manage_commission: 'Manage Commission',
      add: 'Add',
      remove: 'Remove',
      approve: 'Approve',
      reject: 'Reject',
      respond: 'Respond'
    }
    return labels[permission] || permission.charAt(0).toUpperCase() + permission.slice(1).replace(/_/g, ' ')
  }

  // Check if permission is parent permission (matches section name)
  const isParentPermission = (permission, section) => {
    return permission === section
  }

  // Get sorted permissions - parent first, then others
  const getSortedPermissions = (sectionPerms, section) => {
    const sorted = Object.keys(sectionPerms)
    const parentIndex = sorted.indexOf(section)
    if (parentIndex > -1) {
      // Move parent to front
      sorted.splice(parentIndex, 1)
      return [section, ...sorted]
    }
    return sorted
  }

  return (
    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
      {Object.keys(defaultPermissions).map((section) => {
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
                {getSortedPermissions(sectionPerms, section).map((permission) => {
                  const isParent = isParentPermission(permission, section)
                  return (
                    <label
                      key={permission}
                      className={`flex items-center gap-3 p-3 hover:bg-white rounded cursor-pointer transition-colors ${
                        isParent ? 'bg-blue-50 border-l-4 border-blue-500 font-semibold' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sectionPerms[permission] || false}
                        onChange={() => togglePermission(section, permission)}
                        className={`w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color ${
                          isParent ? 'border-blue-500' : ''
                        }`}
                      />
                      <span className={`text-sm ${isParent ? 'text-blue-900 font-semibold' : 'text-gray-700'}`}>
                        {getPermissionLabel(permission, section)}
                        {isParent && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            (Route Access)
                          </span>
                        )}
                      </span>
                      {sectionPerms[permission] ? (
                        <FiCheck className={`w-4 h-4 ml-auto ${isParent ? 'text-blue-600' : 'text-green-600'}`} />
                      ) : (
                        <FiX className="w-4 h-4 text-gray-300 ml-auto" />
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PermissionsEditor

