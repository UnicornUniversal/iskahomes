import { VALID_LEAD_ATTRIBUTION_CONTEXTS } from '@/lib/leadAttributionResolve'

function cloneJson(obj) {
  if (!obj || typeof obj !== 'object') return {}
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return {}
  }
}

function sanitizeSourceKey(s) {
  const k = String(s || 'website')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 64)
  return k || 'website'
}

function sanitizeContextKey(c) {
  const k = String(c || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 64)
  return VALID_LEAD_ATTRIBUTION_CONTEXTS.has(k) ? k : null
}

/**
 * Increment distinct-lead source breakdown (mutates a deep-cloned copy of existing).
 * @param {Record<string, unknown> | null | undefined} existing
 * @param {string} leadSource
 * @param {string | null | undefined} leadSourceContext — only applied when leadSource is website
 * @returns {Record<string, { amount: number, percentage: number, context_breakdown?: Record<string, { amount: number, percentage: number }> }>}
 */
export function incrementLeadSourceBreakdown(existing, leadSource, leadSourceContext) {
  const src = sanitizeSourceKey(leadSource)
  const ctx = src === 'website' ? sanitizeContextKey(leadSourceContext) : null

  const b = cloneJson(existing)

  if (!b[src]) {
    b[src] = { amount: 0, percentage: 0, ...(src === 'website' ? { context_breakdown: {} } : {}) }
  }
  const node = b[src]
  node.amount = (Number(node.amount) || 0) + 1

  if (src === 'website' && ctx) {
    if (!node.context_breakdown || typeof node.context_breakdown !== 'object') node.context_breakdown = {}
    const cb = node.context_breakdown
    if (!cb[ctx]) cb[ctx] = { amount: 0, percentage: 0 }
    cb[ctx].amount = (Number(cb[ctx].amount) || 0) + 1
  }

  const total = Object.values(b).reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
  for (const key of Object.keys(b)) {
    const e = b[key]
    const amt = Number(e.amount) || 0
    e.percentage = total > 0 ? Math.round((amt / total) * 10000) / 100 : 0
    if (key === 'website' && e.context_breakdown && typeof e.context_breakdown === 'object') {
      const w = Number(e.amount) || 0
      for (const ck of Object.keys(e.context_breakdown)) {
        const cnode = e.context_breakdown[ck]
        const camt = Number(cnode.amount) || 0
        cnode.percentage = w > 0 ? Math.round((camt / w) * 10000) / 100 : 0
      }
    }
  }

  return b
}
