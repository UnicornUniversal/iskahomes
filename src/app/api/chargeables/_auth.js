import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getChargeableOwner } from '@/lib/chargeables'

export async function requireChargeableOwner(request) {
  const { userInfo, error, status } = await authenticateRequest(request)
  if (error) return { error, status }

  const owner = getChargeableOwner(userInfo)
  if (!owner) {
    return { error: 'Only developers and agencies can manage chargeables', status: 403 }
  }

  return { userInfo, owner }
}
