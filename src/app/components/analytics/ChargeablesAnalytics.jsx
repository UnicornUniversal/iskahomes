'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import { AlertTriangle, CheckCircle2, CreditCard, Info, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useExtendedAuthProfile from '@/hooks/useExtendedAuthProfile'
import { getAuthTokenForUser } from '@/lib/authTokens'
import { formatChargeableDate, getOwnerDefaultCurrency } from '@/lib/chargeables'
import {
  CHARGEABLE_ANALYTICS_RANGES,
  formatChargeableMoney
} from '@/lib/chargeableAnalytics'
import { analyticsClasses, analyticsPalette, baseChartOptions, formatPercent } from './analyticsTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const STATUS_COLOR = {
  collected: analyticsPalette.emerald,
  overdue: analyticsPalette.rose,
  dueSoon: analyticsPalette.amber,
  later: analyticsPalette.secondary
}

const AGING_COLORS = [
  analyticsPalette.amber,
  '#f97316',
  analyticsPalette.rose,
  '#9f1239'
]

const severityStyle = {
  high: 'border-rose-200 bg-rose-50/80',
  medium: 'border-amber-200 bg-amber-50/80',
  good: 'border-emerald-200 bg-emerald-50/80',
  info: 'border-sky-200 bg-sky-50/70'
}

function DecisionIcon({ severity }) {
  if (severity === 'good') return <CheckCircle2 className="h-5 w-5 text-emerald-700" />
  if (severity === 'info') return <Info className="h-5 w-5 text-sky-700" />
  return <AlertTriangle className={`h-5 w-5 ${severity === 'high' ? 'text-rose-700' : 'text-amber-700'}`} />
}

function Stat({ label, value, hint }) {
  return (
    <div className={analyticsClasses.statCard}>
      <p className={analyticsClasses.metricLabel}>{label}</p>
      <p className={`${analyticsClasses.metricValue} mt-2`}>{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-primary_color/60">{hint}</p> : null}
    </div>
  )
}

export default function ChargeablesAnalytics({ chargesHref = null, unitId = null }) {
  const { user, loading: authLoading, developerToken, agencyToken, agentToken } = useAuth()
  const { extendedProfile } = useExtendedAuthProfile()
  const profile = extendedProfile || user?.profile || {}
  const currency = getOwnerDefaultCurrency(profile)
  const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    || (typeof window !== 'undefined' && (localStorage.getItem('developer_token') || localStorage.getItem('agency_token')))

  const [range, setRange] = useState('all')
  const [payload, setPayload] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return undefined
    if (!token) {
      setLoading(false)
      setError('Sign in again to load chargeable analytics.')
      return undefined
    }

    let cancelled = false
    const params = new URLSearchParams({ range, currency })
    if (unitId) params.set('unitId', unitId)

    setLoading(true)
    setError('')
    fetch(`/api/chargeables/analytics?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || 'Failed to load chargeable analytics')
        return body
      })
      .then((body) => {
        if (cancelled) return
        setPayload(body.data || null)
        setTruncated(!!body.truncated)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load chargeable analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [token, range, currency, unitId, authLoading])

  const money = (amount) => formatChargeableMoney(amount, payload?.currency || currency)
  const totals = payload?.totals

  const doughnutData = useMemo(() => {
    const rows = (payload?.statusMix || []).filter((row) => row.count > 0)
    return {
      labels: rows.map((row) => row.label),
      datasets: [{
        data: rows.map((row) => row.amount),
        backgroundColor: rows.map((row) => STATUS_COLOR[row.key] || analyticsPalette.slate),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    }
  }, [payload])

  const agingData = useMemo(() => ({
    labels: (payload?.aging || []).map((row) => row.label),
    datasets: [{
      label: 'Overdue amount',
      data: (payload?.aging || []).map((row) => row.amount),
      backgroundColor: AGING_COLORS,
      borderRadius: 8,
      maxBarThickness: 36
    }]
  }), [payload])

  const trendData = useMemo(() => ({
    labels: (payload?.months || []).map((row) => row.label),
    datasets: [
      {
        label: 'Billed',
        data: (payload?.months || []).map((row) => row.billed),
        backgroundColor: analyticsPalette.secondary,
        borderRadius: 8,
        maxBarThickness: 28
      },
      {
        label: 'Collected',
        data: (payload?.months || []).map((row) => row.collected),
        backgroundColor: analyticsPalette.emerald,
        borderRadius: 8,
        maxBarThickness: 28
      }
    ]
  }), [payload])

  const moneyTooltip = {
    callbacks: {
      label: (ctx) => `${ctx.dataset.label ? `${ctx.dataset.label}: ` : ''}${money(ctx.parsed.y ?? ctx.parsed)}`
    }
  }

  const barOptions = baseChartOptions({ yTitle: payload?.currency || currency })
  barOptions.plugins.tooltip = { ...barOptions.plugins.tooltip, ...moneyTooltip }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, color: analyticsPalette.slate, font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: analyticsPalette.tooltipBg,
        titleColor: '#f8fafc',
        bodyColor: analyticsPalette.tooltipText,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${money(ctx.parsed)}`
        }
      }
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={analyticsClasses.eyebrow}>Analytics</p>
          <h1 className="mt-3 text-2xl font-semibold text-primary_color">Chargeables</h1>
          <p className={`${analyticsClasses.subtitle} mt-2 max-w-2xl`}>
            Collected is money on cycles already marked paid. Still due is unpaid and not late. Overdue is unpaid and past the due date.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {CHARGEABLE_ANALYTICS_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  range === item.key
                    ? 'bg-primary_color text-white'
                    : 'bg-white/70 text-primary_color hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {chargesHref ? (
            <Link href={chargesHref} className="text-sm font-semibold text-primary_color underline underline-offset-4">
              Open charges
            </Link>
          ) : null}
        </div>
      </div>

      {loading || authLoading ? (
        <div className={`${analyticsClasses.section} flex items-center justify-center gap-3 py-16`}>
          <Loader2 className="h-5 w-5 animate-spin text-primary_color" />
          <span className="text-sm text-primary_color/70">Reading chargeable entries…</span>
        </div>
      ) : null}

      {!loading && !authLoading && error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-800">{error}</div>
      ) : null}

      {!loading && !authLoading && !error && payload ? (
        <>
          {truncated ? (
            <p className="text-xs text-primary_color/60">Showing the latest 5,000 entries. Older cycles are not in these totals.</p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {payload.decisions.map((decision) => (
              <div key={decision.title} className={`rounded-3xl border p-5 ${severityStyle[decision.severity] || severityStyle.info}`}>
                <div className="flex items-start gap-3">
                  <DecisionIcon severity={decision.severity} />
                  <div>
                    <p className="font-semibold text-primary_color">{decision.title}</p>
                    <p className="mt-1 text-sm leading-6 text-primary_color/75">{decision.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <Stat label="Collected" value={money(totals.paidAmount)} hint={`${totals.paidCount} paid cycles`} />
            <Stat label="Still due" value={money(totals.stillDueAmount)} hint={`${totals.stillDueCount} unpaid, not late`} />
            <Stat
              label="Overdue"
              value={money(totals.overdueAmount)}
              hint={totals.overdueCount ? `${totals.overdueCount} cycles · longest ${totals.longestOverdueDays} days` : 'Nothing is past due'}
            />
            <Stat
              label="Collection rate"
              value={formatPercent(totals.collectionRate)}
              hint={totals.onTimeRate ? `${formatPercent(totals.onTimeRate)} of dated payments were on time` : 'Share of billed money that is paid'}
            />
            <Stat label="Due in 7 days" value={money(totals.dueSoonAmount)} hint={`${totals.dueSoonCount} cycles before they go late`} />
            <Stat label="Monthly run rate" value={money(totals.monthlyRunRate)} hint="Open cycles, normalised to a month" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={analyticsClasses.section}>
              <h2 className={analyticsClasses.title}>Where the money sits</h2>
              <p className={`${analyticsClasses.subtitle} mt-1`}>Amount in each state, not the number of cycles.</p>
              <div className="mt-4 h-72">
                {payload.empty || doughnutData.labels.length === 0 ? (
                  <div className={analyticsClasses.empty}>No amounts to chart in this range.</div>
                ) : (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                )}
              </div>
            </section>

            <section className={analyticsClasses.section}>
              <h2 className={analyticsClasses.title}>How late the overdue book is</h2>
              <p className={`${analyticsClasses.subtitle} mt-1`}>Older buckets need a call. Newer ones can still be closed with a reminder.</p>
              <div className="mt-4 h-72">
                {(payload.aging || []).every((row) => row.amount === 0) ? (
                  <div className={analyticsClasses.empty}>No overdue balances in this range.</div>
                ) : (
                  <Bar data={agingData} options={barOptions} />
                )}
              </div>
            </section>
          </div>

          <section className={analyticsClasses.section}>
            <h2 className={analyticsClasses.title}>Billed against collected</h2>
            <p className={`${analyticsClasses.subtitle} mt-1`}>
              Billed uses the due date of each cycle. Collected uses the date it was marked paid.
              {payload.range.key === 'all' ? ' This chart is the last 6 months. The totals above include every entry.' : ' Totals above use the same range.'}
            </p>
            <div className="mt-4 h-80">
              <Bar data={trendData} options={barOptions} />
            </div>
          </section>

          <section className={analyticsClasses.section}>
            <h2 className={analyticsClasses.title}>By chargeable type</h2>
            <p className={`${analyticsClasses.subtitle} mt-1`}>A weak collection rate on one type is a follow-up problem, not a pricing problem, unless the amount itself is wrong.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-primary_color/50">
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Cycles</th>
                    <th className="px-3 py-2 font-semibold">Collected</th>
                    <th className="px-3 py-2 font-semibold">Outstanding</th>
                    <th className="px-3 py-2 font-semibold">Overdue</th>
                    <th className="px-3 py-2 font-semibold">Collection</th>
                    <th className="px-3 py-2 font-semibold">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.byType.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-primary_color/60">No chargeable types yet.</td>
                    </tr>
                  ) : payload.byType.map((row) => (
                    <tr key={row.typeId} className="border-t border-primary_color/10">
                      <td className="px-3 py-3 font-medium text-primary_color">{row.name}</td>
                      <td className="px-3 py-3 text-primary_color/80">{row.count}</td>
                      <td className="px-3 py-3 text-primary_color/80">{money(row.collected)}</td>
                      <td className="px-3 py-3 text-primary_color/80">{money(row.outstanding)}</td>
                      <td className="px-3 py-3 text-primary_color/80">{money(row.overdue)}</td>
                      <td className="px-3 py-3 text-primary_color/80">{row.count ? formatPercent(row.collectionRate) : '—'}</td>
                      <td className="px-3 py-3 text-primary_color/80">{money(row.monthlyRunRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-5">
            <section className={`${analyticsClasses.section} xl:col-span-3`}>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary_color" />
                <h2 className={analyticsClasses.title}>Chase these first</h2>
              </div>
              <p className={`${analyticsClasses.subtitle} mt-1`}>Open overdue cycles, longest late first.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-primary_color/50">
                      <th className="px-3 py-2 font-semibold">Unit</th>
                      <th className="px-3 py-2 font-semibold">Client</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">Due</th>
                      <th className="px-3 py-2 font-semibold">Late</th>
                      <th className="px-3 py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.topOverdue.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-primary_color/60">No overdue cycles in this range.</td>
                      </tr>
                    ) : payload.topOverdue.map((row) => (
                      <tr key={row.id} className="border-t border-primary_color/10">
                        <td className="px-3 py-3 font-medium text-primary_color">{row.unitName}</td>
                        <td className="px-3 py-3 text-primary_color/80">{row.clientName}</td>
                        <td className="px-3 py-3 text-primary_color/80">{row.typeName}</td>
                        <td className="px-3 py-3 text-primary_color/80">{formatChargeableDate(row.nextDueDate)}</td>
                        <td className="px-3 py-3 text-primary_color/80">{row.days} days</td>
                        <td className="px-3 py-3 text-primary_color/80">{money(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={`${analyticsClasses.section} xl:col-span-2`}>
              <h2 className={analyticsClasses.title}>Who owes the overdue</h2>
              <p className={`${analyticsClasses.subtitle} mt-1`}>Concentration tells you whether one call fixes most of the book.</p>
              <ul className="mt-4 space-y-3">
                {payload.topClients.length === 0 ? (
                  <li className="text-sm text-primary_color/60">No client is holding an overdue balance.</li>
                ) : payload.topClients.map((client) => (
                  <li key={client.clientId || client.clientName} className={analyticsClasses.compactCard}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary_color">{client.clientName}</p>
                        <p className="text-xs text-primary_color/60">{client.overdueCount} overdue {client.overdueCount === 1 ? 'cycle' : 'cycles'} · {formatPercent(client.share)} of overdue</p>
                      </div>
                      <p className="text-sm font-semibold text-primary_color">{money(client.overdueAmount)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-primary_color/60">
                Reminders on open cycles: {payload.reminders.sent} sent, {payload.reminders.pending} waiting, {payload.reminders.failed} failed.
              </p>
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}
