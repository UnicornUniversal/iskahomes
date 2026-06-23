import AccountStatusGuard from '@/app/components/shared/AccountStatusGuard'
import SubscriptionGuard from '@/app/components/shared/SubscriptionGuard'

export default function AgentsLayout({ children }) {
  return (
    <AccountStatusGuard entityType="agent">
      <SubscriptionGuard entityType="agent">
        {children}
      </SubscriptionGuard>
    </AccountStatusGuard>
  )
}
