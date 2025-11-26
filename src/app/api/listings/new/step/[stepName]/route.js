// This route handles new listing steps
// It calls the main step handler with id='new'
import { handleStepUpdate } from '@/lib/listingsStepHandler'

export async function PUT(request, { params }) {
  const { stepName } = await params
  return handleStepUpdate(request, Promise.resolve({ id: 'new', stepName }), true)
}

export async function POST(request, { params }) {
  const { stepName } = await params
  return handleStepUpdate(request, Promise.resolve({ id: 'new', stepName }), true)
}

