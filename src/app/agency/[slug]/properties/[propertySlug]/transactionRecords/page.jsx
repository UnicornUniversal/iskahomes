'use client'

import React from 'react'
import TransactionRecords from '@/app/components/transactionsRecords/TransactionRecords'

const TransactionRecordsPage = () => {
  const agencyToken = typeof window !== 'undefined' ? localStorage.getItem('agency_token') : null

  return <TransactionRecords token={agencyToken} />
}

export default TransactionRecordsPage
