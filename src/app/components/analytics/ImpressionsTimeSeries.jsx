'use client'

import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ImpressionsTimeSeries = ({ timeSeries, listingId }) => {
  const [impressionsBreakdown, setImpressionsBreakdown] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch impressions breakdown from listing
  useEffect(() => {
    if (!listingId) return

    const fetchListing = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/listings/${listingId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            try {
              const breakdown = typeof result.data.listing_impressions_breakdown === 'string'
                ? JSON.parse(result.data.listing_impressions_breakdown)
                : result.data.listing_impressions_breakdown
              setImpressionsBreakdown(breakdown)
            } catch (e) {
              console.error('Error parsing impressions breakdown:', e)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [listingId])

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Over Time</h3>
        <div className="text-center py-12 text-gray-500">
          No impressions data available
        </div>
      </div>
    )
  }

  const impressionsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalImpressions: item.total_impressions || 0,
    socialMedia: item.impression_social_media || 0,
    websiteVisit: item.impression_website_visit || 0,
    share: item.impression_share || 0,
    savedListing: item.impression_saved_listing || 0
  }))

  const chartData = {
    labels: impressionsData.map(d => d.date),
    datasets: [
      {
        label: 'Total Impressions',
        data: impressionsData.map(d => d.totalImpressions),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Social Media',
        data: impressionsData.map(d => d.socialMedia),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Website Visits',
        data: impressionsData.map(d => d.websiteVisit),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Shares',
        data: impressionsData.map(d => d.share),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Saved Listings',
        data: impressionsData.map(d => d.savedListing),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Over Time</h3>
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Impressions Breakdown from Listing */}
      {impressionsBreakdown && (
        <div className="p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {impressionsBreakdown.share && (
              <div className="p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Shares</p>
                <p className="text-2xl font-bold text-primary_color">
                  {impressionsBreakdown.share.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impressionsBreakdown.share.percentage || 0}%
                </p>
              </div>
            )}
            {impressionsBreakdown.social_media && (
              <div className="p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Social Media</p>
                <p className="text-2xl font-bold text-primary_color">
                  {impressionsBreakdown.social_media.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impressionsBreakdown.social_media.percentage || 0}%
                </p>
              </div>
            )}
            {impressionsBreakdown.saved_listing && (
              <div className="p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Saved Listings</p>
                <p className="text-2xl font-bold text-primary_color">
                  {impressionsBreakdown.saved_listing.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impressionsBreakdown.saved_listing.percentage || 0}%
                </p>
              </div>
            )}
            {impressionsBreakdown.website_visit && (
              <div className="p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Website Visits</p>
                <p className="text-2xl font-bold text-primary_color">
                  {impressionsBreakdown.website_visit.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impressionsBreakdown.website_visit.percentage || 0}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImpressionsTimeSeries

