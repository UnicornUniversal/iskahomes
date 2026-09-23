'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ImageOff, MapPin, Search, X } from 'lucide-react'

const PAGE_SIZE = 5

export default function PropertySearchField({
  token,
  value,
  selected,
  onSelect,
  onClear,
  placeholder = 'Search properties or units…',
  attachedOnly = false,
  label
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [active, setActive] = useState(false)
  const wrapRef = useRef(null)
  const listRef = useRef(null)
  const timer = useRef(null)
  const fetchSeq = useRef(0)
  const queryRef = useRef('')
  const hasMoreRef = useRef(false)
  const loadingMoreRef = useRef(false)

  queryRef.current = query
  hasMoreRef.current = hasMore
  loadingMoreRef.current = loadingMore

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setActive(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const fetchPage = useCallback(async ({ q, offset, append }) => {
    if (!token) return
    const seq = ++fetchSeq.current
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset)
      })
      if (q) params.set('q', q)
      if (attachedOnly) params.set('attachedOnly', '1')
      const res = await fetch(`/api/chargeables/property-search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (seq !== fetchSeq.current) return
      const next = result.success ? result.data || [] : []
      setHasMore(Boolean(result.hasMore))
      setResults((prev) => (append ? [...prev, ...next] : next))
    } catch {
      if (seq !== fetchSeq.current) return
      if (!append) setResults([])
      setHasMore(false)
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [token, attachedOnly])

  useEffect(() => {
    if (!token || selected || !active) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetchPage({ q: query.trim(), offset: 0, append: false })
    }, query.trim() ? 250 : 0)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, token, attachedOnly, selected, active, fetchPage])

  const loadMore = () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return
    fetchPage({
      q: queryRef.current.trim(),
      offset: results.length,
      append: true
    })
  }

  const onListScroll = (e) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      loadMore()
    }
  }

  const pick = (item) => {
    onSelect?.(item)
    setQuery('')
    setResults([])
    setOpen(false)
    setHasMore(false)
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wide text-primary_color/75 mb-1.5 block">
          {label}
        </label>
      )}
      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-300/80 bg-white/70 px-3 py-2">
          {selected.cover ? (
            <img src={selected.cover} alt="" className="w-11 h-11 rounded-md object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <ImageOff className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary_color truncate">{selected.name}</p>
            {selected.location && (
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />{selected.location}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { onClear?.(); setQuery('') }}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary_color hover:bg-primary_color/10"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(true) }}
            onFocus={() => { setOpen(true); setActive(true) }}
            placeholder={placeholder}
            className="text-sm w-full rounded-lg border border-gray-300/80 bg-white/70 pl-9 pr-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary_color/25 focus:border-primary_color"
          />
        </div>
      )}

      {open && !selected && (
        <div
          ref={listRef}
          onScroll={onListScroll}
          className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
        >
          {loading && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">Loading properties…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">
              {query.trim() ? 'No matching properties.' : 'No properties found.'}
            </p>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary_color/5 border-b border-gray-100 last:border-0 ${value === item.id ? 'bg-primary_color/10' : ''}`}
            >
              {item.cover ? (
                <img src={item.cover} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                  <ImageOff className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary_color truncate">{item.name}</p>
                {item.location && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{item.location}
                  </p>
                )}
              </div>
            </button>
          ))}
          {loadingMore && (
            <p className="px-3 py-2 text-xs text-gray-500">Loading more…</p>
          )}
        </div>
      )}
    </div>
  )
}
