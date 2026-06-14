/**
 * Resolve leads_pipeline owner scope (matches leads.lister_id + lister_type).
 */
export function getLeadsPipelineOwner(userInfo) {
  if (!userInfo) return null

  if (userInfo.user_type === 'developer') {
    return {
      user_id: userInfo.developer_id || userInfo.user_id,
      user_type: 'developer',
    }
  }

  if (userInfo.user_type === 'agency') {
    return {
      user_id: userInfo.agency_id || userInfo.user_id,
      user_type: 'agency',
    }
  }

  if (userInfo.user_type === 'agent') {
    return {
      user_id: userInfo.agent_id || userInfo.user_id,
      user_type: 'agent',
    }
  }

  if (userInfo.user_type === 'team_member') {
    if (userInfo.organization_type === 'developer' && userInfo.developer_id) {
      return { user_id: userInfo.developer_id, user_type: 'developer' }
    }
    if (userInfo.organization_type === 'agency' && userInfo.agency_id) {
      return { user_id: userInfo.agency_id, user_type: 'agency' }
    }
  }

  return null
}

/** System status keys — always first (New) and last (Unspecified) in the board and dropdowns */
export const PIPELINE_STATUS_NEW = 'new'
export const PIPELINE_STATUS_UNSPECIFIED = 'unspecified'

export const SYSTEM_PIPELINE_STAGE_NEW = {
  status: PIPELINE_STATUS_NEW,
  value: 'New',
  sort_order: -1,
  is_system: true,
}

export const SYSTEM_PIPELINE_STAGE_UNSPECIFIED = {
  status: PIPELINE_STATUS_UNSPECIFIED,
  value: 'Unspecified',
  sort_order: 99999,
  is_system: true,
}

/** Default middle stages (seeded to DB); New and Unspecified are not stored here */
export const DEFAULT_PIPELINE_STAGES = [
  { status: 'contacted', value: 'Contacted', sort_order: 1 },
  { status: 'scheduled', value: 'Scheduled', sort_order: 2 },
  { status: 'responded', value: 'Responded', sort_order: 3 },
  { status: 'closed', value: 'Closed', sort_order: 4 },
  { status: 'cold_lead', value: 'Cold Lead', sort_order: 5 },
  { status: 'abandoned', value: 'Abandoned', sort_order: 6 },
]

export function isSystemPipelineStatus(status) {
  return status === PIPELINE_STATUS_NEW || status === PIPELINE_STATUS_UNSPECIFIED
}

/** Middle stages only — excludes New and Unspecified from DB rows */
export function getMiddlePipelineStages(stages) {
  const list =
    stages?.length > 0
      ? [...stages]
      : DEFAULT_PIPELINE_STAGES.map((s, i) => ({ ...s, id: s.status, sort_order: i }))

  return list
    .filter((s) => !isSystemPipelineStatus(s.status))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

/** Dropdown / filter options: New, custom stages, Unspecified */
export function buildPipelineStatusOptions(stages) {
  const middle = getMiddlePipelineStages(stages)
  return [
    { value: PIPELINE_STATUS_NEW, label: SYSTEM_PIPELINE_STAGE_NEW.value },
    ...middle.map((s) => ({ value: s.status, label: s.value })),
    { value: PIPELINE_STATUS_UNSPECIFIED, label: SYSTEM_PIPELINE_STAGE_UNSPECIFIED.value },
  ]
}

/** Map stored status to a valid dropdown value */
export function resolveLeadStatusForPipeline(status, stages) {
  const key = (status || PIPELINE_STATUS_NEW).toLowerCase()
  if (key === PIPELINE_STATUS_NEW) return PIPELINE_STATUS_NEW

  const middleStatuses = new Set(getMiddlePipelineStages(stages).map((s) => s.status))
  if (middleStatuses.has(key)) return key

  return PIPELINE_STATUS_UNSPECIFIED
}

/** Label for display; unknown keys show as Unspecified */
export function getPipelineStatusLabel(statusKey, stages) {
  if (!statusKey) return SYSTEM_PIPELINE_STAGE_UNSPECIFIED.value
  if (statusKey === PIPELINE_STATUS_NEW) return SYSTEM_PIPELINE_STAGE_NEW.value
  if (statusKey === PIPELINE_STATUS_UNSPECIFIED) return SYSTEM_PIPELINE_STAGE_UNSPECIFIED.value

  const middle = getMiddlePipelineStages(stages)
  const match = middle.find((s) => s.status === statusKey)
  if (match) return match.value

  return SYSTEM_PIPELINE_STAGE_UNSPECIFIED.value
}

/** Kanban columns: New | middle stages | Unspecified */
export function buildPipelineColumns(stages, leads) {
  const middle = getMiddlePipelineStages(stages)
  const middleStatuses = new Set(middle.map((s) => s.status))

  const columns = [
    { id: PIPELINE_STATUS_NEW, ...SYSTEM_PIPELINE_STAGE_NEW, leads: [] },
    ...middle.map((s) => ({
      ...s,
      id: s.id || s.status,
      leads: [],
    })),
    { id: PIPELINE_STATUS_UNSPECIFIED, ...SYSTEM_PIPELINE_STAGE_UNSPECIFIED, leads: [] },
  ]

  const grouped = {}
  columns.forEach((col) => {
    grouped[col.status] = []
  })

  ;(leads || []).forEach((lead) => {
    const key = lead.status || PIPELINE_STATUS_NEW
    if (key === PIPELINE_STATUS_NEW) {
      grouped[PIPELINE_STATUS_NEW].push(lead)
    } else if (middleStatuses.has(key)) {
      grouped[key].push(lead)
    } else {
      grouped[PIPELINE_STATUS_UNSPECIFIED].push(lead)
    }
  })

  return columns.map((col) => ({
    ...col,
    leads: grouped[col.status] || [],
  }))
}

/** Stages treated as closed / lost for analytics rollups */
export const PIPELINE_CLOSED_STATUS_KEYS = new Set(['closed'])
export const PIPELINE_LOST_STATUS_KEYS = new Set(['cold_lead', 'abandoned'])

/** Ordered stages for charts: New → custom middle → Unspecified */
export function buildAnalyticsStageOrder(stages) {
  const middle = getMiddlePipelineStages(stages)
  return [
    { status: PIPELINE_STATUS_NEW, label: SYSTEM_PIPELINE_STAGE_NEW.value },
    ...middle.map((s) => ({
      status: s.status,
      label: s.value || s.status,
    })),
    { status: PIPELINE_STATUS_UNSPECIFIED, label: SYSTEM_PIPELINE_STAGE_UNSPECIFIED.value },
  ]
}

export function buildStatusLabelMap(stages) {
  const map = {}
  buildAnalyticsStageOrder(stages).forEach((s) => {
    map[s.status] = s.label
  })
  return map
}

/** Empty distribution keyed to the lister's configured pipeline */
export function createEmptyStatusDistribution(stages) {
  const dist = {}
  buildAnalyticsStageOrder(stages).forEach((s) => {
    dist[s.status] = 0
  })
  return dist
}

/**
 * Roll up counts into New / In progress / Closed / Lost / Unspecified using configured middle stages.
 * @param {Record<string, number>} statusDistribution
 */
export function computePipelineHealthFromDistribution(statusDistribution, stages) {
  const middleStatuses = new Set(getMiddlePipelineStages(stages).map((s) => s.status))
  const summary = {
    new: statusDistribution[PIPELINE_STATUS_NEW] || 0,
    inProgress: 0,
    closed: 0,
    lost: 0,
    unspecified: statusDistribution[PIPELINE_STATUS_UNSPECIFIED] || 0,
  }

  Object.entries(statusDistribution).forEach(([key, count]) => {
    if (key === PIPELINE_STATUS_NEW || key === PIPELINE_STATUS_UNSPECIFIED) return
    if (PIPELINE_CLOSED_STATUS_KEYS.has(key)) summary.closed += count
    else if (PIPELINE_LOST_STATUS_KEYS.has(key)) summary.lost += count
    else if (middleStatuses.has(key)) summary.inProgress += count
    else summary.unspecified += count
  })

  return summary
}

/**
 * Funnel steps along the configured middle pipeline (same conversion logic as legacy API).
 * @param {Array<{ statuses: string[], status: string }>} lifecycleData
 */
export function computePipelineFunnelSteps(lifecycleData, stages) {
  const middle = getMiddlePipelineStages(stages)
  if (middle.length === 0) return []

  const chain = [{ from: PIPELINE_STATUS_NEW, to: middle[0].status, label: `New → ${middle[0].value}` }]

  for (let i = 0; i < middle.length - 1; i++) {
    chain.push({
      from: middle[i].status,
      to: middle[i + 1].status,
      label: `${middle[i].value} → ${middle[i + 1].value}`,
    })
  }

  chain.push({
    from: middle[middle.length - 1].status,
    to: 'closed',
    label: `${middle[middle.length - 1].value} → Closed`,
  })

  return chain.map(({ from, to, label }) => {
    let total = 0
    let converted = 0
    lifecycleData.forEach((lead) => {
      const statuses = lead.statuses || []
      if (statuses.includes(from) && statuses.includes(to)) {
        total++
        if (PIPELINE_CLOSED_STATUS_KEYS.has(lead.status)) converted++
      }
    })
    const rate = total > 0 ? (converted / total) * 100 : 0
    return {
      key: `${from}_to_${to}`,
      label,
      rate: parseFloat(rate.toFixed(2)),
      total,
      converted,
    }
  })
}

/** Convert display label to machine status key */
export function toPipelineStatusKey(label) {
  if (!label || typeof label !== 'string') return ''
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}
