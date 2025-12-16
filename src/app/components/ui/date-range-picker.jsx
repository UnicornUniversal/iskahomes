'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onChange, 
  className,
  placeholder = 'Select date range'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate || '')
  const [tempEndDate, setTempEndDate] = useState(endDate || '')
  const pickerRef = useRef(null)

  useEffect(() => {
    setTempStartDate(startDate || '')
    setTempEndDate(endDate || '')
  }, [startDate, endDate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDateRange = () => {
    if (!startDate && !endDate) return placeholder
    if (startDate && !endDate) return formatDate(startDate)
    if (!startDate && endDate) return formatDate(endDate)
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleApply = () => {
    if (onChange) {
      onChange({ startDate: tempStartDate, endDate: tempEndDate })
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStartDate('')
    setTempEndDate('')
    if (onChange) {
      onChange({ startDate: '', endDate: '' })
    }
    setIsOpen(false)
  }

  const handleQuickSelect = (range) => {
    const today = new Date()
    let start, end

    switch (range) {
      case 'today':
        start = end = today.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        start = weekStart.toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'last7days':
        const last7 = new Date(today)
        last7.setDate(today.getDate() - 7)
        start = last7.toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'last30days':
        const last30 = new Date(today)
        last30.setDate(today.getDate() - 30)
        start = last30.toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      default:
        return
    }

    setTempStartDate(start)
    setTempEndDate(end)
    if (onChange) {
      onChange({ startDate: start, endDate: end })
    }
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2 bg-/30 border border-gray-300 rounded-lg',
          'hover:border-primary_color focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color',
          'text-sm font-medium transition-colors'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={cn(
            'truncate',
            (!startDate && !endDate) && 'text-gray-400'
          )}>
            {formatDateRange()}
          </span>
        </div>
        {(startDate || endDate) && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                handleClear()
              }
            }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-[320px]">
          <div className="p-4">
            {/* Quick Select Buttons */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Quick Select</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('today')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('week')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('month')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('year')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  This Year
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('last7days')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('last30days')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-primary_color hover:text-white rounded-md transition-colors"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  max={tempEndDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary_color hover:bg-primary_color/90 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { DateRangePicker }

