'use client'

import React, { useMemo, useState } from 'react'
import { FileText, Download, CalendarDays, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const REPORT_SECTIONS = [
  { id: 'leads', label: 'Leads' },
  { id: 'clients', label: 'Clients' },
  { id: 'sales', label: 'Sales' },
  { id: 'service_charges', label: 'Service Charges' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'engagements', label: 'Engagements' },
  { id: 'team', label: 'Employees / Team' }
]

const EXPORT_OPTIONS = [
  { id: 'pdf', label: 'PDF (Styled report)' },
  { id: 'csv', label: 'CSV' },
  { id: 'json', label: 'JSON' }
]

const getDefaultRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toInput = (value) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return { from: toInput(start), to: toInput(end) }
}

const ReportGenerator = () => {
  const { developerToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const defaults = useMemo(() => getDefaultRange(), [])
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo, setDateTo] = useState(defaults.to)
  const [format, setFormat] = useState('pdf')
  const [selectedSections, setSelectedSections] = useState(['leads', 'sales', 'service_charges'])

  const token = developerToken || (typeof window !== 'undefined' ? localStorage.getItem('developer_token') : '')

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) return prev.filter((item) => item !== sectionId)
      return [...prev, sectionId]
    })
  }

  const closeModal = () => {
    if (submitting) return
    setOpen(false)
    setError('')
    setSuccess('')
    setProgress(0)
    setProgressLabel('')
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Authentication required. Please sign in again.')
      return
    }
    if (!selectedSections.length) {
      setError('Please select at least one report section.')
      return
    }
    if (!dateFrom || !dateTo) {
      setError('Please select a valid date range.')
      return
    }
    if (dateFrom > dateTo) {
      setError('Start date cannot be later than end date.')
      return
    }

    setSubmitting(true)
    setProgress(8)
    setProgressLabel('Preparing report request...')

    let progressInterval = null
    try {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + 7
        })
      }, 350)

      const response = await fetch('/api/developers/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sections: selectedSections,
          date_from: dateFrom,
          date_to: dateTo,
          format
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error || 'Failed to generate report')
      }

      setProgressLabel('Finalizing report file...')
      setProgress(94)
      const blob = await response.blob()
      const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'json'
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `developer-report-${dateFrom}-to-${dateTo}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      setProgress(100)
      setProgressLabel('Download started.')
      setSuccess('Report generated and downloaded successfully.')
    } catch (err) {
      setError(err.message || 'Failed to generate report')
      setProgress(0)
      setProgressLabel('')
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="secondary_bg rounded-2xl shadow-sm p-4 border border-gray-200/70 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary_color">Monthly Report</p>
          <p className="text-xs text-primary_color/70 mt-1">
            Generate a branded report with selected sections, date range and export format.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-primary_color text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-primary_color">Report Generator</h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-primary_color mb-3">
                  Choose report sections
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REPORT_SECTIONS.map((section) => {
                    const checked = selectedSections.includes(section.id)
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          checked
                            ? 'border-primary_color bg-primary_color/5'
                            : 'border-gray-200 hover:border-primary_color/40'
                        }`}
                      >
                        <span className="text-sm font-medium text-primary_color flex items-center justify-between">
                          {section.label}
                          {checked ? <CheckCircle2 className="w-4 h-4 text-primary_color" /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary_color mb-2">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    Date from
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary_color/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary_color mb-2">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    Date to
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary_color/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary_color mb-2">
                  Export format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary_color/30"
                >
                  {EXPORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {submitting ? (
                <div className="space-y-2">
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary_color transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-primary_color/80">
                    {progressLabel || 'Generating report...'} ({Math.round(progress)}%)
                  </p>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-green-600">{success}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-primary_color text-white inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-70"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {submitting ? 'Generating...' : 'Generate & Download'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportGenerator
