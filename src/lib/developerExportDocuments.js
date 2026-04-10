/**
 * Printable HTML exports for developer dashboard analytics and service charges.
 * Opens the system print dialog so the user can save as PDF (matches on-screen styling).
 */

import { formatCurrency } from '@/lib/utils'

export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function csvEscape(cell) {
  const s = String(cell ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Align listing, profile, and total series by date (same logic as ViewsChart).
 */
export function mergeStatisticsRows(listingData, profileData, totalData) {
  const allDates = new Set()
  ;(listingData || []).forEach((item) => {
    if (item?.date) allDates.add(item.date)
  })
  ;(profileData || []).forEach((item) => {
    if (item?.date) allDates.add(item.date)
  })
  ;(totalData || []).forEach((item) => {
    if (item?.date) allDates.add(item.date)
  })
  const sortedDates = Array.from(allDates).sort()
  const listingMap = new Map((listingData || []).map((item) => [item.date || '', item]))
  const profileMap = new Map((profileData || []).map((item) => [item.date || '', item]))
  const totalMap = new Map((totalData || []).map((item) => [item.date || '', item]))

  return sortedDates.map((date) => {
    const listingItem = listingMap.get(date)
    const profileItem = profileMap.get(date)
    const totalItem = totalMap.get(date)
    return {
      date,
      label:
        listingItem?.label ||
        profileItem?.label ||
        totalItem?.label ||
        date,
      listing: listingItem?.value ?? 0,
      profile: profileItem?.value ?? 0,
      total: totalItem?.value ?? 0,
    }
  })
}

function formatLongDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

function buildSparklineSvg(listingVals, profileVals, width = 720, height = 160) {
  const max = Math.max(1, ...listingVals, ...profileVals)
  const padX = 12
  const padY = 14
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const n = Math.max(listingVals.length, profileVals.length, 1)
  const step = n <= 1 ? 0 : innerW / (n - 1)

  const linePath = (vals) => {
    if (!vals.length) return ''
    return vals
      .map((v, i) => {
        const x = padX + i * step
        const y = padY + innerH - (v / max) * innerH
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const gridLines = 4
  let grid = ''
  for (let g = 0; g <= gridLines; g++) {
    const y = padY + (innerH * g) / gridLines
    grid += `<line x1="${padX}" y1="${y.toFixed(1)}" x2="${width - padX}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1"/>`
  }

  const lPath = linePath(listingVals)
  const pPath = linePath(profileVals)

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="display:block;max-width:100%;">
  ${grid}
  ${lPath ? `<path d="${lPath}" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
  ${pPath ? `<path d="${pPath}" fill="none" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
</svg>`
}

const DOC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0f172a;
    background: #fff;
    margin: 0;
    padding: 48px 56px;
    font-size: 11px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  .org {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #17637C;
    max-width: 65%;
  }
  .meta-date {
    font-size: 10px;
    color: #64748b;
    text-align: right;
  }
  .pill {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #17637C;
    border: 1px solid #17637C;
    border-radius: 999px;
    padding: 6px 14px;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 8px 0;
    color: #0f172a;
    line-height: 1.1;
  }
  .subtitle {
    font-size: 13px;
    font-weight: 600;
    color: #17637C;
    margin-bottom: 12px;
  }
  .context {
    font-size: 11px;
    color: #475569;
    max-width: 640px;
    margin-bottom: 32px;
    line-height: 1.65;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .summary-card {
    background: linear-gradient(135deg, rgba(23, 99, 124, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  }
  .summary-card .label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 8px;
  }
  .summary-card .value {
    font-size: 26px;
    font-weight: 700;
    color: #17637C;
    letter-spacing: -0.02em;
  }
  .chart-wrap {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px 8px;
    margin-bottom: 28px;
    background: #fafafa;
  }
  .chart-legend {
    display: flex;
    gap: 20px;
    margin-bottom: 8px;
    font-size: 10px;
    font-weight: 500;
    color: #475569;
  }
  .chart-legend span { display: flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot-listing { background: #3B82F6; }
  .dot-profile { background: #8B5CF6; }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 36px;
  }
  th {
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #17637C;
    padding: 10px 12px;
    border-bottom: 2px solid #17637C;
    background: #f8fafc;
  }
  th.num { text-align: right; }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 11px;
    color: #334155;
  }
  tr:nth-child(even) td { background: #fafafa; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  .footer {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #94a3b8;
  }
  .footer strong { color: #64748b; font-weight: 600; }
  @media print {
    body { padding: 36px 44px; }
    .summary-card, .chart-wrap { break-inside: avoid; }
  }
`

/**
 * Full HTML document for statistics / views export.
 */
export function buildStatisticsExportHtml({
  organizationName,
  dateRangeLabel,
  generatedAtLabel,
  summary,
  rows,
}) {
  const listingSeries = rows.map((r) => r.listing)
  const profileSeries = rows.map((r) => r.profile)
  const chartSvg = buildSparklineSvg(listingSeries, profileSeries)

  const tableRows = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.label)}</td>
      <td class="num">${Number(r.listing).toLocaleString('en-US')}</td>
      <td class="num">${Number(r.profile).toLocaleString('en-US')}</td>
      <td class="num">${Number(r.total).toLocaleString('en-US')}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(organizationName)} — Statistics</title>
  <style>${DOC_STYLES}</style>
</head>
<body>
  <div class="top">
    <div class="org">${escapeHtml(organizationName)}</div>
    <div class="meta-date">${escapeHtml(generatedAtLabel)}</div>
  </div>
  <div class="pill">Analytics · Views</div>
  <h1>Statistics report</h1>
  <div class="subtitle">${escapeHtml(dateRangeLabel)}</div>
  <p class="context">
    Listing views capture attention on your property pages; profile views reflect visits to your developer profile.
    Figures in this export match the Statistics panel on your dashboard for the selected date range, including the summary totals and the same breakdown by period below.
  </p>
  <div class="summary">
    <div class="summary-card">
      <div class="label">Total views</div>
      <div class="value">${Number(summary.totalViews || 0).toLocaleString('en-US')}</div>
    </div>
    <div class="summary-card">
      <div class="label">Listing views</div>
      <div class="value">${Number(summary.totalListingViews || 0).toLocaleString('en-US')}</div>
    </div>
    <div class="summary-card">
      <div class="label">Profile views</div>
      <div class="value">${Number(summary.totalProfileViews || 0).toLocaleString('en-US')}</div>
    </div>
  </div>
  <div class="chart-wrap">
    <div class="chart-legend">
      <span><i class="dot dot-listing"></i> Listing views</span>
      <span><i class="dot dot-profile"></i> Profile views</span>
    </div>
    ${chartSvg}
  </div>
  <div class="section-title">Detailed breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Period</th>
        <th class="num">Listing</th>
        <th class="num">Profile</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="4">No rows</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <div><strong>Iska Homes</strong> · Developer analytics export</div>
    <div>${escapeHtml(generatedAtLabel)}</div>
  </div>
</body>
</html>`
}

function statusLabel(charge) {
  if (charge.isOverdue) return 'Overdue'
  if (charge.isDueSoon) return 'Due soon'
  return charge.status || 'Pending'
}

/**
 * Full HTML document for latest service charges (dashboard-style cards).
 */
export function buildServiceChargesExportHtml({
  organizationName,
  generatedAtLabel,
  currency,
  charges,
}) {
  const cards = (charges || [])
    .map((c) => {
      const amount = typeof c.amount === 'number' ? c.amount : Number(c.amount) || 0
      const amtDisplay = escapeHtml(formatCurrency(amount, currency))
      const status = statusLabel(c)
      const statusClass =
        c.isOverdue ? 'status-overdue' : c.isDueSoon ? 'status-soon' : 'status-default'
      const period =
        c.periodStart && c.periodEnd
          ? `${escapeHtml(formatShortDate(c.periodStart))} – ${escapeHtml(formatShortDate(c.periodEnd))}`
          : '—'
      const dueLine = c.nextDueDate
        ? `${c.isOverdue ? 'Overdue since ' : 'Due: '}${escapeHtml(formatShortDate(c.nextDueDate))}`
        : ''

      return `
  <div class="charge-card">
    <div class="charge-top">
      <div class="charge-amt">${amtDisplay}</div>
      <span class="status-pill ${statusClass}">${escapeHtml(status)}</span>
    </div>
    <div class="charge-body">
      <div><span class="k">Property</span> ${escapeHtml(c.unitName && c.unitName !== '—' ? c.unitName : '—')}</div>
      <div><span class="k">Client</span> ${escapeHtml(c.clientName || '—')}</div>
      <div><span class="k">Billing period</span> ${period}</div>
      ${dueLine ? `<div class="due ${c.isOverdue ? 'due-bad' : c.isDueSoon ? 'due-warn' : ''}">${dueLine}</div>` : ''}
    </div>
  </div>`
    })
    .join('')

  const extraStyles = `
  .charge-grid { display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
  .charge-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    break-inside: avoid;
  }
  .charge-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .charge-amt { font-size: 15px; font-weight: 700; color: #17637C; }
  .status-pill {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .status-default { background: #f1f5f9; color: #17637C; }
  .status-soon { background: #fffbeb; color: #b45309; }
  .status-overdue { background: #fef2f2; color: #b91c1c; }
  .charge-body { font-size: 10px; color: #475569; line-height: 1.6; }
  .charge-body .k { font-weight: 600; color: #334155; margin-right: 6px; }
  .due { margin-top: 6px; }
  .due-bad { color: #b91c1c; font-weight: 600; }
  .due-warn { color: #b45309; font-weight: 600; }
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(organizationName)} — Service charges</title>
  <style>${DOC_STYLES}${extraStyles}</style>
</head>
<body>
  <div class="top">
    <div class="org">${escapeHtml(organizationName)}</div>
    <div class="meta-date">${escapeHtml(generatedAtLabel)}</div>
  </div>
  <div class="pill">Billing · Service charges</div>
  <h1>Service charge summary</h1>
  <div class="subtitle">${charges?.length || 0} record${charges?.length === 1 ? '' : 's'} · Latest activity</div>
  <p class="context">
    This export mirrors the Latest Service Charges widget on your dashboard: amounts, clients, properties, billing periods, and due status.
    Use it for internal reconciliation or sharing with finance; it reflects the same list you see in the app at export time.
  </p>
  <div class="section-title">Charges</div>
  <div class="charge-grid">${cards || '<p class="context">No service charges to export.</p>'}</div>
  <div class="footer">
    <div><strong>Iska Homes</strong> · Service charge export</div>
    <div>${escapeHtml(generatedAtLabel)}</div>
  </div>
</body>
</html>`
}

const SC_FULL_EXTRA_STYLES = `
  .summary-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 28px;
  }
  @media (max-width: 900px) {
    .summary-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .summary-card .value.value-sm { font-size: 20px; }
  .prop-sub { display: block; font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1.35; max-width: 220px; }
`

/**
 * Full service charge page export: summary metrics (matching dashboard cards) + detailed table.
 * Styled consistently with the statistics PDF (professional report layout).
 */
export function buildServiceChargeFullPageReportHtml({
  organizationName,
  generatedAtLabel,
  currency,
  filterSummary,
  stats,
  charges,
}) {
  const s = stats || {}
  const tableRows = (charges || [])
    .map((c) => {
      const amount = typeof c.amount === 'number' ? c.amount : Number(c.amount) || 0
      const period =
        c.periodStart && c.periodEnd
          ? `${formatShortDate(c.periodStart)} – ${formatShortDate(c.periodEnd)}`
          : '—'
      let dueCell = '—'
      if (c.nextDueDate) {
        dueCell = c.isOverdue
          ? `Overdue since ${formatShortDate(c.nextDueDate)}`
          : formatShortDate(c.nextDueDate)
      }
      const propTitle = c.unitName && c.unitName !== '—' ? c.unitName : '—'
      const loc = c.unitLocation && c.unitLocation !== '—' ? c.unitLocation : ''
      const propCell = `${escapeHtml(propTitle)}${
        loc ? `<span class="prop-sub">${escapeHtml(loc)}</span>` : ''
      }`
      return `
    <tr>
      <td class="num">${escapeHtml(formatCurrency(amount, currency))}</td>
      <td>${escapeHtml(c.clientName || '—')}</td>
      <td>${propCell}</td>
      <td>${escapeHtml(period)}</td>
      <td>${escapeHtml(dueCell)}</td>
      <td>${escapeHtml(statusLabel(c))}</td>
    </tr>`
    })
    .join('')

  const count = charges?.length ?? 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(organizationName)} — Service charge report</title>
  <style>${DOC_STYLES}${SC_FULL_EXTRA_STYLES}</style>
</head>
<body>
  <div class="top">
    <div class="org">${escapeHtml(organizationName)}</div>
    <div class="meta-date">${escapeHtml(generatedAtLabel)}</div>
  </div>
  <div class="pill">Billing · Service charges</div>
  <h1>Service charge report</h1>
  <div class="subtitle">${escapeHtml(filterSummary || 'All records')}</div>
  <p class="context">
    Summary figures match the totals on your Service Charge page for the filters applied. The table lists every charge row currently shown in the app, including amount, client, property, billing period, next due date, and status.
  </p>
  <div class="summary summary-4">
    <div class="summary-card">
      <div class="label">Total entries</div>
      <div class="value">${Number(s.totalEntries ?? 0).toLocaleString('en-US')}</div>
    </div>
    <div class="summary-card">
      <div class="label">Due this month</div>
      <div class="value value-sm">${escapeHtml(formatCurrency(s.totalDueThisMonth ?? 0, currency))}</div>
    </div>
    <div class="summary-card">
      <div class="label">Due next month</div>
      <div class="value value-sm">${escapeHtml(formatCurrency(s.totalDueNextMonth ?? 0, currency))}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total overdue</div>
      <div class="value value-sm">${escapeHtml(formatCurrency(s.totalOverdue ?? 0, currency))}</div>
    </div>
  </div>
  <div class="section-title">Detailed breakdown</div>
  <p class="context" style="margin-top:-8px;margin-bottom:12px;">${count} charge${count === 1 ? '' : 's'} in this export.</p>
  <table>
    <thead>
      <tr>
        <th class="num">Amount</th>
        <th>Client</th>
        <th>Property</th>
        <th>Period</th>
        <th>Next due</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="6">No charges for the selected filters.</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <div><strong>Iska Homes</strong> · Service charge report</div>
    <div>${escapeHtml(generatedAtLabel)}</div>
  </div>
</body>
</html>`
}

export function openPrintableHtmlDocument(html, title = 'Export') {
  const w = window.open('', '_blank')
  if (!w) {
    // eslint-disable-next-line no-alert
    alert('Please allow pop-ups for this site to export PDF.')
    return false
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  if (title) {
    try {
      w.document.title = title
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => {
    try {
      w.focus()
      w.print()
    } catch {
      /* ignore */
    }
  }, 300)
  return true
}

export function getExportTimestampLabel() {
  return formatLongDate(new Date())
}
