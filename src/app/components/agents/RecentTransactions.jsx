'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Clock, AlertCircle, CheckCircle2, DollarSign, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const RecentTransactions = ({ agentId, limit = 5 }) => {
  const { agentToken } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!agentId || !agentToken) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch transactions for this agent
        const response = await fetch(`/api/transaction-records?agent_id=${agentId}&limit=${limit * 2}`, {
          headers: {
            'Authorization': `Bearer ${agentToken}`
          }
        })

        if (!isMounted) return

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const result = await response.json()
        if (result.success) {
          const allTransactions = result.data || []
          
          // Filter and prioritize: overdue, upcoming due dates, upcoming check-ins/check-outs
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)

          const prioritized = allTransactions
            .map(t => {
              let priority = 0
              let relevantDate = null
              let type = 'info'

              // Check for overdue
              if (t.due_date) {
                const dueDate = new Date(t.due_date)
                if (dueDate < today && !t.payment_date) {
                  priority = 1000 - Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) // More overdue = higher priority
                  relevantDate = dueDate
                  type = 'overdue'
                } else if (dueDate >= today && dueDate <= nextWeek) {
                  priority = 500 - Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)) // Closer = higher priority
                  relevantDate = dueDate
                  type = 'upcoming'
                }
              }

              // Check for rent due date
              if (t.rent_due_date) {
                const rentDueDate = new Date(t.rent_due_date)
                if (rentDueDate < today && t.status !== 'completed') {
                  const overduePriority = 1000 - Math.floor((today - rentDueDate) / (1000 * 60 * 60 * 24))
                  if (overduePriority > priority) {
                    priority = overduePriority
                    relevantDate = rentDueDate
                    type = 'overdue'
                  }
                } else if (rentDueDate >= today && rentDueDate <= nextWeek) {
                  const upcomingPriority = 500 - Math.floor((rentDueDate - today) / (1000 * 60 * 60 * 24))
                  if (upcomingPriority > priority) {
                    priority = upcomingPriority
                    relevantDate = rentDueDate
                    type = 'upcoming'
                  }
                }
              }

              // Check for check-in date (rental period start)
              if (t.check_in_date) {
                const checkInDate = new Date(t.check_in_date)
                if (checkInDate >= today && checkInDate <= nextWeek) {
                  const checkInPriority = 400 - Math.floor((checkInDate - today) / (1000 * 60 * 60 * 24))
                  if (checkInPriority > priority) {
                    priority = checkInPriority
                    relevantDate = checkInDate
                    type = 'checkin'
                  }
                }
              }

              // Check for check-out date (rental period end)
              if (t.check_out_date) {
                const checkOutDate = new Date(t.check_out_date)
                if (checkOutDate >= today && checkOutDate <= nextWeek) {
                  const checkOutPriority = 400 - Math.floor((checkOutDate - today) / (1000 * 60 * 60 * 24))
                  if (checkOutPriority > priority) {
                    priority = checkOutPriority
                    relevantDate = checkOutDate
                    type = 'checkout'
                  }
                }
              }

              return {
                ...t,
                priority,
                relevantDate,
                type
              }
            })
            .filter(t => t.priority > 0) // Only show transactions with upcoming/overdue dates
            .sort((a, b) => b.priority - a.priority) // Sort by priority (overdue first, then closest dates)
            .slice(0, limit)

          setTransactions(prioritized)
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTransactions()

    return () => {
      isMounted = false
    }
  }, [agentId, agentToken, limit])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    const diffTime = dateOnly - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    return `In ${diffDays} days`
  }

  const getTypeLabel = (transaction) => {
    if (transaction.transaction_type === 'rental_period') {
      if (transaction.type === 'checkin') return 'Check In'
      if (transaction.type === 'checkout') return 'Check Out'
      return 'Rental Period'
    }
    if (transaction.transaction_type === 'rent_due') return 'Rent Due'
    if (transaction.transaction_type === 'payment') return 'Payment Due'
    return transaction.transaction_type || 'Transaction'
  }

  const getTypeIcon = (transaction) => {
    if (transaction.type === 'overdue') return <AlertCircle className="w-4 h-4" />
    if (transaction.type === 'checkin' || transaction.type === 'checkout') return <Calendar className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const getTypeColor = (transaction) => {
    if (transaction.type === 'overdue') return 'text-red-600 bg-red-50'
    if (transaction.type === 'upcoming') return 'text-yellow-600 bg-yellow-50'
    if (transaction.type === 'checkin') return 'text-blue-600 bg-blue-50'
    if (transaction.type === 'checkout') return 'text-purple-600 bg-purple-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
        Error loading transactions: {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm">No upcoming transactions</p>
        <p className="text-xs mt-1">All caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary_color">Upcoming & Overdue</h3>
        <Link 
          href={`/agents/${agentId}/properties`}
          className="text-sm text-primary_color hover:text-primary_color/80 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className={`p-3 rounded-lg border ${
            transaction.type === 'overdue' 
              ? 'border-red-200 bg-red-50' 
              : transaction.type === 'upcoming'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-gray-200 bg-white'
          } hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(transaction)}`}>
                  {getTypeIcon(transaction)}
                  {getTypeLabel(transaction)}
                </span>
                {transaction.type === 'overdue' && (
                  <span className="text-xs font-medium text-red-600">OVERDUE</span>
                )}
              </div>
              
              <p className="text-sm font-medium text-gray-900 truncate">
                {transaction.customer_name}
              </p>
              
              {transaction.customer_phone && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {transaction.customer_phone}
                </p>
              )}

              {transaction.amount && (
                <p className="text-xs font-medium text-primary_color mt-1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: transaction.currency || 'USD'
                  }).format(transaction.amount)}
                </p>
              )}

              {transaction.listing_id && (
                <div className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Property Transaction
                </div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              {transaction.relevantDate && (
                <div className="text-sm font-semibold text-gray-900">
                  {formatDate(transaction.relevantDate)}
                </div>
              )}
              {transaction.relevantDate && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(transaction.relevantDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentTransactions

