import AdminNav from '../components/admin/AdminNav'

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav />
      <main className="flex-1 lg:ml-0">
        {children}
      </main>
    </div>
  )
}
