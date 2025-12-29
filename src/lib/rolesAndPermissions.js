/**
 * Roles and Permissions Configuration
 * Supports both 'developer' and 'agency' organization types
 */

// Permission definitions for Developers
// Each category has a parent permission (e.g., "messages") that grants access to the route/module
// Then sub-permissions for specific actions within that module
const developerPermissions = {
  dashboard: {
    dashboard: 'dashboard.dashboard', // Parent permission - grants access to dashboard route
    view: 'dashboard.view',
    export: 'dashboard.export'
  },
  messages: {
    messages: 'messages.messages', // Parent permission - grants access to messages route
    read: 'messages.read',
    view: 'messages.view',
    send: 'messages.send',
    reply: 'messages.reply',
    delete: 'messages.delete',
    manage: 'messages.manage'
  },
  developments: {
    developments: 'developments.developments', // Parent permission - grants access to developments route
    view: 'developments.view',
    create: 'developments.create',
    edit: 'developments.edit',
    delete: 'developments.delete',
    publish: 'developments.publish',
    unpublish: 'developments.unpublish',
    manage: 'developments.manage'
  },
  units: {
    units: 'units.units', // Parent permission - grants access to units route
    view: 'units.view',
    create: 'units.create',
    edit: 'units.edit',
    delete: 'units.delete',
    publish: 'units.publish',
    unpublish: 'units.unpublish',
    feature: 'units.feature',
    view_analytics: 'units.view_analytics',
    view_leads: 'units.view_leads',
    manage: 'units.manage'
  },
  appointments: {
    appointments: 'appointments.appointments', // Parent permission - grants access to appointments route
    view: 'appointments.view',
    create: 'appointments.create',
    edit: 'appointments.edit',
    delete: 'appointments.delete',
    cancel: 'appointments.cancel',
    manage: 'appointments.manage'
  },
  leads: {
    leads: 'leads.leads', // Parent permission - grants access to leads route
    view: 'leads.view',
    view_all: 'leads.view_all',
    assign: 'leads.assign',
    update: 'leads.update',
    delete: 'leads.delete',
    export: 'leads.export',
    manage: 'leads.manage'
  },
  team: {
    team: 'team.team', // Parent permission - grants access to team route
    view: 'team.view',
    invite: 'team.invite',
    edit: 'team.edit',
    remove: 'team.remove',
    manage_roles: 'team.manage_roles',
    assign_roles: 'team.assign_roles',
    manage_permissions: 'team.manage_permissions',
    manage: 'team.manage'
  },
  analytics: {
    analytics: 'analytics.analytics', // Parent permission - grants access to analytics route
    view: 'analytics.view',
    view_overview: 'analytics.view_overview',
    view_properties: 'analytics.view_properties',
    view_leads: 'analytics.view_leads',
    view_sales: 'analytics.view_sales',
    view_profile_brand: 'analytics.view_profile_brand',
    view_appointments: 'analytics.view_appointments',
    view_messages: 'analytics.view_messages',
    view_market: 'analytics.view_market',
    export: 'analytics.export',
    manage: 'analytics.manage'
  },
  profile: {
    profile: 'profile.profile', // Parent permission - grants access to profile route
    view: 'profile.view',
    edit: 'profile.edit',
    manage_branding: 'profile.manage_branding',
    manage_settings: 'profile.manage_settings',
    manage: 'profile.manage'
  },
  subscriptions: {
    subscriptions: 'subscriptions.subscriptions', // Parent permission - grants access to subscriptions route
    view: 'subscriptions.view',
    upgrade: 'subscriptions.upgrade',
    downgrade: 'subscriptions.downgrade',
    cancel: 'subscriptions.cancel',
    manage: 'subscriptions.manage'
  },
  media: {
    media: 'media.media', // Parent permission - grants access to media route
    upload: 'media.upload',
    delete: 'media.delete',
    manage: 'media.manage'
  },
  financial: {
    financial: 'financial.financial', // Parent permission - grants access to financial route
    view: 'financial.view',
    view_pricing: 'financial.view_pricing',
    edit_pricing: 'financial.edit_pricing',
    view_revenue: 'financial.view_revenue',
    manage: 'financial.manage'
  },
  favorites: {
    favorites: 'favorites.favorites', // Parent permission - grants access to favorites route
    view: 'favorites.view',
    add: 'favorites.add',
    remove: 'favorites.remove',
    manage: 'favorites.manage'
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
    send: 'messages.send',
    reply: 'messages.reply',
    delete: 'messages.delete',
    manage: 'messages.manage'
  },
  listings: {
    view: 'listings.view',
    create: 'listings.create',
    edit: 'listings.edit',
    delete: 'listings.delete',
    publish: 'listings.publish',
    unpublish: 'listings.unpublish',
    feature: 'listings.feature',
    view_analytics: 'listings.view_analytics',
    view_leads: 'listings.view_leads',
    manage: 'listings.manage'
  },
  appointments: {
    view: 'appointments.view',
    create: 'appointments.create',
    edit: 'appointments.edit',
    delete: 'appointments.delete',
    cancel: 'appointments.cancel',
    approve: 'appointments.approve',
    reject: 'appointments.reject',
    manage: 'appointments.manage'
  },
  leads: {
    view: 'leads.view',
    view_all: 'leads.view_all',
    assign: 'leads.assign',
    update: 'leads.update',
    delete: 'leads.delete',
    export: 'leads.export',
    manage: 'leads.manage'
  },
  team: {
    view: 'team.view',
    invite: 'team.invite',
    edit: 'team.edit',
    remove: 'team.remove',
    manage_roles: 'team.manage_roles',
    assign_roles: 'team.assign_roles',
    manage_permissions: 'team.manage_permissions',
    manage: 'team.manage'
  },
  agents: {
    view: 'agents.view',
    add: 'agents.add',
    edit: 'agents.edit',
    remove: 'agents.remove',
    assign: 'agents.assign',
    manage_commission: 'agents.manage_commission',
    manage: 'agents.manage'
  },
  analytics: {
    view: 'analytics.view',
    view_overview: 'analytics.view_overview',
    view_properties: 'analytics.view_properties',
    view_leads: 'analytics.view_leads',
    view_sales: 'analytics.view_sales',
    view_profile_brand: 'analytics.view_profile_brand',
    view_appointments: 'analytics.view_appointments',
    view_messages: 'analytics.view_messages',
    view_agents: 'analytics.view_agents',
    export: 'analytics.export',
    manage: 'analytics.manage'
  },
  profile: {
    view: 'profile.view',
    edit: 'profile.edit',
    manage_branding: 'profile.manage_branding',
    manage_settings: 'profile.manage_settings',
    manage_locations: 'profile.manage_locations',
    manage: 'profile.manage'
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
  financial: {
    view: 'financial.view',
    view_pricing: 'financial.view_pricing',
    edit_pricing: 'financial.edit_pricing',
    view_revenue: 'financial.view_revenue',
    view_commission: 'financial.view_commission',
    manage_commission: 'financial.manage_commission',
    manage: 'financial.manage'
  },
  reviews: {
    view: 'reviews.view',
    respond: 'reviews.respond',
    delete: 'reviews.delete',
    manage: 'reviews.manage'
  }
}

// Default roles for Developers
const developerDefaultRoles = {
  owner: {
    name: 'Owner',
    description: 'Full access to all features and settings. Cannot be removed or modified.',
    isSystemRole: true,
    isDefault: false,
    permissions: {
      dashboard: { dashboard: true, view: true, export: true },
      messages: { messages: true, read: true, view: true, send: true, reply: true, delete: true, manage: true },
      developments: { developments: true, view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, manage: true },
      units: { units: true, view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: true },
      appointments: { appointments: true, view: true, create: true, edit: true, delete: true, cancel: true, manage: true },
      leads: { leads: true, view: true, view_all: true, assign: true, update: true, delete: true, export: true, manage: true },
      team: { team: true, view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true, manage: true },
      analytics: { analytics: true, view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: true, export: true, manage: true },
      profile: { profile: true, view: true, edit: true, manage_branding: true, manage_settings: true, manage: true },
      subscriptions: { subscriptions: true, view: true, upgrade: true, downgrade: true, cancel: true, manage: true },
      media: { media: true, upload: true, delete: true, manage: true },
      financial: { financial: true, view: true, view_pricing: true, edit_pricing: true, view_revenue: true, manage: true },
      favorites: { favorites: true, view: true, add: true, remove: true, manage: true }
    }
  },
  admin: {
    name: 'Admin',
    description: 'Full administrative access except subscription management and team owner removal.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true, reply: true, delete: true, manage: true },
      developments: { view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, manage: true },
      units: { view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: true },
      appointments: { view: true, create: true, edit: true, delete: true, cancel: true, manage: true },
      leads: { view: true, view_all: true, assign: true, update: true, delete: true, export: true, manage: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true, manage: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: true, export: true, manage: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage: true },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      financial: { view: true, view_pricing: true, edit_pricing: true, view_revenue: true, manage: true },
      agents: { view: true, add: true, edit: true, remove: true, assign: true, manage: true },
      favorites: { view: true, add: true, remove: true, manage: true }
    }
  },
  manager: {
    name: 'Manager',
    description: 'Can manage properties, leads, and appointments. Limited team and settings access.',
    isSystemRole: false,
    isDefault: true,
    permissions: {
      dashboard: { dashboard: true, view: true, export: true },
      messages: { messages: true, read: true, view: true, send: true, reply: true, delete: false, manage: true },
      developments: { developments: true, view: true, create: true, edit: true, delete: false, publish: true, unpublish: true, manage: false },
      units: { units: true, view: true, create: true, edit: true, delete: false, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: false },
      appointments: { appointments: true, view: true, create: true, edit: true, delete: true, cancel: true, manage: true },
      leads: { leads: true, view: true, view_all: true, assign: true, update: true, delete: false, export: true, manage: false },
      team: { team: true, view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      analytics: { analytics: true, view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_market: false, export: false, manage: false },
      profile: { profile: true, view: true, edit: true, manage_branding: false, manage_settings: false, manage: false },
      subscriptions: { subscriptions: true, view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { media: true, upload: true, delete: true, manage: true },
      financial: { financial: true, view: true, view_pricing: true, edit_pricing: true, view_revenue: true, manage: false },
      favorites: { favorites: true, view: true, add: true, remove: true, manage: false }
    }
  },
  editor: {
    name: 'Editor',
    description: 'Can create and edit properties and developments. Cannot delete or manage team.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { dashboard: true, view: true, export: false },
      messages: { messages: true, read: true, view: true, send: true, reply: true, delete: false, manage: false },
      developments: { developments: true, view: true, create: true, edit: true, delete: false, publish: true, unpublish: false, manage: false },
      units: { units: true, view: true, create: true, edit: true, delete: false, publish: true, unpublish: false, feature: false, view_analytics: true, view_leads: true, manage: false },
      appointments: { appointments: true, view: true, create: true, edit: true, delete: false, cancel: false, manage: false },
      leads: { leads: true, view: true, view_all: false, assign: false, update: true, delete: false, export: false, manage: false },
      team: { team: true, view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      analytics: { analytics: true, view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: false, view_profile_brand: false, view_appointments: false, view_messages: false, view_market: false, export: false, manage: false },
      profile: { profile: true, view: true, edit: true, manage_branding: false, manage_settings: false, manage: false },
      subscriptions: { subscriptions: false, view: false, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { media: true, upload: true, delete: true, manage: false },
      financial: { financial: true, view: true, view_pricing: true, edit_pricing: true, view_revenue: false, manage: false },
      favorites: { favorites: true, view: true, add: true, remove: true, manage: false }
    }
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view properties, developments, and analytics.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { dashboard: true, view: true, export: false },
      messages: { messages: true, read: true, view: true, send: false, reply: false, delete: false, manage: false },
      developments: { developments: true, view: true, create: false, edit: false, delete: false, publish: false, unpublish: false, manage: false },
      units: { units: true, view: true, create: false, edit: false, delete: false, publish: false, unpublish: false, feature: false, view_analytics: true, view_leads: true, manage: false },
      appointments: { appointments: true, view: true, create: false, edit: false, delete: false, cancel: false, manage: false },
      leads: { leads: true, view: true, view_all: false, assign: false, update: false, delete: false, export: false, manage: false },
      team: { team: true, view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      analytics: { analytics: true, view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: false, view_profile_brand: false, view_appointments: false, view_messages: false, view_market: false, export: false, manage: false },
      profile: { profile: true, view: true, edit: false, manage_branding: false, manage_settings: false, manage: false },
      subscriptions: { subscriptions: true, view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { media: false, upload: false, delete: false, manage: false },
      financial: { financial: true, view: true, view_pricing: false, edit_pricing: false, view_revenue: false, manage: false },
      favorites: { favorites: true, view: true, add: false, remove: false, manage: false }
    }
  }
}

// Default roles for Agencies
const agencyDefaultRoles = {
  owner: {
    name: 'Owner',
    description: 'Full access to all agency features and settings. Cannot be removed or modified.',
    isSystemRole: true,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true, reply: true, delete: true, manage: true },
      listings: { view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: true },
      appointments: { view: true, create: true, edit: true, delete: true, cancel: true, approve: true, reject: true, manage: true },
      leads: { view: true, view_all: true, assign: true, update: true, delete: true, export: true, manage: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true, manage: true },
      agents: { view: true, add: true, edit: true, remove: true, assign: true, manage_commission: true, manage: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_agents: true, export: true, manage: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true, manage: true },
      subscriptions: { view: true, upgrade: true, downgrade: true, cancel: true, manage: true },
      media: { upload: true, delete: true, manage: true },
      financial: { view: true, view_pricing: true, edit_pricing: true, view_revenue: true, view_commission: true, manage_commission: true, manage: true },
      reviews: { view: true, respond: true, delete: true, manage: true }
    }
  },
  admin: {
    name: 'Admin',
    description: 'Full administrative access except subscription management and team owner removal.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true, reply: true, delete: true, manage: true },
      listings: { view: true, create: true, edit: true, delete: true, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: true },
      appointments: { view: true, create: true, edit: true, delete: true, cancel: true, approve: true, reject: true, manage: true },
      leads: { view: true, view_all: true, assign: true, update: true, delete: true, export: true, manage: true },
      team: { view: true, invite: true, edit: true, remove: true, manage_roles: true, assign_roles: true, manage_permissions: true, manage: false },
      agents: { view: true, add: true, edit: true, remove: true, assign: true, manage_commission: true, manage: true },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: true, view_appointments: true, view_messages: true, view_agents: true, export: true, manage: true },
      profile: { view: true, edit: true, manage_branding: true, manage_settings: true, manage_locations: true, manage: true },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      financial: { view: true, view_pricing: true, edit_pricing: true, view_revenue: true, view_commission: true, manage_commission: true, manage: true },
      reviews: { view: true, respond: true, delete: true, manage: true }
    }
  },
  agentManager: {
    name: 'Agent Manager',
    description: 'Can manage agents, listings, and leads. Limited access to settings and subscriptions.',
    isSystemRole: false,
    isDefault: true,
    permissions: {
      dashboard: { view: true, export: true },
      messages: { view: true, send: true, reply: true, delete: false, manage: true },
      listings: { view: true, create: true, edit: true, delete: false, publish: true, unpublish: true, feature: true, view_analytics: true, view_leads: true, manage: false },
      appointments: { view: true, create: true, edit: true, delete: true, cancel: true, approve: true, reject: true, manage: true },
      leads: { view: true, view_all: true, assign: true, update: true, delete: false, export: true, manage: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      agents: { view: true, add: true, edit: true, remove: false, assign: true, manage_commission: false, manage: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: true, view_profile_brand: false, view_appointments: true, view_messages: true, view_agents: true, export: false, manage: false },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false, manage: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: true },
      financial: { view: true, view_pricing: true, edit_pricing: true, view_revenue: true, view_commission: true, manage_commission: false, manage: false },
      reviews: { view: true, respond: true, delete: false, manage: false }
    }
  },
  editor: {
    name: 'Editor',
    description: 'Can create and edit listings. Cannot delete or manage team.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: true, reply: true, delete: false, manage: false },
      listings: { view: true, create: true, edit: true, delete: false, publish: true, unpublish: false, feature: false, view_analytics: true, view_leads: true, manage: false },
      appointments: { view: true, create: true, edit: true, delete: false, cancel: false, approve: false, reject: false, manage: false },
      leads: { view: true, view_all: false, assign: false, update: true, delete: false, export: false, manage: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      agents: { view: true, add: false, edit: false, remove: false, assign: false, manage_commission: false, manage: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: false, view_profile_brand: false, view_appointments: false, view_messages: false, view_agents: false, export: false, manage: false },
      profile: { view: true, edit: true, manage_branding: false, manage_settings: false, manage_locations: false, manage: false },
      subscriptions: { view: false, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: true, delete: true, manage: false },
      financial: { view: true, view_pricing: true, edit_pricing: true, view_revenue: false, view_commission: false, manage_commission: false, manage: false },
      reviews: { view: true, respond: false, delete: false, manage: false }
    }
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view listings, leads, and analytics.',
    isSystemRole: false,
    isDefault: false,
    permissions: {
      dashboard: { view: true, export: false },
      messages: { view: true, send: false, reply: false, delete: false, manage: false },
      listings: { view: true, create: false, edit: false, delete: false, publish: false, unpublish: false, feature: false, view_analytics: true, view_leads: true, manage: false },
      appointments: { view: true, create: false, edit: false, delete: false, cancel: false, approve: false, reject: false, manage: false },
      leads: { view: true, view_all: false, assign: false, update: false, delete: false, export: false, manage: false },
      team: { view: true, invite: false, edit: false, remove: false, manage_roles: false, assign_roles: false, manage_permissions: false, manage: false },
      agents: { view: true, add: false, edit: false, remove: false, assign: false, manage_commission: false, manage: false },
      analytics: { view: true, view_overview: true, view_properties: true, view_leads: true, view_sales: false, view_profile_brand: false, view_appointments: false, view_messages: false, view_agents: false, export: false, manage: false },
      profile: { view: true, edit: false, manage_branding: false, manage_settings: false, manage_locations: false, manage: false },
      subscriptions: { view: true, upgrade: false, downgrade: false, cancel: false, manage: false },
      media: { upload: false, delete: false, manage: false },
      financial: { view: true, view_pricing: false, edit_pricing: false, view_revenue: false, view_commission: false, manage_commission: false, manage: false },
      reviews: { view: true, respond: false, delete: false, manage: false }
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
  getAllPermissionKeys,
  developerPermissions,
  agencyPermissions,
  developerDefaultRoles,
  agencyDefaultRoles
}

