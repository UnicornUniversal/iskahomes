/**
 * Roles and Permissions Configuration
 * Supports both 'developer' and 'agency' organization types
 * 
 * IMPORTANT: Permissions match actual project operations and routes
 * - No redundant parent permissions (e.g., dashboard.dashboard)
 * - Permissions match actual CRUD operations
 * - Status changes are handled via edit permission (changing listing_status, status fields)
 */

// Permission definitions for Developers
// Each category has actions that match actual operations in the system
const developerPermissions = {
  dashboard: {
    view: 'dashboard.view',        // Access dashboard route and view data
    export: 'dashboard.export'    // Export dashboard data
  },
  messages: {
    view: 'messages.view',        // View messages/conversations
    send: 'messages.send'         // Send new messages
  },
  developments: {
    view: 'developments.view',     // View developments list and details
    create: 'developments.create', // Create new developments
    edit: 'developments.edit',    // Edit developments (includes changing status/development_status)
    delete: 'developments.delete' // Delete developments
  },
  units: {
    view: 'units.view',           // View units list and details
    create: 'units.create',       // Create new units
    edit: 'units.edit',           // Edit units (includes changing listing_status, status, is_featured)
    delete: 'units.delete',       // Delete units
    view_analytics: 'units.view_analytics', // View unit analytics page
    view_leads: 'units.view_leads'          // View unit leads page
  },
  appointments: {
    view: 'appointments.view',    // View appointments list and calendar
    create: 'appointments.create', // Create new appointments
    edit: 'appointments.edit',    // Edit appointments (includes updating status)
    delete: 'appointments.delete' // Delete appointments
  },
  leads: {
    view: 'leads.view',           // View leads list
    view_all: 'leads.view_all',  // View all leads (not just assigned)
    edit: 'leads.edit',          // Edit lead information
    update_status: 'leads.update_status', // Update lead status
    add_notes: 'leads.add_notes', // Add notes to leads
    assign: 'leads.assign',      // Assign leads to team members
    delete: 'leads.delete',      // Delete leads
    export: 'leads.export'       // Export leads data
  },
  team: {
    view: 'team.view',            // View team members list
    invite: 'team.invite',       // Invite new team members
    edit: 'team.edit',           // Edit team member information
    remove: 'team.remove',       // Remove team members
    manage_roles: 'team.manage_roles',     // Manage roles (create/edit/delete roles)
    assign_roles: 'team.assign_roles',     // Assign roles to team members
    manage_permissions: 'team.manage_permissions' // Manage custom permissions
  },
  analytics: {
    view: 'analytics.view',       // Access analytics section
    view_overview: 'analytics.view_overview',     // View analytics overview
    view_properties: 'analytics.view_properties', // View properties analytics
    view_leads: 'analytics.view_leads',           // View leads analytics
    view_profile_brand: 'analytics.view_profile_brand', // View profile & brand analytics
    view_appointments: 'analytics.view_appointments',   // View appointments analytics
    view_messages: 'analytics.view_messages',          // View messages analytics
    view_market: 'analytics.view_market',             // View market intelligence
    export: 'analytics.export',   // Export analytics data
    configure: 'analytics.configure' // Configure analytics settings
  },
  sales: {
    view: 'sales.view'            // View sales page and analytics
  },
  profile: {
    view: 'profile.view',         // View profile information
    edit: 'profile.edit',        // Edit profile information
    manage_branding: 'profile.manage_branding', // Manage branding (logo, colors, etc.)
    manage_settings: 'profile.manage_settings',  // Manage profile settings
    manage_locations: 'profile.manage_locations' // Manage company locations
  },
  subscriptions: {
    view: 'subscriptions.view',   // View subscription details
    upgrade: 'subscriptions.upgrade',   // Upgrade subscription plan
    downgrade: 'subscriptions.downgrade', // Downgrade subscription plan
    cancel: 'subscriptions.cancel',     // Cancel subscription
    manage: 'subscriptions.manage'      // Full subscription management
  },
  media: {
    upload: 'media.upload',       // Upload media files
    delete: 'media.delete',       // Delete media files
    manage: 'media.manage'        // Full media management
  },
  favorites: {
    view: 'favorites.view',       // View favorites
    add: 'favorites.add',        // Add to favorites
    remove: 'favorites.remove'  // Remove from favorites
  }
}

// Permission definitions for Agencies
const agencyPermissions = {
  dashboard: {
    view: 'dashboard.view',
    export: 'dashboard.export'
  },
  messages: {
    view: 'messages.view',
    send: 'messages.send'
  },
  listings: {
    view: 'listings.view',
    create: 'listings.create',
    edit: 'listings.edit',      // Includes changing listing_status, status, is_featured
    delete: 'listings.delete',
    view_analytics: 'listings.view_analytics',
    view_leads: 'listings.view_leads'
  },
  appointments: {
    view: 'appointments.view',
    create: 'appointments.create',
    edit: 'appointments.edit',   // Includes updating status
    delete: 'appointments.delete'
  },
  leads: {
    view: 'leads.view',
    view_all: 'leads.view_all',
    edit: 'leads.edit',
    update_status: 'leads.update_status',
    add_notes: 'leads.add_notes',
    assign: 'leads.assign',
    delete: 'leads.delete',
    export: 'leads.export'
  },
  team: {
    view: 'team.view',
    invite: 'team.invite',
    edit: 'team.edit',
    remove: 'team.remove',
    manage_roles: 'team.manage_roles',
    assign_roles: 'team.assign_roles',
    manage_permissions: 'team.manage_permissions'
  },
  agents: {
    view: 'agents.view',
    add: 'agents.add',
    edit: 'agents.edit',
    remove: 'agents.remove',
    assign: 'agents.assign',
    manage_commission: 'agents.manage_commission'
  },
  analytics: {
    view: 'analytics.view',
    view_overview: 'analytics.view_overview',
    view_properties: 'analytics.view_properties',
    view_leads: 'analytics.view_leads',
    view_profile_brand: 'analytics.view_profile_brand',
    view_appointments: 'analytics.view_appointments',
    view_messages: 'analytics.view_messages',
    view_agents: 'analytics.view_agents',
    export: 'analytics.export',
    configure: 'analytics.configure'
  },
  sales: {
    view: 'sales.view'            // View sales page and analytics
  },
  profile: {
    view: 'profile.view',
    edit: 'profile.edit',
    manage_branding: 'profile.manage_branding',
    manage_settings: 'profile.manage_settings',
    manage_locations: 'profile.manage_locations'
  },
  subscriptions: {
    view: 'subscriptions.view',
    upgrade: 'subscriptions.upgrade',
    downgrade: 'subscriptions.downgrade',
    cancel: 'subscriptions.cancel',
    manage: 'subscriptions.manage'
  },
  media: {
    upload: 'media.upload',
    delete: 'media.delete',
    manage: 'media.manage'
  },
  reviews: {
    view: 'reviews.view',
    respond: 'reviews.respond',
    delete: 'reviews.delete'
  }
}

// Default roles for Developers
const developerDefaultRoles = {
  owner: {
    name: 'Super Admin',
    description: 'Full access to all features and settings. Cannot be removed or modified.',
    isSystemRole: true,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      developments: { view: true, create: true, edit: true, delete: true },
      units: { view: true, create: true, edit: true, delete: true, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: true, export: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: true, export: true, configure: true },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true },
      subscriptions: { view: true, upgrade: true, downgrade: true, cancel: true, manage: true },
      media: { upload: true, delete: true, manage: true },
      favorites: { view: true, add: true, remove: true }
    }
  },
  admin: {
    name: 'Admin',
    description: 'Full administrative access except subscription management and team Super Admin removal.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      developments: { view: true, create: true, edit: true, delete: true },
      units: { view: true, create: true, edit: true, delete: true, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: true, export: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: true, export: true, configure: true },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      favorites: { view: true, add: true, remove: true }
    }
  },
  manager: {
    name: 'Manager',
    description: 'Can manage properties, leads, and appointments. Limited team and settings access.',
    isSystemRole: false,
    isDefault: true,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      developments: { view: true, create: true, edit: true, delete: false },
      units: { view: true, create: true, edit: true, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: false, export: true },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: false, export: false, configure: false },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      favorites: { view: true, add: true, remove: true }
    }
  },
  editor: {
    name: 'Editor',
    description: 'Can create and edit properties and developments. Cannot delete or manage team.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: true },
      developments: { view: true, create: true, edit: true, delete: false },
      units: { view: true, create: true, edit: true, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: false },
      leads: { view: true, view_all: false, edit: true, update_status: true, add_notes: true, assign: false, delete: false, export: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: false, view_appointments: false, view_messages: false, view_market: false, export: false, configure: false },
      sales: { view: false },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: false, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: false },
      favorites: { view: true, add: true, remove: true }
    }
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view properties, developments, and analytics.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: false },
      developments: { view: true, create: false, edit: false, delete: false },
      units: { view: true, create: false, edit: false, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: false, edit: false, delete: false },
      leads: { view: true, view_all: false, edit: false, update_status: false, add_notes: false, assign: false, delete: false, export: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: false, view_appointments: false, view_messages: false, view_market: false, export: false, configure: false },
      sales: { view: false },
      profile: { view: true, edit: false, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: false, delete: false, manage: false },
      favorites: { view: true, add: false, remove: false }
    }
  }
}

// Default roles for Agencies
const agencyDefaultRoles = {
  owner: {
    name: 'Super Admin',
    description: 'Full access to all agency features and settings. Cannot be removed or modified.',
    isSystemRole: true,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      listings: { view: true, create: true, edit: true, delete: true, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: true, export: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true },
      agents: { view: true, add: true, edit: true, remove: true, assign: true, manage_commission: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_agents: true, export: true, configure: true },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true },
      subscriptions: { view: true, upgrade: true, downgrade: true, cancel: true, manage: true },
      media: { upload: true, delete: true, manage: true },
      reviews: { view: true, respond: true, delete: true }
    }
  },
  admin: {
    name: 'Admin',
    description: 'Full administrative access except subscription management and team Super Admin removal.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      listings: { view: true, create: true, edit: true, delete: true, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: true, export: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true },
      agents: { view: true, add: true, edit: true, remove: true, assign: true, manage_commission: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_agents: true, export: true, configure: true },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      reviews: { view: true, respond: true, delete: true }
    }
  },
  agentManager: {
    name: 'Agent Manager',
    description: 'Can manage agents, listings, and leads. Limited access to settings and subscriptions.',
    isSystemRole: false,
    isDefault: true,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true },
      listings: { view: true, create: true, edit: true, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: true },
      leads: { view: true, view_all: true, edit: true, update_status: true, add_notes: true, assign: true, delete: false, export: true },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      agents: { view: true, add: true, edit: true, remove: false, assign: true, manage_commission: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: false, view_appointments: true, view_messages: true, view_agents: true, export: false, configure: false },
      sales: { view: true },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      reviews: { view: true, respond: true, delete: false }
    }
  },
  editor: {
    name: 'Editor',
    description: 'Can create and edit listings. Cannot delete or manage team.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: true },
      listings: { view: true, create: true, edit: true, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: true, edit: true, delete: false },
      leads: { view: true, view_all: false, edit: true, update_status: true, add_notes: true, assign: false, delete: false, export: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      agents: { view: true, add: false, edit: false, remove: false, assign: false, manage_commission: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: false, view_appointments: false, view_messages: false, view_agents: false, export: false, configure: false },
      sales: { view: false },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: false, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: false },
      reviews: { view: true, respond: false, delete: false }
    }
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view listings, leads, and analytics.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: false },
      listings: { view: true, create: false, edit: false, delete: false, view_analytics: true, view_leads: true },
      appointments: { view: true, create: false, edit: false, delete: false },
      leads: { view: true, view_all: false, edit: false, update_status: false, add_notes: false, assign: false, delete: false, export: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false },
      agents: { view: true, add: false, edit: false, remove: false, assign: false, manage_commission: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_profile_brand: false, view_appointments: false, view_messages: false, view_agents: false, export: false, configure: false },
      sales: { view: false },
      profile: { view: true, edit: false, manage_branding: false, manage_settings: false, manage_locations: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: false, delete: false, manage: false },
      reviews: { view: true, respond: false, delete: false }
    }
  }
}

/**
 * Get permissions structure for organization type
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {Object} Permissions structure
 */
export const getPermissions = (organizationType) => {
  return organizationType === 'agency' ? agencyPermissions : developerPermissions
}

/**
 * Get default roles for organization type
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {Object} Default roles
 */
export const getDefaultRoles = (organizationType) => {
  return organizationType === 'agency' ? agencyDefaultRoles : developerDefaultRoles
}

/**
 * Get default permissions structure (all false) for organization type
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {Object} Default permissions structure
 */
export const getDefaultPermissionsStructure = (organizationType) => {
  const permissions = getPermissions(organizationType)
  const defaultStructure = {}
  
  Object.keys(permissions).forEach(category => {
    defaultStructure[category] = {}
    Object.keys(permissions[category]).forEach(action => {
      defaultStructure[category][action] = false
    })
  })
  
  return defaultStructure
}

/**
 * Convert permissions from array format to object format
 * @param {Object} permissions - Permissions in array format { category: ['action1', 'action2'] }
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {Object} Permissions in object format { category: { action1: true, action2: true } }
 */
export const convertPermissionsArrayToObject = (permissions, organizationType) => {
  const permissionsStructure = getPermissions(organizationType)
  const converted = {}
  
  Object.keys(permissionsStructure).forEach(category => {
    converted[category] = {}
    Object.keys(permissionsStructure[category]).forEach(action => {
      // Check if this action is in the array format permissions
      if (permissions[category] && Array.isArray(permissions[category])) {
        converted[category][action] = permissions[category].includes(action)
      } else if (permissions[category] && typeof permissions[category] === 'object') {
        // Already in object format
        converted[category][action] = permissions[category][action] || false
      } else {
        converted[category][action] = false
      }
    })
  })
  
  return converted
}

/**
 * Convert permissions from object format to array format
 * @param {Object} permissions - Permissions in object format { category: { action1: true, action2: false } }
 * @returns {Object} Permissions in array format { category: ['action1'] }
 */
export const convertPermissionsObjectToArray = (permissions) => {
  const converted = {}
  
  Object.keys(permissions).forEach(category => {
    if (typeof permissions[category] === 'object' && !Array.isArray(permissions[category])) {
      converted[category] = Object.keys(permissions[category])
        .filter(action => permissions[category][action] === true)
    } else {
      converted[category] = permissions[category] || []
    }
  })
  
  return converted
}

/**
 * Check if user has permission
 * @param {Object} userPermissions - User's permissions object
 * @param {string} permissionKey - Permission key to check (e.g., 'units.create')
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, permissionKey, organizationType) => {
  if (!userPermissions || typeof userPermissions !== 'object') return false
  
  const [category, action] = permissionKey.split('.')
  if (!category || !action) return false
  
  // Handle both array and object formats
  if (Array.isArray(userPermissions[category])) {
    return userPermissions[category].includes(action)
  } else if (typeof userPermissions[category] === 'object') {
    return userPermissions[category][action] === true
  }
  
  return false
}

/**
 * Check if user can access a route
 * Route access requires at least 'view' permission for that category
 * @param {Object} userPermissions - User's permissions object
 * @param {string} routeCategory - Category name (e.g., 'dashboard', 'units')
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {boolean}
 */
export const canAccessRoute = (userPermissions, routeCategory, organizationType) => {
  return hasPermission(userPermissions, `${routeCategory}.view`, organizationType)
}

/**
 * Get all permission keys as flat array
 * @param {string} organizationType - 'developer' or 'agency'
 * @returns {Array} Array of permission keys
 */
export const getAllPermissionKeys = (organizationType) => {
  const permissions = getPermissions(organizationType)
  const allKeys = []
  
  Object.keys(permissions).forEach(category => {
    Object.keys(permissions[category]).forEach(action => {
      allKeys.push(permissions[category][action])
    })
  })
  
  return allKeys
}

// Export all
export default {
  getPermissions,
  getDefaultRoles,
  getDefaultPermissionsStructure,
  convertPermissionsArrayToObject,
  convertPermissionsObjectToArray,
  hasPermission,
  canAccessRoute,
  getAllPermissionKeys,
  developerPermissions,
  agencyPermissions,
  developerDefaultRoles,
  agencyDefaultRoles
}
