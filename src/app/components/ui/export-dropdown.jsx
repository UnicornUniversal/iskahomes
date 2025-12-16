'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const ExportDropdown = ({ onExport, disabled = false, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExport = (format) => {
    if (onExport) {
      onExport(format)
    }
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'primary_button flex items-center gap-2 px-4 py-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform duration-200',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[180px]">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary_color hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export as CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary_color hover:text-white transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export as Excel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { ExportDropdown }

