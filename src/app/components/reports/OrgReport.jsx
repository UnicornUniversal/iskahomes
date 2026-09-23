'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { formatCurrency } from '@/lib/utils'
import { dummyDateRange, getDummyReport } from './dummyReportData'
import ReportDataCard from './ReportDataCard'

function getSections(isAgency) {
  const sections = [{ id: 'profile', label: 'Profile' }]
  if (isAgency) sections.push({ id: 'agents', label: 'Agents' })
  sections.push(
    { id: 'listings', label: 'Listings' },
    { id: 'leads', label: 'Leads' },
    { id: 'chargeables', label: 'Chargeables' },
    { id: 'sales', label: 'Sales' }
  )
  return sections
}

function n(value) {
  return Number(value || 0).toLocaleString()
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function money(value, currency) {
  return formatCurrency(value, currency)
}

function formatRange(start, end) {
  if (!start || !end) return 'Select a period'
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${new Date(start).toLocaleDateString('en-GB', opts)} – ${new Date(end).toLocaleDateString('en-GB', opts)}`
}

function Section({ id, kicker, title, note, children }) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-10 max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary_color/55">{kicker}</p>
        <h2 className="mt-3 text-[2.8rem] font-semibold leading-[1.02] tracking-[-0.04em] text-primary_color md:text-[4rem] lg:text-[4.4rem]">
          {title}
        </h2>
        {note ? <p className="mt-3 text-[15px] leading-7 text-primary_color/65">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

function BarRow({ label, value, max, detail }) {
  const width = max > 0 ? Math.max(4, (Number(value || 0) / max) * 100) : 0
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-primary_color">{label}</span>
          <span className="text-sm font-medium tabular-nums text-primary_color">{detail ?? n(value)}</span>
        </div>
        <div className="mt-1.5 h-[2px] w-full bg-primary_color/10">
          <div className="h-full bg-primary_color" style={{ width: `${width}%` }} />
        </div>
      </div>
    </div>
  )
}

function BreakdownBlock({ title, items, currency }) {
  const max = Math.max(...items.map((item) => Number(item.count || item.revenue || 0)), 1)
  return (
    <div>
      <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">{title}</p>
      {items.map((item) => (
        <BarRow
          key={item.name}
          label={item.name}
          value={item.count}
          max={max}
          detail={
            item.revenue != null
              ? `${item.count} · ${money(item.revenue, currency)}`
              : n(item.count)
          }
        />
      ))}
    </div>
  )
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-primary_color/15">
            {columns.map((col) => (
              <th key={col.key} className="pb-3 pr-4 text-[11px] font-medium uppercase tracking-[0.14em] text-primary_color/45">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-primary_color/8 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="py-3.5 pr-4 align-middle text-primary_color">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SOURCE_LABELS = {
  iskahomes: 'Iska Homes',
  whatsapp: 'WhatsApp',
  copy_link: 'Copied link',
  referral: 'Referral',
  facebook: 'Facebook',
}

const CONTEXT_LABELS = {
  search: 'Search',
  home: 'Home',
  profile: 'Profile',
  listings: 'Listings',
  development: 'Development',
}

export default function OrgReport({
  accountType = 'developer',
  report: reportProp,
  showAccountToggle = false,
}) {
  const [previewType, setPreviewType] = useState(accountType)
  const [dateRange, setDateRange] = useState(dummyDateRange)
  const [activeSection, setActiveSection] = useState('profile')
  const resolvedType = showAccountToggle ? previewType : accountType
  const report = reportProp || getDummyReport(resolvedType)
  const { identity, team, analytics, listings, leads, chargeables, sales, agents } = report
  const isAgency = resolvedType === 'agency'
  const sections = getSections(isAgency)
  const currency = identity.default_currency?.code || 'GHS'
  const specializations = [...(identity.specialization?.database || []), ...(identity.specialization?.custom || [])]
  const pipelineLost = (leads.pipeline.cold_lead || 0) + (leads.pipeline.abandoned || 0)
  const inProgress = (leads.pipeline.contacted || 0) + (leads.pipeline.scheduled || 0) + (leads.pipeline.responded || 0)
  const overdueEntries = (chargeables.entries || [])
    .filter((row) => row.next_due_status === 'overdue')
    .sort((a, b) => (b.overdue_time || 0) - (a.overdue_time || 0))
  const bestListingConv = listings.highlights.bestConversion
  const convRate = bestListingConv.total_views
    ? ((bestListingConv.total_leads / bestListingConv.total_views) * 100).toFixed(1)
    : '0.0'

  const sources = useMemo(
    () =>
      Object.entries(analytics.lead_source_breakdown || {})
        .map(([key, value]) => ({
          key,
          label: SOURCE_LABELS[key] || key.replaceAll('_', ' '),
          count: value.amount,
          pct: value.percentage,
        }))
        .sort((a, b) => b.count - a.count),
    [analytics.lead_source_breakdown]
  )
  const sourceMax = Math.max(...sources.map((row) => row.count), 1)

  useEffect(() => {
    const nodes = getSections(resolvedType === 'agency').map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!nodes.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActiveSection(visible.target.id)
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.2, 0.45] }
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [resolvedType])

  return (
    <div className="relative pb-20 text-primary_color xl:pb-10">
      <div className="mx-auto max-w-[980px] xl:mr-56">
        <header className="mb-16 border-b border-primary_color/12 pb-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary_color/50">
                {isAgency ? 'Agency report' : 'Developer report'}
              </p>
              <h1 className="mt-3 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-primary_color md:text-[3.4rem]">
                {identity.name}
              </h1>
              <p className="mt-3 max-w-xl text-[16px] leading-7 text-primary_color/60">{identity.slogan}</p>
              <p className="mt-5 text-sm text-primary_color/50">
                {identity.city}, {identity.country}
                <span className="mx-2">·</span>
                {formatRange(dateRange.startDate, dateRange.endDate)}
              </p>
            </div>
            <div className="w-full max-w-[280px] space-y-3">
              {showAccountToggle ? (
                <div className="flex text-xs">
                  {['developer', 'agency'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPreviewType(type)}
                      className={`flex-1 border-b-2 py-2 capitalize transition ${
                        resolvedType === type
                          ? 'border-primary_color font-semibold text-primary_color'
                          : 'border-transparent text-primary_color/40'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              ) : null}
              <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
            <ReportDataCard title="Views" value={n(analytics.total_views)} change={analytics.views_change} />
            <ReportDataCard title="Leads" value={n(analytics.total_leads)} change={analytics.leads_change} />
            <ReportDataCard title="Conversion" value={pct(analytics.overall_conversion_rate)} change={analytics.conversion_change} />
            <ReportDataCard
              title="Revenue"
              value={money(sales.totalRevenue, currency)}
              hint={`${sales.totalUnitsSold} sold · ${sales.totalUnitsRented} rented`}
            />
          </div>
        </header>

        <div className="space-y-24">
          <Section
            id="profile"
            kicker="01"
            title="Profile"
            note={`${n(analytics.profile_views)} people opened this profile. Most arrived from listings, and shares account for the largest share of impressions.`}
          >
            <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Organization</p>
                <dl className="mt-5 space-y-4 text-sm leading-6">
                  <div className="flex justify-between gap-6 border-b border-primary_color/8 pb-3">
                    <dt className="text-primary_color/45">Contact</dt>
                    <dd className="text-right">{identity.email}<br />{identity.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-6 border-b border-primary_color/8 pb-3">
                    <dt className="text-primary_color/45">License</dt>
                    <dd className="text-right">{identity.license_number}</dd>
                  </div>
                  <div className="flex justify-between gap-6 border-b border-primary_color/8 pb-3">
                    <dt className="text-primary_color/45">Established</dt>
                    <dd className="text-right">{identity.founded_year} · {identity.company_size}</dd>
                  </div>
                  <div className="flex justify-between gap-6 border-b border-primary_color/8 pb-3">
                    <dt className="text-primary_color/45">Offices</dt>
                    <dd className="text-right">
                      {identity.company_locations.map((loc) => loc.city).join(', ')}
                    </dd>
                  </div>
                  {!isAgency ? (
                    <div className="flex justify-between gap-6">
                      <dt className="text-primary_color/45">Portfolio</dt>
                      <dd className="text-right">{identity.total_developments} developments · {identity.total_units} units</dd>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-6">
                      <dt className="text-primary_color/45">Default commission</dt>
                      <dd className="text-right">{identity.commission_rate?.default}%</dd>
                    </div>
                  )}
                </dl>
                {specializations.length ? (
                  <p className="mt-6 text-sm text-primary_color/55">{specializations.join('  ·  ')}</p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Team</p>
                <p className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-primary_color">
                  {team.total}
                </p>
                <p className="mt-1 text-sm text-primary_color/50">{team.active} active · {team.pending} invited</p>
                {isAgency && team.agents ? (
                  <p className="mt-2 text-sm">{team.agents.active_agents} of {team.agents.total_agents} agents active</p>
                ) : null}
                <ul className="mt-6 space-y-2">
                  {team.byRole.map((row) => (
                    <li key={row.role} className="flex justify-between text-sm">
                      <span className="text-primary_color/60">{row.role}</span>
                      <span className="tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              <ReportDataCard title="Profile views" value={n(analytics.profile_views)} hint={`${n(analytics.unique_profile_viewers)} unique viewers`} change={analytics.profile_views_change} />
              <ReportDataCard title="Impressions" value={n(analytics.total_impressions_received)} change={analytics.impressions_change} />
              <ReportDataCard title="Appointments" value={n(analytics.appointments_booked)} />
              <ReportDataCard title="View to lead" value={pct(analytics.view_to_lead_rate)} />
            </div>

            <div className="mt-14 grid gap-12 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Impressions</p>
                <p className="mb-4 text-sm text-primary_color/55">{n(analytics.total_impressions_received)} in this period</p>
                <BarRow label="Shares" value={analytics.impression_share_received} max={analytics.total_impressions_received} />
                <BarRow label="Social media" value={analytics.impression_social_media_received} max={analytics.total_impressions_received} />
                <BarRow label="Website visits" value={analytics.impression_website_visit_received} max={analytics.total_impressions_received} />
                <BarRow label="Saves" value={analytics.impression_saved_listing_received} max={analytics.total_impressions_received} />
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Where profile views come from</p>
                <p className="mb-4 text-sm text-primary_color/55">{n(analytics.unique_profile_viewers)} unique viewers</p>
                <BarRow label="From listings" value={analytics.profile_views_from_listings} max={analytics.profile_views} />
                <BarRow label="From search" value={analytics.profile_views_from_search} max={analytics.profile_views} />
                <BarRow label="From home" value={analytics.profile_views_from_home} max={analytics.profile_views} />
                <p className="mt-5 text-sm text-primary_color/55">{n(analytics.appointments_booked)} appointments booked from this activity.</p>
              </div>
            </div>
          </Section>

          {isAgency && agents ? (
            <Section
              id="agents"
              kicker="02"
              title="Agents"
              note={`${agents.active_agents} of ${agents.total_agents} agents are active. ${listings.highlights.bestAgent?.name} is leading on listings and leads this period.`}
            >
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <ReportDataCard title="Agents" value={n(agents.total_agents)} />
                <ReportDataCard title="Active" value={n(agents.active_agents)} />
                <ReportDataCard title="Inactive" value={n(agents.inactive_agents)} />
                <ReportDataCard
                  title="Top agent"
                  value={listings.highlights.bestAgent?.name}
                  hint={`${n(listings.highlights.bestAgent?.total_leads)} leads · ${n(listings.highlights.bestAgent?.total_listings)} listings`}
                />
              </div>
              <div className="mt-12">
                <Table
                  columns={[
                    { key: 'name', label: 'Agent', render: (row) => <span className="font-semibold">{row.name}</span> },
                    { key: 'agent_status', label: 'Status' },
                    { key: 'contact', label: 'Contact', render: (row) => [row.email, row.phone].filter(Boolean).join(' · ') },
                    { key: 'total_listings', label: 'Listings' },
                    { key: 'active_listings', label: 'Live' },
                    { key: 'total_views', label: 'Views', render: (row) => n(row.total_views) },
                    { key: 'total_leads', label: 'Leads', render: (row) => n(row.total_leads) },
                    { key: 'total_sales', label: 'Sales' },
                    { key: 'total_revenue', label: 'Revenue', render: (row) => money(row.total_revenue, currency) },
                    { key: 'commission_amount', label: 'Commission', render: (row) => money(row.commission_amount, currency) },
                  ]}
                  rows={agents.roster}
                />
              </div>
            </Section>
          ) : null}

          <Section
            id="listings"
            kicker={isAgency ? '03' : '02'}
            title="Listings"
            note={`${listings.highlights.bestByLeads.title} is pulling the most interest. ${isAgency ? listings.highlights.bestAgent?.name : listings.highlights.bestDevelopment?.title} is the strongest ${isAgency ? 'agent book' : 'development'} this period.`}
          >
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  label: 'Most viewed',
                  title: listings.highlights.bestByViews.title,
                  meta: `${n(listings.highlights.bestByViews.total_views)} views`,
                },
                {
                  label: 'Most enquired',
                  title: listings.highlights.bestByLeads.title,
                  meta: `${n(listings.highlights.bestByLeads.total_leads)} leads`,
                },
                {
                  label: isAgency ? 'Top agent' : 'Top development',
                  title: isAgency ? listings.highlights.bestAgent?.name : listings.highlights.bestDevelopment?.title,
                  meta: isAgency
                    ? `${listings.highlights.bestAgent?.total_listings} listings · ${n(listings.highlights.bestAgent?.total_leads)} leads`
                    : `${listings.highlights.bestDevelopment?.units_sold} of ${listings.highlights.bestDevelopment?.total_units} units sold`,
                },
              ].map((card) => (
                <div key={card.label} className="border-t border-primary_color pt-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary_color/45">{card.label}</p>
                  <p className="mt-3 text-[17px] font-semibold leading-snug text-primary_color">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm text-primary_color/50">{card.meta}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              <ReportDataCard title="Live listings" value={n(analytics.active_listings)} hint={`${n(analytics.total_listings)} in catalog`} />
              <ReportDataCard title="Sold / rented" value={`${analytics.sold_listings} / ${analytics.rented_listings}`} />
              <ReportDataCard title="On market" value={n(listings.visibility.public)} hint={`${listings.visibility.hidden} hidden`} />
              <ReportDataCard title="Awaiting review" value={n(listings.admin_status.pending)} />
            </div>

            <div className="mt-14">
              <Table
                columns={[
                  { key: 'title', label: 'Listing', render: (row) => <span className="font-medium">{row.title}</span> },
                  { key: 'city', label: 'City' },
                  { key: 'status', label: 'Availability' },
                  { key: 'price_type', label: 'Intent', render: (row) => row.price_type },
                  { key: 'total_views', label: 'Views', render: (row) => n(row.total_views) },
                  { key: 'total_leads', label: 'Leads', render: (row) => n(row.total_leads) },
                ]}
                rows={listings.topListings}
              />
              <p className="mt-3 text-xs text-primary_color/40">
                Best conversion: {bestListingConv.title} at {convRate}% of views becoming leads.
              </p>
            </div>

            {!isAgency && listings.topDevelopments?.length ? (
              <div className="mt-12">
                <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Developments</p>
                <Table
                  columns={[
                    { key: 'title', label: 'Development', render: (row) => <span className="font-medium">{row.title}</span> },
                    { key: 'status', label: 'Stage' },
                    { key: 'units', label: 'Units', render: (row) => `${row.units_sold} / ${row.total_units}` },
                    { key: 'total_views', label: 'Views', render: (row) => n(row.total_views) },
                    { key: 'total_leads', label: 'Leads', render: (row) => n(row.total_leads) },
                    { key: 'total_revenue', label: 'Revenue', render: (row) => money(row.total_revenue, currency) },
                  ]}
                  rows={listings.topDevelopments}
                />
              </div>
            ) : null}
          </Section>

          <Section
            id="leads"
            kicker={isAgency ? '04' : '03'}
            title="Leads"
            note={`${leads.bestDay.day}s around ${leads.bestHour.label} are the busiest. ${sources[0]?.label} still accounts for ${sources[0]?.pct}% of new leads.`}
          >
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <ReportDataCard title="New leads" value={n(analytics.total_leads)} change={analytics.leads_change} />
              <ReportDataCard title="Known / anonymous" value={`${analytics.unique_leads} / ${analytics.anonymous_leads}`} />
              <ReportDataCard title="Closed" value={n(leads.pipeline.closed)} />
              <ReportDataCard title="Lost" value={n(pipelineLost)} hint="Cold or abandoned" tone="warn" />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <ReportDataCard
                title="Best hour"
                value={leads.bestHour.label}
                hint={`${n(leads.bestHour.leads)} leads · ${n(leads.bestHour.conversions)} conversions · ${pct(leads.bestHour.conversion_rate)}`}
              />
              <ReportDataCard
                title="Best day"
                value={leads.bestDay.day}
                hint={`${n(leads.bestDay.leads)} leads · ${n(leads.bestDay.conversions)} conversions · ${pct(leads.bestDay.conversion_rate)}`}
              />
              <ReportDataCard
                title="Best week"
                value={leads.bestWeek.label}
                hint={`${n(leads.bestWeek.leads)} leads · ${n(leads.bestWeek.conversions)} conversions · ${pct(leads.bestWeek.conversion_rate)}`}
              />
            </div>

            <div className="mt-14 grid gap-14 md:grid-cols-2">
              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Pipeline</p>
                <BarRow label="New" value={leads.pipeline.new} max={analytics.total_leads} />
                <BarRow label="In conversation" value={inProgress} max={analytics.total_leads} />
                <BarRow label="Closed" value={leads.pipeline.closed} max={analytics.total_leads} />
                <BarRow label="Lost" value={pipelineLost} max={analytics.total_leads} />
              </div>
              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Source</p>
                {sources.map((row) => (
                  <BarRow key={row.key} label={row.label} value={row.count} max={sourceMax} detail={`${row.count} · ${row.pct}%`} />
                ))}
              </div>
            </div>

            <div className="mt-14 grid gap-14 md:grid-cols-2">
              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">How they reached you</p>
                <BarRow label="Phone" value={leads.action_mix.lead_phone} max={analytics.total_leads} />
                <BarRow label="Message" value={leads.action_mix.lead_message} max={analytics.total_leads} />
                <BarRow label="Appointment" value={leads.action_mix.lead_appointment} max={analytics.total_leads} />
                <BarRow label="Manual entry" value={leads.action_mix.lead_manual} max={analytics.total_leads} />
              </div>
              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">On Iska Homes</p>
                {leads.topContexts.map((row) => (
                  <BarRow
                    key={row.name}
                    label={CONTEXT_LABELS[row.name] || row.name}
                    value={row.amount}
                    max={Math.max(...leads.topContexts.map((c) => c.amount), 1)}
                  />
                ))}
                <p className="mt-6 text-sm text-primary_color/50">
                  {leads.lead_type.automated} came in automatically · {leads.lead_type.manual} were added by the team.
                </p>
              </div>
            </div>

          </Section>

          <Section
            id="chargeables"
            kicker={isAgency ? '05' : '04'}
            title="Chargeables"
            note={`Still due is unpaid but not late. Overdue is unpaid and past the due date. ${money(chargeables.totals.overdue_amount, currency)} is late across ${chargeables.totals.overdue_count} units, averaging ${chargeables.totals.average_overdue_days} days.`}
          >
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
              <ReportDataCard title="Collected" value={money(chargeables.totals.paid_amount, currency)} hint={`${chargeables.totals.paid_count} paid`} />
              <ReportDataCard title="Still due" value={money(chargeables.totals.still_due_amount, currency)} hint={`${chargeables.totals.still_due_count} unpaid, not late`} />
              <ReportDataCard title="Overdue" value={money(chargeables.totals.overdue_amount, currency)} hint={`${chargeables.totals.overdue_count} past due date`} tone="warn" />
              <ReportDataCard title="Average overdue" value={`${chargeables.totals.average_overdue_days} days`} hint={`Longest ${chargeables.totals.longest_overdue_days} days`} tone="warn" />
              <ReportDataCard title="Due this period" value={n(chargeables.totals.due_count)} />
            </div>

            <div className="mt-14">
              <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-rose-700/60">Overdue payments</p>
              {overdueEntries.length === 0 ? (
                <p className="text-sm text-primary_color/50">No overdue chargeable entries in this period.</p>
              ) : (
                <div className="space-y-6">
                  {overdueEntries.map((row) => (
                    <div key={row.billing_reference} className="grid gap-2 border-t border-rose-200/80 pt-4 md:grid-cols-[1.3fr_1fr_auto]">
                      <div>
                        <p className="text-[17px] font-semibold leading-snug text-primary_color">
                          {row.unit_title}
                        </p>
                        <p className="mt-1 text-sm text-primary_color/55">{row.chargeable_type}</p>
                      </div>
                      <div className="text-sm text-primary_color/70">
                        {row.client_name ? (
                          <>
                            <p>{row.client_name}</p>
                            <p className="mt-1 text-primary_color/50">
                              {[row.client_email, row.client_phone].filter(Boolean).join('  ·  ') || 'No contact on file'}
                            </p>
                          </>
                        ) : (
                          <p className="text-primary_color/45">No client attached</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-rose-800">{money(row.amount, currency)}</p>
                        <p className="text-sm text-rose-700">{row.overdue_time} days overdue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-14">
              <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Charge types</p>
              <Table
                columns={[
                  { key: 'name', label: 'Type', render: (row) => <span className="font-medium">{row.name}</span> },
                  { key: 'interval', label: 'Interval', render: (row) => `${row.default_interval_value} ${row.default_interval_unit}` },
                  { key: 'attached_listings', label: 'Units' },
                  { key: 'collected_revenue', label: 'Collected', render: (row) => money(row.collected_revenue, currency) },
                  { key: 'outstanding_revenue', label: 'Still due', render: (row) => money(row.outstanding_revenue, currency) },
                  { key: 'overdue_revenue', label: 'Overdue', render: (row) => money(row.overdue_revenue, currency) },
                ]}
                rows={chargeables.types}
              />
            </div>
          </Section>

          <Section
            id="sales"
            kicker={isAgency ? '06' : '05'}
            title="Sales"
            note={`${sales.totalUnitsSold} sold and ${sales.totalUnitsRented} rented. Closed value is ${money(sales.totalRevenue, currency)} against ${money(sales.expectedRevenue, currency)} still in the catalog.`}
          >
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <ReportDataCard title="Closed value" value={money(sales.totalRevenue, currency)} />
              <ReportDataCard title="Still expected" value={money(sales.expectedRevenue, currency)} />
              <ReportDataCard title="Avg. time to close" value={`${sales.averageSalesTime} days`} />
              <ReportDataCard
                title={isAgency ? 'Commission' : 'Leads to sale'}
                value={isAgency ? money((sales.commission_paid || 0) + (sales.commission_pending || 0), currency) : pct(sales.leadsToSales)}
                hint={isAgency ? `${money(sales.commission_paid, currency)} received` : null}
              />
            </div>

            <div className="mt-14 grid gap-12 md:grid-cols-2">
              <BreakdownBlock title="By purpose" items={sales.by_purpose || []} currency={currency} />
              <BreakdownBlock title="By type" items={sales.by_type || []} currency={currency} />
              <BreakdownBlock title="By subtype" items={sales.by_subtype || []} currency={currency} />
              <div>
                <BreakdownBlock title="By country" items={sales.by_country || []} currency={currency} />
                <div className="mt-10">
                  <BreakdownBlock title="By region" items={sales.by_region || []} currency={currency} />
                </div>
              </div>
            </div>

            <div className="mt-14">
              <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-primary_color/45">Closed listings</p>
              <Table
                columns={[
                  { key: 'title', label: 'Listing', render: (row) => <span className="font-medium">{row.title}</span> },
                  { key: 'sale_type', label: 'Outcome', render: (row) => (row.sale_type === 'sold' ? 'Sold' : 'Rented') },
                  { key: 'purpose', label: 'Purpose' },
                  { key: 'type', label: 'Type' },
                  { key: 'subtype', label: 'Subtype' },
                  { key: 'region', label: 'Region' },
                  { key: 'sale_price', label: 'Sale price', render: (row) => money(row.sale_price, row.currency || currency) },
                  { key: 'buyer_name', label: 'Buyer' },
                ]}
                rows={sales.records}
              />
            </div>
          </Section>
        </div>
      </div>

      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-primary_color/10 bg-white/95 px-4 py-2 backdrop-blur xl:inset-auto xl:top-32 xl:right-8 xl:w-44 xl:border-0 xl:bg-transparent xl:p-0">
        <nav className="flex items-center gap-1 overflow-x-auto xl:flex-col xl:items-start xl:gap-0">
          {sections.map((section, index) => {
            const active = activeSection === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-baseline gap-3 whitespace-nowrap px-3 py-2 text-sm xl:w-full xl:px-0 xl:py-2.5 ${
                  active ? 'text-primary_color' : 'text-primary_color/35 hover:text-primary_color/70'
                }`}
              >
                <span className="text-[11px] tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className={active ? 'font-medium' : ''}>{section.label}</span>
              </a>
            )
          })}
        </nav>
      </aside>
    </div>
  )
}
