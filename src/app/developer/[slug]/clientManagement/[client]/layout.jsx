'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'

const SECTION_LINKS = [
  { id: 'info', label: 'Info', segment: 'info' },
  { id: 'units', label: 'Units', segment: 'units' },
  { id: 'transactions', label: 'Transactions', segment: 'transactions' },
  { id: 'serviceCharges', label: 'Service charges', segment: 'service-charges' },
  { id: 'engagement', label: 'Engagement', segment: 'engagement' },
  { id: 'documents', label: 'Documents', segment: 'documents' },
  { id: 'messaging', label: 'Messaging', segment: 'messaging' }
]

export default function ClientSectionsLayout({ children }) {
  const params = useParams()
  const pathname = usePathname()
  const slug = params?.slug || ''
  const clientId = params?.client || ''
  const clientsPath = `/developer/${slug}/clientManagement`
  const clientBasePath = `${clientsPath}/${clientId}`

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href={clientsPath} className="inline-flex items-center gap-2 text-sm text-primary_color/80 hover:text-primary_color">
          <FiArrowLeft className="w-4 h-4" /> Back to clients
        </Link>
      </div>

      <nav className="border-b border-white/40 mb-4">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {SECTION_LINKS.map(section => {
            const href = `${clientBasePath}/${section.segment}`
            const isActive = pathname === href
            return (
              <Link
                key={section.id}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-primary_color text-primary_color' : 'border-transparent text-primary_color/70 hover:text-primary_color'}`}
              >
                {section.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {children}
    </div>
  )
}
