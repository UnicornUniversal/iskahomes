export const CLIENT_STATUSES = ['Lead', 'Qualified', 'Active', 'Inactive']
export const CLIENT_SOURCE_CHANNELS = ['Website', 'Iskahomes', 'Inhouse', 'Social media', 'Referral', 'Walk-in', 'Other']
export const CLIENT_TYPES = ['Individual', 'Company', 'Developer', 'Investor']

export const ASSIGNMENT_ROLES = ['Executive Manager', 'Sales Manager', 'Support', 'Agent', 'Coordinator', 'Other']

export const dummyUsersForSource = [
  { id: 'usr-1', name: 'John Manager' },
  { id: 'usr-2', name: 'Sarah Sales' },
  { id: 'usr-3', name: 'Michael Agent' }
]

export const dummyUsersForAssignment = [
  { id: 'usr-1', name: 'John Manager' },
  { id: 'usr-2', name: 'Sarah Sales' },
  { id: 'usr-3', name: 'Michael Agent' },
  { id: 'usr-4', name: 'Emma Support' },
  { id: 'usr-5', name: 'David Admin' }
]

export const dummyUnitsForPurchase = [
  { id: 'unit-1', name: 'Unit 101 - Block A' },
  { id: 'unit-2', name: 'Unit 102 - Block A' },
  { id: 'unit-3', name: 'Unit 201 - Block B' },
  { id: 'unit-4', name: 'Penthouse - Tower 1' }
]

const getDefaultPermissions = () => ({
  info: { name: 'none', address: 'none', emails: 'none', phone: 'none', clientType: 'none', totalUnitsSold: 'none', firstContactDate: 'none', secondContactDate: 'none', sourceUser: 'none', notes: 'none' },
  units: 'none',
  documents: { create: false, read: false, update: false, delete: false },
  serviceCharges: { create: false, read: false, update: false, delete: false, export: false },
  transactions: { create: false, read: false, update: false, delete: false, export: false },
  userAssignment: { create: false, read: false, update: false, delete: false },
  engagement: { create: false, read: false, update: false, delete: false },
  messaging: { create: false, read: false, update: false, delete: false }
})

export const dummyClients = [
  {
    id: 'client-1',
    name: 'Ama Asante',
    clientCode: 'CL-001',
    clientType: 'Individual',
    status: 'Active',
    sourceChannel: 'Website',
    sourceUserId: 'usr-1',
    emails: ['ama@example.com'],
    phones: ['+233 24 123 4567'],
    address: {
      country: 'Ghana',
      countryCode: 'GH',
      state: 'Greater Accra',
      city: 'Accra',
      town: 'East Legon',
      fullAddress: '123 Main Street, East Legon, Accra',
      coordinates: { latitude: '5.6037', longitude: '-0.1870' }
    },
    firstContactDate: '2024-01-15',
    convertedDate: '2024-02-01',
    notes: 'Interested in 2-bedroom units.',
    tags: 'VIP, Investor',
    assignedUserIds: ['usr-1'],
    assignedUsers: [
      { id: 'usr-1', name: 'John Manager', role: 'Support', permissions: getDefaultPermissions() }
    ],
    units: [
      { id: 'unit-1', name: 'Unit 101 - Block A', development: 'Sunshine Estates' }
    ],
    totalIncomeUsd: 45000,
    purchaseTransactions: [
      { id: 'tx-1', unitId: 'unit-1', unitName: 'Unit 101 - Block A', amount: 45000, transactionDate: '2024-02-15', transactionType: 'Full payment', paymentMethod: 'Bank transfer', reference: 'TXN-001', status: 'Completed' }
    ],
    serviceCharges: [
      { id: 'sc-1', unitId: 'unit-1', unitName: 'Unit 101 - Block A', amount: 500, periodStart: '2024-03-01', periodEnd: '2024-03-31', dueDate: '2024-03-15', status: 'Paid', paidAt: '2024-03-10' }
    ],
    engagementLog: [
      { id: 'eng-1', heading: 'Initial call', note: 'Discussed requirements', dateTime: '2024-01-15T10:00:00', isReminder: false, status: 'Completed' }
    ],
    documents: [
      { fileName: 'Contract.pdf', fileUrl: '#' }
    ],
    messagingChain: []
  },
  {
    id: 'client-2',
    name: 'Kofi Mensah Ltd',
    clientCode: 'CL-002',
    clientType: 'Company',
    status: 'Qualified',
    sourceChannel: 'Referral',
    sourceUserId: 'usr-2',
    emails: ['kofi@mensah.com'],
    phones: ['+233 20 987 6543'],
    address: {
      country: 'Ghana',
      countryCode: 'GH',
      state: 'Ashanti',
      city: 'Kumasi',
      town: 'Ahodwo',
      fullAddress: '45 Business Avenue, Ahodwo, Kumasi'
    },
    firstContactDate: '2024-03-01',
    convertedDate: null,
    notes: '',
    tags: '',
    assignedUserIds: [],
    assignedUsers: [],
    units: [],
    totalIncomeUsd: 0,
    purchaseTransactions: [],
    serviceCharges: [],
    engagementLog: [],
    documents: [],
    messagingChain: []
  }
]
