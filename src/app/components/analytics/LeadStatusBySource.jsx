'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Loader2 } from 'lucide-react'
import { analyticsClasses, analyticsPalette, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const SOURCE_COLORS = [
  analyticsPalette.primary,
  analyticsPalette.secondary,
  analyticsPalette.emerald,
  analyticsPalette.violet,
  analyticsPalette.amber,
  analyticsPalette.rose,
  '#14b8a6',
  '#64748b',
  '#a855f7',
  '#f97316'
]

function buildPieData(status, sources) {
  const slices = sources
    .map((source, index) => ({
      key: source.key,
      label: source.label,
      count: status.sources?.[source.key] || 0,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length]
    }))
    .filter((slice) => slice.count > 0)

  return {
    slices,
    chart: {
      labels: slices.map((slice) => slice.label),
      datasets: [
        {
          data: slices.map((slice) => slice.count),
          backgroundColor: slices.map((slice) => slice.color),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    }
  }
}

export default function LeadStatusBySource({ listerId, listerType = 'developer' }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!listerId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({ lister_id: listerId, lister_type: listerType })
        const res = await fetch(`/api/leads/status-by-source?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(json.error || 'Could not load status analytics')
          setPayload(null)
          return
        }
        setPayload(json.data)
      } catch {
        if (!cancelled) {
          setError('Could not load status analytics')
          setPayload(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [listerId, listerType])

  const statuses = payload?.statuses || []
  const sources = payload?.sources || []
  const total = payload?.total || 0

  const pieByStatus = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((status) => [status.key, buildPieData(status, sources)])
      ),
    [statuses, sources]
  )

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: analyticsPalette.tooltipBg,
          titleColor: analyticsPalette.tooltipText,
          bodyColor: analyticsPalette.tooltipText,
          callbacks: {
            label(ctx) {
              const count = Number(ctx.raw) || 0
              const sum = (ctx.dataset.data || []).reduce((acc, value) => acc + Number(value || 0), 0)
              const share = sum ? (count / sum) * 100 : 0
              return `${ctx.label}: ${formatNumber(count)} (${formatPercent(share)})`
            }
          }
        }
      }
    }),
    []
  )

  if (loading) {
    return (
      <div className={analyticsClasses.section}>
        <div className="flex items-center justify-center py-12 text-primary_color/70">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-teal-600" />
          <span>Loading status analytics…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={analyticsClasses.section}>
        <div className="py-10 text-center text-sm text-rose-600">{error}</div>
      </div>
    )
  }

  return (
    <div className={analyticsClasses.section}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3 max-w-3xl">
          <span className={analyticsClasses.eyebrow}>Status analytics</span>
          <div>
            <h3 className={analyticsClasses.title}>Status breakdown by source</h3>
            <p className={analyticsClasses.subtitle}>
              Each pipeline status as a pie chart, split by where those leads came from.
            </p>
          </div>
        </div>
        <div className={`${analyticsClasses.subPanel} lg:min-w-[200px]`}>
          <p className={analyticsClasses.metricLabel}>Leads in pipeline</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
            {formatNumber(total)}
          </p>
        </div>
      </div>

      {statuses.length === 0 ? (
        <div className={`${analyticsClasses.empty} mt-6`}>
          No status analytics yet. Counts appear once leads have a source and a pipeline status.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statuses.map((status) => {
            const pie = pieByStatus[status.key]
            return (
              <div
                key={status.key}
                className="default_bg2 rounded-2xl border border-white/30 bg-white/25 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-primary_color">{status.label}</p>
                  <p className="text-lg font-semibold tabular-nums text-primary_color">
                    {formatNumber(status.total)}
                  </p>
                </div>
                <div className="mx-auto mt-4 h-44 w-44">
                  {pie?.chart && <Doughnut data={pie.chart} options={pieOptions} />}
                </div>
                <div className="mt-4 space-y-2">
                  {pie.slices.map((slice) => (
                    <div key={slice.key} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm text-primary_color">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        {slice.label}
                      </span>
                      <span className="text-sm tabular-nums text-primary_color/80">
                        {formatNumber(slice.count)} · {formatPercent((slice.count / status.total) * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
