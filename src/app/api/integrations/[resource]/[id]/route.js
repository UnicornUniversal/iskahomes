import { handleIntegrationItem } from '@/lib/integrationHandlers'
import { corsPreflight, withCors } from '@/lib/integrationAuth'

export async function OPTIONS(request) {
  return corsPreflight(request)
}

export async function GET(request, { params }) {
  const { resource, id } = await params
  return withCors(request, await handleIntegrationItem(request, resource, id))
}

export async function PATCH(request, { params }) {
  const { resource, id } = await params
  return withCors(request, await handleIntegrationItem(request, resource, id))
}
