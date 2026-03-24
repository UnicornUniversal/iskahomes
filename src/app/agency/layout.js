import AccountStatusGuard from '@/app/components/shared/AccountStatusGuard'

export default function AgencyLayout({ children }) {
  return (
    <div>
      <AccountStatusGuard entityType="agency">
        {children}
      </AccountStatusGuard>
    </div>
  )
}