import AccountStatusGuard from '@/app/components/shared/AccountStatusGuard'

export default function AgentsLayout({ children }) {
  return (
    <AccountStatusGuard entityType="agent">
      {children}
    </AccountStatusGuard>
  )
}
