export const CHARGEABLE_ANALYTICS_RANGES = [
  { key: 'all', label: 'All entries' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
  { key: 'ytd', label: 'This year' }
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatChargeableMoney(amount, currency = 'GHS') {
  const rounded = Math.round(Number(amount) || 0)
  return `${currency} ${rounded.toLocaleString('en-US')}`
}

export function monthlyEquivalent(amount, intervalValue, intervalUnit) {
  const value = Number(intervalValue) || 1
  const amt = Number(amount) || 0
  if (value <= 0) return amt
  if (intervalUnit === 'day') return (amt / value) * 30
  if (intervalUnit === 'week') return (amt / value) * (52 / 12)
  if (intervalUnit === 'year') return amt / (value * 12)
  return amt / value
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function iso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateOnly(value) {
  if (!value) return null
  const raw = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

function parseDay(value) {
  const raw = dateOnly(value)
  if (!raw) return null
  const d = new Date(`${raw}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function pct(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function resolveChargeableAnalyticsRange(range, today = new Date()) {
  const end = startOfDay(today)
  const to = iso(end)
  if (range === '90d') {
    return { key: '90d', label: 'Last 90 days', from: iso(addDays(end, -89)), to }
  }
  if (range === '12m') {
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
    return { key: '12m', label: 'Last 12 months', from: iso(start), to }
  }
  if (range === 'ytd') {
    return { key: 'ytd', label: 'This year', from: `${end.getFullYear()}-01-01`, to }
  }
  return { key: 'all', label: 'All entries', from: null, to: null }
}

function anchorDate(entry) {
  return dateOnly(entry.nextDueDate) || dateOnly(entry.periodStart) || dateOnly(entry.createdAt)
}

function inRange(entry, bounds) {
  if (!bounds.from && !bounds.to) return true
  const anchor = anchorDate(entry)
  if (!anchor) return false
  if (bounds.from && anchor < bounds.from) return false
  if (bounds.to && anchor > bounds.to) return false
  return true
}

function isCollected(entry) {
  return String(entry.status || '').toLowerCase() === 'paid'
    || String(entry.nextDueStatus || '').toLowerCase() === 'paid'
}

function reminderState(status) {
  const value = String(status || '').toLowerCase()
  if (!value || value === 'cancelled' || value === 'canceled') return 'cancelled'
  if (value.includes('fail') || value === 'error') return 'failed'
  if (['sent', 'delivered', 'completed', 'success'].includes(value)) return 'sent'
  if (['pending', 'queued', 'scheduled'].includes(value)) return 'pending'
  return 'other'
}

function agingKey(days) {
  if (days <= 7) return '1-7'
  if (days <= 30) return '8-30'
  if (days <= 60) return '31-60'
  return '61+'
}

function chartMonths(bounds, today) {
  const end = startOfDay(today)
  let start
  if (bounds.from) {
    const from = parseDay(bounds.from) || end
    start = new Date(from.getFullYear(), from.getMonth(), 1)
  } else {
    start = new Date(end.getFullYear(), end.getMonth() - 5, 1)
  }

  const months = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= last && months.length < 12) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: `${MONTHS[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`, billed: 0, collected: 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

function emptyPayload(bounds, currency) {
  return {
    range: bounds,
    currency,
    empty: true,
    totals: {
      entries: 0,
      paidCount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      outstandingCount: 0,
      stillDueAmount: 0,
      stillDueCount: 0,
      overdueAmount: 0,
      overdueCount: 0,
      dueSoonAmount: 0,
      dueSoonCount: 0,
      collectionRate: 0,
      onTimeRate: 0,
      avgDaysLate: 0,
      monthlyRunRate: 0,
      unassignedOverdueCount: 0,
      longestOverdueDays: 0,
      avgOverdueDays: 0
    },
    statusMix: [],
    aging: [],
    months: chartMonths(bounds, new Date()),
    byType: [],
    topOverdue: [],
    topClients: [],
    reminders: { failed: 0, pending: 0, sent: 0, unpaidWithFailed: 0 },
    duplicateOpenGroups: 0,
    decisions: [{
      severity: 'info',
      title: 'No chargeable entries in this range',
      detail: 'Adding a chargeable type to a unit does not open a cycle. Create an entry from Charges, then this page can show what has been collected and what to chase.'
    }]
  }
}

export function buildChargeableAnalytics(entries, { currency = 'GHS', types = [], today = new Date(), range = 'all' } = {}) {
  const now = startOfDay(today)
  const bounds = resolveChargeableAnalyticsRange(range, now)
  const filtered = (entries || []).filter((entry) => inRange(entry, bounds))
  if (filtered.length === 0) return emptyPayload(bounds, currency)

  const money = (amount) => formatChargeableMoney(amount, currency)
  const horizon = addDays(now, 7)
  const todayIso = iso(now)

  const totals = {
    entries: filtered.length,
    paidCount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    outstandingCount: 0,
    stillDueAmount: 0,
    stillDueCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    dueSoonAmount: 0,
    dueSoonCount: 0,
    collectionRate: 0,
    onTimeRate: 0,
    avgDaysLate: 0,
    monthlyRunRate: 0,
    unassignedOverdueCount: 0,
    longestOverdueDays: 0,
    avgOverdueDays: 0
  }

  const status = {
    collected: { key: 'collected', label: 'Collected', count: 0, amount: 0 },
    overdue: { key: 'overdue', label: 'Overdue', count: 0, amount: 0 },
    dueSoon: { key: 'dueSoon', label: 'Due in 7 days', count: 0, amount: 0 },
    later: { key: 'later', label: 'Due later', count: 0, amount: 0 }
  }

  const agingMap = {
    '1-7': { key: '1-7', label: '1–7 days', count: 0, amount: 0 },
    '8-30': { key: '8-30', label: '8–30 days', count: 0, amount: 0 },
    '31-60': { key: '31-60', label: '31–60 days', count: 0, amount: 0 },
    '61+': { key: '61+', label: '61+ days', count: 0, amount: 0 }
  }

  const months = chartMonths(bounds, now)
  const monthIndex = Object.fromEntries(months.map((month, index) => [month.key, index]))
  const typeMap = new Map()
  const clientMap = new Map()
  const openGroups = new Map()
  const reminders = { failed: 0, pending: 0, sent: 0, unpaidWithFailed: 0 }
  const overdueRows = []
  let paidWithDates = 0
  let onTimeCount = 0
  let lateDaySum = 0
  let overdueDaySum = 0

  const knownTypes = new Map((types || []).filter((type) => type?.id).map((type) => [type.id, type.name || 'Chargeable']))

  filtered.forEach((entry) => {
    const amount = Number(entry.amount) || 0
    const collected = isCollected(entry)
    const typeId = entry.chargeableType || 'unknown'
    const typeName = entry.typeName || knownTypes.get(typeId) || 'Chargeable'
    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        typeId,
        name: typeName,
        count: 0,
        collected: 0,
        collectedCount: 0,
        outstanding: 0,
        overdue: 0,
        overdueCount: 0,
        monthlyRunRate: 0
      })
    }
    const typeRow = typeMap.get(typeId)
    typeRow.count += 1

    const anchor = anchorDate(entry)
    if (anchor && monthIndex[anchor.slice(0, 7)] != null) {
      months[monthIndex[anchor.slice(0, 7)]].billed += amount
    }

    if (collected) {
      totals.paidCount += 1
      totals.paidAmount += amount
      status.collected.count += 1
      status.collected.amount += amount
      typeRow.collected += amount
      typeRow.collectedCount += 1
      const paidOn = dateOnly(entry.paidAt) || anchor
      if (paidOn && monthIndex[paidOn.slice(0, 7)] != null) {
        months[monthIndex[paidOn.slice(0, 7)]].collected += amount
      }
      const due = parseDay(entry.nextDueDate)
      const paid = parseDay(entry.paidAt)
      if (due && paid) {
        paidWithDates += 1
        const late = Math.round((paid.getTime() - due.getTime()) / 86400000)
        if (late <= 0) onTimeCount += 1
        else lateDaySum += late
      }
      return
    }

    totals.outstandingCount += 1
    totals.outstandingAmount += amount
    totals.monthlyRunRate += monthlyEquivalent(amount, entry.intervalValue, entry.intervalUnit)
    typeRow.outstanding += amount
    typeRow.monthlyRunRate += monthlyEquivalent(amount, entry.intervalValue, entry.intervalUnit)

    const groupKey = `${entry.unitId || 'unit'}:${typeId}`
    openGroups.set(groupKey, (openGroups.get(groupKey) || 0) + 1)

    const due = parseDay(entry.nextDueDate)
    const overdue = String(entry.nextDueStatus || '').toLowerCase() === 'overdue' || entry.isOverdue
    if (overdue) {
      const days = Number(entry.overdueTime) || (due ? Math.max(0, Math.round((now.getTime() - due.getTime()) / 86400000)) : 0)
      totals.overdueCount += 1
      totals.overdueAmount += amount
      totals.longestOverdueDays = Math.max(totals.longestOverdueDays, days)
      overdueDaySum += days
      status.overdue.count += 1
      status.overdue.amount += amount
      typeRow.overdue += amount
      typeRow.overdueCount += 1
      const bucket = agingMap[agingKey(days)]
      bucket.count += 1
      bucket.amount += amount
      const unassigned = !entry.clientId || entry.clientName === 'Unassigned'
      if (unassigned) totals.unassignedOverdueCount += 1
      overdueRows.push({
        id: entry.id,
        unitName: entry.unitName || 'Unit',
        clientName: unassigned ? 'Unassigned' : entry.clientName,
        clientId: entry.clientId || null,
        typeName,
        amount,
        days,
        nextDueDate: dateOnly(entry.nextDueDate)
      })

      const clientKey = unassigned ? 'unassigned' : entry.clientId
      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          clientId: unassigned ? null : entry.clientId,
          clientName: unassigned ? 'Unassigned' : entry.clientName,
          overdueAmount: 0,
          overdueCount: 0
        })
      }
      const client = clientMap.get(clientKey)
      client.overdueAmount += amount
      client.overdueCount += 1
    } else if (due && due >= now && due <= horizon) {
      totals.dueSoonCount += 1
      totals.dueSoonAmount += amount
      status.dueSoon.count += 1
      status.dueSoon.amount += amount
    } else {
      status.later.count += 1
      status.later.amount += amount
    }

    const sms = reminderState(entry.smsNotificationStatus)
    const email = reminderState(entry.emailNotificationStatus)
    const states = [sms, email]
    if (states.includes('failed')) {
      reminders.failed += 1
      reminders.unpaidWithFailed += 1
    } else if (states.includes('pending')) reminders.pending += 1
    else if (states.includes('sent')) reminders.sent += 1
  })

  knownTypes.forEach((name, id) => {
    if (!typeMap.has(id)) {
      typeMap.set(id, {
        typeId: id,
        name,
        count: 0,
        collected: 0,
        collectedCount: 0,
        outstanding: 0,
        overdue: 0,
        overdueCount: 0,
        monthlyRunRate: 0
      })
    }
  })

  totals.stillDueAmount = Math.max(0, totals.outstandingAmount - totals.overdueAmount)
  totals.stillDueCount = Math.max(0, totals.outstandingCount - totals.overdueCount)
  const book = totals.paidAmount + totals.outstandingAmount
  totals.collectionRate = pct(totals.paidAmount, book)
  totals.onTimeRate = pct(onTimeCount, paidWithDates)
  totals.avgDaysLate = paidWithDates > 0 ? Math.round((lateDaySum / paidWithDates) * 10) / 10 : 0
  totals.avgOverdueDays = totals.overdueCount > 0 ? Math.round(overdueDaySum / totals.overdueCount) : 0

  const roundTotals = ['paidAmount', 'outstandingAmount', 'stillDueAmount', 'overdueAmount', 'dueSoonAmount', 'monthlyRunRate']
  roundTotals.forEach((key) => { totals[key] = roundMoney(totals[key]) })
  months.forEach((month) => {
    month.billed = roundMoney(month.billed)
    month.collected = roundMoney(month.collected)
  })

  const byType = [...typeMap.values()]
    .map((row) => ({
      ...row,
      collected: roundMoney(row.collected),
      outstanding: roundMoney(row.outstanding),
      overdue: roundMoney(row.overdue),
      monthlyRunRate: roundMoney(row.monthlyRunRate),
      collectionRate: pct(row.collected, row.collected + row.outstanding)
    }))
    .sort((a, b) => (b.overdue - a.overdue) || (b.outstanding - a.outstanding) || b.count - a.count)

  const topOverdue = overdueRows
    .sort((a, b) => b.days - a.days || b.amount - a.amount)
    .slice(0, 8)
    .map((row) => ({ ...row, amount: roundMoney(row.amount) }))

  const topClients = [...clientMap.values()]
    .map((row) => ({
      ...row,
      overdueAmount: roundMoney(row.overdueAmount),
      share: pct(row.overdueAmount, totals.overdueAmount)
    }))
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 5)

  const duplicateOpenGroups = [...openGroups.values()].filter((count) => count > 1).length
  const unusedTypes = byType.filter((row) => row.count === 0)

  const decisions = []
  if (totals.overdueCount > 0 && (pct(totals.overdueAmount, book) >= 15 || totals.overdueCount >= 3)) {
    decisions.push({
      severity: 'high',
      title: `Collect ${money(totals.overdueAmount)} before opening more cycles`,
      detail: `${totals.overdueCount} open cycles are past due, averaging ${totals.avgOverdueDays} days late. The longest has been late for ${totals.longestOverdueDays} days. Work the list at the bottom of this page first.`
    })
  }
  const severelyLate = agingMap['61+']
  if (severelyLate.count > 0) {
    decisions.push({
      severity: 'high',
      title: `Escalate ${severelyLate.count} ${severelyLate.count === 1 ? 'cycle' : 'cycles'} more than 60 days late`,
      detail: `${money(severelyLate.amount)} is old enough that another reminder is unlikely to close it. Call or visit those units this week.`
    })
  }
  if (totals.unassignedOverdueCount > 0) {
    decisions.push({
      severity: 'high',
      title: `Assign a client on ${totals.unassignedOverdueCount} overdue ${totals.unassignedOverdueCount === 1 ? 'unit' : 'units'}`,
      detail: 'Those cycles have no occupant, so SMS and email reminders have nobody to reach.'
    })
  }
  if (duplicateOpenGroups > 0) {
    decisions.push({
      severity: 'high',
      title: `Close ${duplicateOpenGroups} duplicate open ${duplicateOpenGroups === 1 ? 'cycle' : 'cycles'}`,
      detail: 'The same unit and chargeable type has more than one unpaid cycle. The older one should be marked paid or removed so the client is not billed twice.'
    })
  }

  const namedClient = topClients.find((client) => client.clientId && client.share >= 40)
  if (namedClient) {
    decisions.push({
      severity: 'medium',
      title: `Call ${namedClient.clientName} first`,
      detail: `They hold ${namedClient.share}% of overdue money (${money(namedClient.overdueAmount)} across ${namedClient.overdueCount} ${namedClient.overdueCount === 1 ? 'cycle' : 'cycles'}). One conversation moves the book more than chasing every small balance.`
    })
  }

  const comparableTypes = byType.filter((row) => row.count >= 3)
  if (comparableTypes.length >= 2) {
    const worst = [...comparableTypes].sort((a, b) => a.collectionRate - b.collectionRate)[0]
    const best = [...comparableTypes].sort((a, b) => b.collectionRate - a.collectionRate)[0]
    if (best.collectionRate - worst.collectionRate >= 20 && worst.collectionRate < 70) {
      decisions.push({
        severity: 'medium',
        title: `Review how ${worst.name} is collected`,
        detail: `${worst.name} is collected on ${worst.collectionRate}% of its billed amount. ${best.name} is at ${best.collectionRate}%. Use the stronger follow-up on the weaker type.`
      })
    }
  }

  if (totals.dueSoonCount > 0 && (totals.dueSoonCount >= 3 || totals.dueSoonAmount >= totals.monthlyRunRate * 0.25)) {
    decisions.push({
      severity: 'medium',
      title: `${money(totals.dueSoonAmount)} comes due in the next 7 days`,
      detail: `${totals.dueSoonCount} cycles land between today and ${iso(horizon)}. Confirm reminders are still scheduled before those dates, especially where a previous cycle was paid late.`
    })
  }

  if (reminders.unpaidWithFailed > 0) {
    decisions.push({
      severity: 'medium',
      title: `Fix reminders on ${reminders.unpaidWithFailed} unpaid ${reminders.unpaidWithFailed === 1 ? 'cycle' : 'cycles'}`,
      detail: 'SMS or email delivery failed on open cycles. Those clients may not know the charge is due. Resend before treating the balance as a collections problem.'
    })
  }

  if (paidWithDates >= 4 && totals.onTimeRate < 70) {
    decisions.push({
      severity: 'medium',
      title: 'Send reminders earlier',
      detail: `Only ${totals.onTimeRate}% of paid cycles were paid by the due date. Payments arrive ${totals.avgDaysLate} days late on average. Move the reminder a few days forward rather than waiting until the due date.`
    })
  }

  if (unusedTypes.length > 0) {
    const names = unusedTypes.slice(0, 3).map((row) => row.name).join(', ')
    const extra = unusedTypes.length > 3 ? `, and ${unusedTypes.length - 3} more,` : ''
    decisions.push({
      severity: 'info',
      title: `${unusedTypes.length} ${unusedTypes.length === 1 ? 'type has' : 'types have'} never been billed`,
      detail: unusedTypes.length === 1
        ? `${names} has no entries in this range. Open a cycle if it should be charged, or remove it so the book stays accurate.`
        : `${names}${extra} have no entries in this range. Open a cycle if they should be charged, or remove them so the book stays accurate.`
    })
  }

  const urgent = decisions.filter((item) => item.severity === 'high' || item.severity === 'medium')
  if (urgent.length === 0) {
    decisions.unshift({
      severity: 'good',
      title: 'Collections are in good shape',
      detail: totals.entries === totals.paidCount
        ? `Every cycle in this range is paid (${money(totals.paidAmount)}). Keep opening the next cycle when a period ends.`
        : `${totals.collectionRate}% of billed money is collected, and nothing here needs an escalation. ${money(totals.stillDueAmount)} is still due but not late. Keep the current reminder schedule.`
    })
  }

  const rank = { high: 0, medium: 1, good: 2, info: 3 }
  const ordered = decisions
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 5)

  return {
    range: bounds,
    currency,
    empty: false,
    asOf: todayIso,
    totals,
    statusMix: Object.values(status).map((row) => ({ ...row, amount: roundMoney(row.amount) })),
    aging: Object.values(agingMap).map((row) => ({ ...row, amount: roundMoney(row.amount) })),
    months,
    byType,
    topOverdue,
    topClients,
    reminders,
    duplicateOpenGroups,
    decisions: ordered
  }
}
