import AccountStatusGuard from '@/app/components/shared/AccountStatusGuard'
import SubscriptionGuard from '@/app/components/shared/SubscriptionGuard'

export default function AgencyLayout({ children }) {
  return (
    <div>
      <AccountStatusGuard entityType="agency">
        <SubscriptionGuard entityType="agency">
          {children}
        </SubscriptionGuard>
      </AccountStatusGuard>
    </div>
  )
}