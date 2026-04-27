'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Loader2, Globe2, Share2 } from 'lucide-react'
import { analyticsClasses, analyticsPalette, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

function titleCaseKey(key) {
  if (!key) return ''
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** @param {Record<string, unknown> | null | undefined} raw */
function normalizeEntries(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw)
    .map(([key, val]) => {
      const v = val && typeof val === 'object' ? val : {}
      const amount = Number(v.amount) || 0
      const percentage = Number(v.percentage) || 0
      const cb = v.context_breakdown
      const contexts =
        key === 'website' && cb && typeof cb === 'object' && !Array.isArray(cb)
          ? Object.entries(cb)
              .map(([ck, cv]) => {
                const c = cv && typeof cv === 'object' ? cv : {}
                return {
                  key: ck,
                  label: titleCaseKey(ck),
                  amount: Number(c.amount) || 0,
                  percentage: Number(c.percentage) || 0
                }
              })
              .filter((x) => x.amount > 0)
              .sort((a, b) => b.amount - a.amount)
          : []
      return {
        key,
        label: titleCaseKey(key),
        amount,
        percentage,
        contexts
      }
    })
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

const barColors = [
  analyticsPalette.primary,
  analyticsPalette.secondary,
  analyticsPalette.emerald,
  analyticsPalette.violet,
  analyticsPalette.amber,
  analyticsPalette.rose,
  '#14b8a6',
  '#64748b'
]

const doughnutColors = [
  analyticsPalette.primarySoft,
  analyticsPalette.secondarySoft,
  analyticsPalette.emeraldSoft,
  analyticsPalette.violetSoft,
  analyticsPalette.amberSoft,
  analyticsPalette.roseSoft,
  'rgba(20, 184, 166, 0.35)',
  'rgba(100, 116, 139, 0.35)'
]

export default function LeadSourceBreakdown({ listerId, listerType = 'developer' }) {
  const [breakdown, setBreakdown] = useState(null)
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
        const res = await fetch(`/api/leads/source-breakdown?${qs}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.success) {
          setError(json.error || 'Could not load lead sources')
          setBreakdown({})
          return
        }
        setBreakdown(json.data?.breakdown || {})
      } catch (e) {
        if (!cancelled) {
          setError('Could not load lead sources')
          setBreakdown({})
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

  const entries = useMemo(() => normalizeEntries(breakdown), [breakdown])
  const websiteEntry = useMemo(() => entries.find((e) => e.key === 'website'), [entries])
  const totalDistinct = useMemo(
    () => entries.reduce((s, e) => s + e.amount, 0),
    [entries]
  )

  const mainBarData = useMemo(() => {
    return {
      labels: entries.map((e) => e.label),
      datasets: [
        {
          label: 'Distinct leads',
          data: entries.map((e) => e.amount),
          backgroundColor: entries.map((_, i) => barColors[i % barColors.length]),
          borderColor: entries.map((_, i) => barColors[i % barColors.length]),
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    }
  }, [entries])

  const mainBarOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: analyticsPalette.tooltipBg,
          titleColor: analyticsPalette.tooltipText,
          bodyColor: analyticsPalette.tooltipText,
          callbacks: {
            label(ctx) {
              const i = ctx.dataIndex
              const e = entries[i]
              if (!e) return ''
              return [`${formatNumber(e.amount)} leads`, `${formatPercent(e.percentage)} of all sources`]
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: analyticsPalette.grid },
          ticks: { color: analyticsPalette.slate, font: { size: 11 } },
          border: { display: false }
        },
        y: {
          grid: { display: false },
          ticks: { color: analyticsPalette.slate, font: { size: 11 } },
          border: { display: false }
        }
      }
    }),
    [entries]
  )

  const websiteDoughnut = useMemo(() => {
    const ctxs = websiteEntry?.contexts || []
    if (ctxs.length === 0) return null
    return {
      labels: ctxs.map((c) => c.label),
      datasets: [
        {
          data: ctxs.map((c) => c.amount),
          backgroundColor: ctxs.map((_, i) => doughnutColors[i % doughnutColors.length]),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    }
  }, [websiteEntry])

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: analyticsPalette.slate,
            boxWidth: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: analyticsPalette.tooltipBg,
          titleColor: analyticsPalette.tooltipText,
          bodyColor: analyticsPalette.tooltipText,
          callbacks: {
            label(ctx) {
              const c = websiteEntry?.contexts?.[ctx.dataIndex]
              if (!c) return ''
              return [
                `${formatNumber(c.amount)} leads`,
                `${formatPercent(c.percentage)} of website`
              ]
            }
          }
        }
      }
    }),
    [websiteEntry]
  )

  if (loading) {
    return (
      <div className={analyticsClasses.section}>
        <div className="flex items-center justify-center py-12 text-primary_color/70">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-teal-600" />
          <span>Loading lead sources…</span>
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
          <span className={analyticsClasses.eyebrow}>Attribution</span>
          <div>
            <h3 className={analyticsClasses.title}>Lead source breakdown</h3>
            <p className={analyticsClasses.subtitle}>
              Where distinct leads came from: shared links (WhatsApp, Facebook, etc.), in-app traffic
              labeled <span className="font-medium text-primary_color/80">website</span>, and nested
              surfaces when we know them (home, search, directory, …).
            </p>
          </div>
        </div>
        <div className={`${analyticsClasses.subPanel} lg:min-w-[200px]`}>
          <p className={analyticsClasses.metricLabel}>Attributed distinct leads</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
            {formatNumber(totalDistinct)}
          </p>
          <p className="mt-1 text-xs text-primary_color/60">Cumulative on your account</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className={`${analyticsClasses.empty} mt-6`}>
          No lead source data yet. Sources fill in as new leads are recorded with attribution.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Share2 className="h-4 w-4 text-teal-600" />
                By source
              </div>
              <div className="h-72 min-h-[220px]">
                <Bar data={mainBarData} options={mainBarOptions} />
              </div>
            </div>
            <div className="xl:col-span-2 flex flex-col gap-3">
              {entries.map((e, idx) => (
                <div
                  key={e.key}
                  className="default_bg2 rounded-2xl border border-white/30 bg-white/25 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary_color">{e.label}</p>
                      <p className="mt-1 text-xs text-primary_color/60">
                        {formatPercent(e.percentage)} of all sources
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-primary_color">
                      {formatNumber(e.amount)}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, e.percentage || 0)}%`,
                        backgroundColor: barColors[idx % barColors.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {websiteEntry && websiteEntry.contexts.length > 0 && (
            <div className="rounded-3xl border border-teal-100/90 bg-gradient-to-br from-teal-50/80 to-white/60 p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className={`${analyticsClasses.iconWrap} bg-teal-50 text-teal-700 ring-teal-100`}>
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-primary_color">Website traffic surfaces</h4>
                    <p className="text-sm text-primary_color/70">
                      Share of <span className="font-medium">website</span> leads by in-app context
                    </p>
                  </div>
                </div>
                <p className="text-sm text-primary_color/70">
                  {formatNumber(websiteEntry.amount)} website leads total
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="mx-auto flex h-64 w-full max-w-xs items-center justify-center lg:max-w-none">
                  {websiteDoughnut && <Doughnut data={websiteDoughnut} options={doughnutOptions} />}
                </div>
                <div className="space-y-3">
                  {websiteEntry.contexts.map((c, i) => (
                    <div
                      key={c.key}
                      className="default_bg2 rounded-2xl border border-white/40 bg-white/30 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-primary_color">{c.label}</span>
                        <span className="text-sm font-semibold tabular-nums text-primary_color">
                          {formatNumber(c.amount)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, c.percentage || 0)}%`,
                            backgroundColor: barColors[(i + 2) % barColors.length]
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-primary_color/60">
                        {formatPercent(c.percentage)} of website leads
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
