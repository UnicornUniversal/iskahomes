'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import { Loader2 } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import UnitCard from '@/app/components/developers/units/UnitCard'

const PAGE_SIZE = 10

const DashboardDevelopmentUnits = ({ developmentId, developerSlug }) => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchUnits = useCallback(async (pageNum = 1, append = false) => {
    if (!developmentId) return

    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setError(null)
      }

      const token = localStorage.getItem('developer_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const params = new URLSearchParams({
        development_id: developmentId,
        listing_type: 'unit',
        limit: String(PAGE_SIZE),
        page: String(pageNum),
      })

      const response = await fetch(`/api/user-listings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch units')
      }

      const fetchedUnits = result.data || []
      const pagination = result.pagination || {}
      const totalPages = pagination.pages || 1

      setUnits((prev) => (append ? [...prev, ...fetchedUnits] : fetchedUnits))
      setPage(pageNum)
      setHasMore(pageNum < totalPages)
    } catch (err) {
      console.error('Error fetching development units:', err)
      if (!append) {
        setError(err.message || 'Failed to fetch units')
        setUnits([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [developmentId])

  useEffect(() => {
    if (!developmentId) {
      setUnits([])
      setLoading(false)
      return
    }

    fetchUnits(1, false)
  }, [developmentId, fetchUnits])

  const handleReachEnd = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchUnits(page + 1, true)
    }
  }, [hasMore, loadingMore, loading, page, fetchUnits])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="mb-2">Development Units</h2>
          <p className="text-sm text-gray-600">
            Units linked to this development. Swipe to browse the full inventory.
          </p>
        </div>
        {developerSlug && (
          <Link
            href={`/developer/${developerSlug}/units/addNewUnit`}
            className="secondary_button whitespace-nowrap self-start sm:self-auto"
          >
            Add Unit
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading units...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      ) : units.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600 mb-2">No units linked to this development yet.</p>
          {developerSlug && (
            <Link
              href={`/developer/${developerSlug}/units/addNewUnit`}
              className="text-sm font-medium text-primary_color hover:underline"
            >
              Create your first unit
            </Link>
          )}
        </div>
      ) : (
        <div className="relative -mx-1 px-1">
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerView="auto"
            navigation
            onReachEnd={handleReachEnd}
            className="development-units-swiper"
            watchOverflow
          >
            {units.map((unit) => (
              <SwiperSlide key={unit.id} style={{ width: '260px' }}>
                <div className="w-[260px] max-w-[260px] shrink-0">
                  <UnitCard unit={unit} developerSlug={developerSlug} />
                </div>
              </SwiperSlide>
            ))}

            {loadingMore && hasMore && (
              <SwiperSlide style={{ width: '72px' }}>
                <div className="flex h-full min-h-[280px] w-[72px] items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary_color" />
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      )}
    </div>
  )
}

export default DashboardDevelopmentUnits
