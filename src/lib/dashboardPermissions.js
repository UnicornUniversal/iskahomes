/**
 * Developer dashboard — one permission category per content block.
 * Uses the same {category}.view checks as route/nav access (canAccessRoute).
 */

import { userCanAccessRoute } from '@/lib/permissionHelpers'

export function getDeveloperDashboardPermissions(user) {
  return {
    units: userCanAccessRoute(user, 'units'),
    developments: userCanAccessRoute(user, 'developments'),
    analytics: userCanAccessRoute(user, 'analytics'),
    sales: userCanAccessRoute(user, 'sales'),
    leads: userCanAccessRoute(user, 'leads'),
    messages: userCanAccessRoute(user, 'messages'),
    appointments: userCanAccessRoute(user, 'appointments'),
    clients: userCanAccessRoute(user, 'clients'),
    auditTrail: userCanAccessRoute(user, 'audit_trail'),
  }
}
