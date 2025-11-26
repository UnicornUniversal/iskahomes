import { handleStepUpdate } from '@/lib/listingsStepHandler'

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

// Handle both POST (for new listings) and PUT (for updates)
export async function PUT(request, { params }) {
  return handleStepUpdate(request, params, false)
}

export async function POST(request, { params }) {
  return handleStepUpdate(request, params, true)
}
