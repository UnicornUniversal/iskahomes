'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const SELECT_FIELDS = `
  id,
  total_units,
  property_purposes_stats,
  property_types_stats,
  property_subtypes_stats
`

function parseStatsArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function collectCategoryIds(items) {
  return [...new Set(
    items
      .map((item) => item?.category_id)
      .filter((id) => typeof id === 'string' && id.trim())
  )]
}

function enrichStatsWithNames(items, nameMap) {
  return items.map((item) => {
    const existingName = item?.name
    if (typeof existingName === 'string' && existingName.trim()) return item

    const categoryId = item?.category_id
    if (!categoryId) return item

    const mappedName = nameMap.get(categoryId)
    return mappedName ? { ...item, name: mappedName } : item
  })
}

function getDeveloperRecordId(user) {
  if (!user?.profile) return null

  if (user.user_type === 'developer') {
    return user.profile.id || null
  }

  if (
    user.user_type === 'team_member' &&
    user.profile.organization_type === 'developer'
  ) {
    return user.profile.organization_id || null
  }

  return null
}

export default function useDeveloperPropertyStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUnits: 0,
    purposes: [],
    types: [],
    subtypes: []
  })
  const [loading, setLoading] = useState(false)

  const developerRecordId = useMemo(() => getDeveloperRecordId(user), [user])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!developerRecordId) {
        if (!cancelled) {
          setStats({
            totalUnits: 0,
            purposes: [],
            types: [],
            subtypes: []
          })
        }
        return
      }

      setLoading(true)
      try {
        const { data } = await supabase
          .from('developers')
          .select(SELECT_FIELDS)
          .eq('id', developerRecordId)
          .maybeSingle()

        const purposes = parseStatsArray(data?.property_purposes_stats)
        const types = parseStatsArray(data?.property_types_stats)
        const subtypes = parseStatsArray(data?.property_subtypes_stats)

        const purposeIds = collectCategoryIds(purposes)
        const typeIds = collectCategoryIds(types)
        const subtypeIds = collectCategoryIds(subtypes)

        const [purposesMeta, typesMeta, subtypesMeta] = await Promise.all([
          purposeIds.length > 0
            ? supabase.from('property_purposes').select('id, name').in('id', purposeIds)
            : Promise.resolve({ data: [] }),
          typeIds.length > 0
            ? supabase.from('property_types').select('id, name').in('id', typeIds)
            : Promise.resolve({ data: [] }),
          subtypeIds.length > 0
            ? supabase.from('property_subtypes').select('id, name').in('id', subtypeIds)
            : Promise.resolve({ data: [] })
        ])

        const purposeNameMap = new Map((purposesMeta.data || []).map((item) => [item.id, item.name]))
        const typeNameMap = new Map((typesMeta.data || []).map((item) => [item.id, item.name]))
        const subtypeNameMap = new Map((subtypesMeta.data || []).map((item) => [item.id, item.name]))

        if (!cancelled) {
          setStats({
            totalUnits: data?.total_units ?? 0,
            purposes: enrichStatsWithNames(purposes, purposeNameMap),
            types: enrichStatsWithNames(types, typeNameMap),
            subtypes: enrichStatsWithNames(subtypes, subtypeNameMap)
          })
        }
      } catch {
        if (!cancelled) {
          setStats({
            totalUnits: 0,
            purposes: [],
            types: [],
            subtypes: []
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [developerRecordId])

  return { stats, loading }
}

