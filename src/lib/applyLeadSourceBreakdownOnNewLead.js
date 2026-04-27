import { incrementLeadSourceBreakdown } from '@/lib/leadSourceBreakdownAggregation'

/**
 * Upserts hourly lead_source_breakdown on listing_analytics / user_analytics when those rows already exist.
 * Cumulative listing + lister breakdowns are updated in /api/leads/create alongside other counters.
 */
export async function applyLeadSourceBreakdownHourlyBuckets(supabaseAdmin, {
  lead_source,
  lead_source_context,
  context_type,
  listing_id,
  lister_id,
  lister_type,
  date,
  hour,
}) {
  if (!lister_id || !lister_type || date == null || hour == null) return

  try {
    if (context_type === 'listing' && listing_id) {
      const { data: la, error: laErr } = await supabaseAdmin
        .from('listing_analytics')
        .select('lead_source_breakdown')
        .eq('listing_id', listing_id)
        .eq('date', date)
        .eq('hour', hour)
        .maybeSingle()

      if (!laErr && la) {
        const merged = incrementLeadSourceBreakdown(la.lead_source_breakdown, lead_source, lead_source_context)
        await supabaseAdmin
          .from('listing_analytics')
          .update({ lead_source_breakdown: merged })
          .match({ listing_id: listing_id, date, hour })
      }
    }

    const { data: ua, error: uaErr } = await supabaseAdmin
      .from('user_analytics')
      .select('lead_source_breakdown')
      .eq('user_id', lister_id)
      .eq('user_type', lister_type)
      .eq('date', date)
      .eq('hour', hour)
      .maybeSingle()

    if (!uaErr && ua) {
      const mergedUa = incrementLeadSourceBreakdown(ua.lead_source_breakdown, lead_source, lead_source_context)
      await supabaseAdmin
        .from('user_analytics')
        .update({ lead_source_breakdown: mergedUa })
        .match({ user_id: lister_id, user_type: lister_type, date, hour })
    }
  } catch (e) {
    console.error('applyLeadSourceBreakdownHourlyBuckets:', e)
  }
}
