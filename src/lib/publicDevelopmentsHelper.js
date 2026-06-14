import { supabase } from '@/lib/supabase'

export const APPROVED_ADMIN_STATUS = 'approved'

export async function getApprovedDeveloperIds() {
  const { data, error } = await supabase
    .from('developers')
    .select('developer_id')
    .eq('admin_status', APPROVED_ADMIN_STATUS)

  if (error) {
    throw error
  }

  return (data || []).map((developer) => developer.developer_id).filter(Boolean)
}

export function applyPublicDevelopmentFilters(query, approvedDeveloperIds = []) {
  let nextQuery = query
    .eq('development_status', 'active')
    .eq('admin_status', APPROVED_ADMIN_STATUS)

  if (approvedDeveloperIds.length > 0) {
    nextQuery = nextQuery.in('developer_id', approvedDeveloperIds)
  }

  return nextQuery
}
