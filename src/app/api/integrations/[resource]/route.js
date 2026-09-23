import { handleIntegrationCollection } from '@/lib/integrationHandlers'
import { corsPreflight, withCors } from '@/lib/integrationAuth'

export async function OPTIONS(request) {
  return corsPreflight(request)
}

export async function GET(request, { params }) {
  const { resource } = await params
  return withCors(request, await handleIntegrationCollection(request, resource))
}

export async function POST(request, { params }) {
  const { resource } = await params
  return withCors(request, await handleIntegrationCollection(request, resource))
}
