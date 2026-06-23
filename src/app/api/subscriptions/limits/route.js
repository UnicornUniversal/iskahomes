import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { getUserFromToken } from '@/lib/apiPermissionMiddleware'
import {
  resolveSubscriptionBillingAccount,
  resolveSubscriptionBillingFromDecoded,
} from '@/lib/subscriptionContext'
import {
  getFullSubscriptionState,
} from '@/lib/subscriptionLimitsServer'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let billing = resolveSubscriptionBillingFromDecoded(decoded)

    if (!billing) {
      const userInfo = await getUserFromToken(token)
      billing = resolveSubscriptionBillingAccount(userInfo)
    }

    if (!billing?.userId || !billing?.dbUserType) {
      return NextResponse.json({ error: 'Unable to resolve subscription account' }, { status: 400 })
    }

    const state = await getFullSubscriptionState(billing.userId, billing.dbUserType)

    return NextResponse.json({
      success: true,
      data: {
        limits: state.limits,
        usage: state.usage,
        hasAddon: state.hasAddon,
        hasClientManagementAddon: state.hasClientManagementAddon,
        hasActiveSubscription: state.hasActiveSubscription,
        packageName: state.packageName,
        userType: billing.dbUserType,
        actorType: billing.actorType || decoded.user_type,
        billingUserId: billing.userId,
        scope: billing.scope,
        agentInheritsAgencyPlan: billing.actorType === 'agent',
      },
    })
  } catch (err) {
    console.error('Subscription limits API error:', err)
    return NextResponse.json({ error: 'Failed to load limits' }, { status: 500 })
  }
}
