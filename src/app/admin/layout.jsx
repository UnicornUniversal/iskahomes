import AdminNav from '../components/admin/AdminNav'

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminNav />
      <main className="flex-1 lg:ml-0 bg-white p-4 md:p-8 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}
