import sgMail from '@/lib/sendgrid'
import { supabaseAdmin } from '@/lib/supabase'
import {
  GRACE_PERIOD_DAYS,
  GRACE_REMINDER_CADENCE_DAYS,
  PRE_EXPIRY_REMINDER_DAYS_BEFORE_END,
  gracePeriodEndFromEndDate
} from '@/lib/subscriptionGracePolicy'
import {
  isStarterPlanPackage,
} from '@/lib/starterSubscriptionPlan'
import { findStarterPackageForUserType } from '@/lib/findStarterPackageForUserType'

export { isStarterPlanPackage as isFreePackageRow } from '@/lib/starterSubscriptionPlan'
export { findStarterPackageForUserType as findFreeMainPackageForUserType } from '@/lib/findStarterPackageForUserType'

const DAY_MS = 86400000

function utcDateOnly(d) {
  const x = new Date(d)
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()))
}

function addUtcDays(dateOnly, n) {
  const d = new Date(dateOnly)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function atNoonUtcFromDateOnly(dateOnly) {
  const d = new Date(dateOnly)
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0)
  )
}

/**
 * Whole calendar days from `now` to `end` in UTC (end date only).
 * @returns {number}
 */
export function calendarDaysUntilEndUtc(endDate, now = new Date()) {
  const end = utcDateOnly(endDate)
  const n = utcDateOnly(now)
  return Math.round((end.getTime() - n.getTime()) / DAY_MS)
}

async function fetchUserEmail(userId, userType) {
  if (userType === 'developer') {
    const { data } = await supabaseAdmin
      .from('developers')
      .select('email, name')
      .eq('developer_id', userId)
      .maybeSingle()
    return { email: data?.email || null, name: data?.name || null }
  }
  if (userType === 'agency') {
    const { data } = await supabaseAdmin
      .from('agencies')
      .select('email, name')
      .eq('agency_id', userId)
      .maybeSingle()
    return { email: data?.email || null, name: data?.name || null }
  }
  if (userType === 'agent') {
    const { data } = await supabaseAdmin
      .from('agents')
      .select('email, name')
      .eq('agent_id', userId)
      .maybeSingle()
    return { email: data?.email || null, name: data?.name || null }
  }
  return { email: null, name: null }
}

async function sendSubscriptionReminderEmail({ to, subject, html, text }) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME || 'Iska Homes'
  if (!fromEmail) throw new Error('SENDGRID_FROM_EMAIL is not configured')
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is not configured')

  await sgMail.send({
    to,
    from: { email: fromEmail, name: fromName },
    subject,
    text: text || subject,
    html:
      html ||
      `<div style="font-family:Segoe UI,Arial,sans-serif;white-space:pre-line;">${String(text || subject).replace(/</g, '&lt;')}</div>`
  })
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveAppBaseUrl() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.FRONTEND_LINK ||
    'https://iskahomes.vercel.app/'
  return base.replace(/\/+$/, '')
}

async function logReminderAttempt({
  stateId,
  subscriptionId,
  userId,
  userType,
  reminderSequence,
  scheduledFor,
  outcome,
  skipReason,
  failureReason,
  recipientEmail,
  templateKey,
  providerMessageId,
  metadata
}) {
  const { error } = await supabaseAdmin.from('subscription_reminder_log').insert({
    subscription_reminder_state_id: stateId,
    subscription_id: subscriptionId,
    user_id: userId,
    user_type: userType,
    reminder_sequence: reminderSequence,
    scheduled_for: scheduledFor,
    attempted_at: new Date().toISOString(),
    outcome,
    skip_reason: skipReason || null,
    failure_reason: failureReason || null,
    channel: 'email',
    recipient_email: recipientEmail || null,
    provider: outcome === 'sent' ? 'sendgrid' : null,
    provider_message_id: providerMessageId || null,
    template_key: templateKey || null,
    metadata: metadata || {}
  })
  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      return { duplicate: true }
    }
    throw error
  }
  return { duplicate: false }
}

async function reminderLogExists(subscriptionId, scheduledForIso) {
  const { data, error } = await supabaseAdmin
    .from('subscription_reminder_log')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .eq('scheduled_for', scheduledForIso)
    .maybeSingle()
  if (error) return true
  return !!data
}

async function nextReminderSequence(subscriptionId) {
  const { data, error } = await supabaseAdmin
    .from('subscription_reminder_log')
    .select('reminder_sequence')
    .eq('subscription_id', subscriptionId)
    .order('reminder_sequence', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data?.reminder_sequence) return 1
  return Number(data.reminder_sequence) + 1
}

async function ensureReminderStateRow(sub) {
  const { data: existing } = await supabaseAdmin
    .from('subscription_reminder_state')
    .select('id, status, reminder_phase, next_reminder_at')
    .eq('subscription_id', sub.id)
    .maybeSingle()
  if (existing) return existing

  const { data: inserted, error } = await supabaseAdmin
    .from('subscription_reminder_state')
    .insert({
      subscription_id: sub.id,
      user_id: sub.user_id,
      user_type: sub.user_type,
      cadence_days: GRACE_REMINDER_CADENCE_DAYS,
      grace_days: GRACE_PERIOD_DAYS,
      reminder_phase: 'before_end',
      status: 'active',
      next_reminder_at: null,
      metadata: {
        subscriptions_type: sub.subscriptions_type,
        package_id: sub.package_id
      }
    })
    .select()
    .single()

  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      const { data: again } = await supabaseAdmin
        .from('subscription_reminder_state')
        .select('id, status, reminder_phase, next_reminder_at')
        .eq('subscription_id', sub.id)
        .maybeSingle()
      return again
    }
    throw error
  }
  return inserted
}

async function repairLegacySevenDayGrace(sub) {
  const end = new Date(sub.end_date)
  const graceEnd = new Date(sub.grace_period_end_date)
  const daysGrace = (graceEnd.getTime() - end.getTime()) / DAY_MS
  if (daysGrace >= 6.5 && daysGrace <= 8.5) {
    const fixed = gracePeriodEndFromEndDate(sub.end_date).toISOString()
    await supabaseAdmin
      .from('subscriptions')
      .update({ grace_period_end_date: fixed, updated_at: new Date().toISOString() })
      .eq('id', sub.id)
    return { ...sub, grace_period_end_date: fixed }
  }
  return sub
}

async function transitionActiveToGrace(sub) {
  const now = new Date()
  const end = new Date(sub.end_date)
  const graceEnd = new Date(sub.grace_period_end_date)
  if (sub.status !== 'active') return { changed: false }
  if (now <= end || now > graceEnd) return { changed: false }

  const policyGraceEnd = gracePeriodEndFromEndDate(sub.end_date).toISOString()

  const { error: upErr } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'grace_period',
      grace_period_end_date: policyGraceEnd,
      updated_at: new Date().toISOString()
    })
    .eq('id', sub.id)
    .eq('status', 'active')

  if (upErr) throw upErr

  await supabaseAdmin.from('subscription_history').insert({
    subscription_id: sub.id,
    user_id: sub.user_id,
    user_type: sub.user_type,
    event_type: 'grace_period_started',
    event_date: new Date().toISOString(),
    from_package_id: sub.package_id,
    to_package_id: sub.package_id,
    from_status: 'active',
    to_status: 'grace_period',
    reason: 'Subscription period ended; grace period started (system)',
    changed_by: 'system',
    metadata: { grace_period_days: GRACE_PERIOD_DAYS }
  })

  const state = await ensureReminderStateRow({ ...sub, status: 'grace_period' })
  const anchor = utcDateOnly(sub.end_date)
  const firstSlot = atNoonUtcFromDateOnly(anchor)
  await supabaseAdmin
    .from('subscription_reminder_state')
    .update({
      reminder_phase: 'in_grace',
      next_reminder_at: firstSlot.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', state.id)

  return { changed: true }
}

function graceReminderSlots(endDate, graceEndDate) {
  const anchor = utcDateOnly(endDate)
  const graceLastDay = utcDateOnly(graceEndDate)
  const slots = []
  for (let i = 0; i < 20; i += 1) {
    const day = addUtcDays(anchor, i * GRACE_REMINDER_CADENCE_DAYS)
    const slotNoon = atNoonUtcFromDateOnly(day)
    if (utcDateOnly(slotNoon).getTime() > graceLastDay.getTime()) break
    slots.push(slotNoon.toISOString())
  }
  return slots
}

/** First grace slot time that is due (<= now) and has no log row yet. */
async function earliestMissedGraceSlotIso(sub, now = new Date()) {
  const slots = graceReminderSlots(sub.end_date, sub.grace_period_end_date)
  const nowMs = now.getTime()
  for (const iso of slots) {
    const t = new Date(iso).getTime()
    if (t > nowMs) continue
    if (await reminderLogExists(sub.id, iso)) continue
    return iso
  }
  return null
}

/** After a paid renewal (new end_date in the future), reopen reminder state. */
async function maybeResetStateAfterRenewal(sub, state) {
  if (!state || state.status !== 'completed') return state
  if (isStarterPlanPackage(sub.subscriptions_package)) return state
  const end = new Date(sub.end_date)
  if (end.getTime() <= Date.now()) return state
  const { data, error } = await supabaseAdmin
    .from('subscription_reminder_state')
    .update({
      status: 'active',
      stopped_reason: null,
      reminder_phase: 'before_end',
      next_reminder_at: null,
      reminders_sent_count: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', state.id)
    .select()
    .single()
  if (error) return state
  return data
}

/**
 * Main daily cron: lifecycle, reminders, demotion/expiry.
 */
export async function runSubscriptionRemindersCron() {
  const summary = {
    transitioned_to_grace: 0,
    pre_expiry_sent: 0,
    grace_reminders_sent: 0,
    demoted_package: 0,
    expired_addon: 0,
    skipped: 0,
    errors: []
  }

  const now = new Date()
  const nowIso = now.toISOString()

  const { data: subsRaw, error: fetchErr } = await supabaseAdmin
    .from('subscriptions')
    .select(
      `
      id,
      user_id,
      user_type,
      package_id,
      subscriptions_type,
      status,
      paid_status,
      start_date,
      end_date,
      grace_period_end_date,
      amount,
      currency,
      duration_months,
      subscriptions_package:package_id (
        id,
        name,
        local_currency_price,
        international_currency_price,
        subscriptions_type,
        user_type,
        ideal_duration,
        duration,
        span
      )
    `
    )
    .in('status', ['active', 'grace_period'])

  if (fetchErr) {
    summary.errors.push(fetchErr.message)
    return summary
  }

  const list = subsRaw || []

  for (const sub of list) {
    const pkg = sub.subscriptions_package
    if (isStarterPlanPackage(pkg)) continue

    try {
      const repaired = await repairLegacySevenDayGrace(sub)
      const t = await transitionActiveToGrace(repaired)
      if (t.changed) summary.transitioned_to_grace += 1
    } catch (e) {
      summary.errors.push(`transition ${sub.id}: ${e.message}`)
    }
  }

  const { data: remindSubs } = await supabaseAdmin
    .from('subscriptions')
    .select(
      `
      id,
      user_id,
      user_type,
      package_id,
      subscriptions_type,
      status,
      end_date,
      grace_period_end_date,
      subscriptions_package:package_id ( id, name, local_currency_price, international_currency_price, subscriptions_type, user_type )
    `
    )
    .in('status', ['active', 'grace_period'])

  for (const sub of remindSubs || []) {
    const pkg = sub.subscriptions_package
    if (isStarterPlanPackage(pkg)) continue

    try {
      let state = await ensureReminderStateRow(sub)
      state = await maybeResetStateAfterRenewal(sub, state)
      if (!state || state.status !== 'active') continue

      if (sub.status === 'active') {
        const days = calendarDaysUntilEndUtc(sub.end_date, now)
        if (days === PRE_EXPIRY_REMINDER_DAYS_BEFORE_END) {
          const endAnchor = utcDateOnly(sub.end_date)
          const preSlot = atNoonUtcFromDateOnly(
            addUtcDays(endAnchor, -PRE_EXPIRY_REMINDER_DAYS_BEFORE_END)
          )
          const scheduledFor = preSlot.toISOString()
          if (await reminderLogExists(sub.id, scheduledFor)) continue

          const seq = await nextReminderSequence(sub.id)
          const contact = await fetchUserEmail(sub.user_id, sub.user_type)
          if (!contact.email) {
            await logReminderAttempt({
              stateId: state.id,
              subscriptionId: sub.id,
              userId: sub.user_id,
              userType: sub.user_type,
              reminderSequence: seq,
              scheduledFor,
              outcome: 'skipped',
              skipReason: 'no_email',
              templateKey: 'subscription_pre_expiry_7d',
              metadata: { subscriptions_type: sub.subscriptions_type }
            })
            summary.skipped += 1
            continue
          }

          const kind =
            sub.subscriptions_type === 'addon' ? 'add-on' : 'subscription'
          const subject = `Your Iska Homes ${kind} renews in 7 days`
          const text = `Hi${contact.name ? ` ${contact.name}` : ''},

Your ${kind} ends on ${new Date(sub.end_date).toUTCString().slice(0, 10)} (UTC). Please renew or update payment to avoid interruption.

Dashboard: ${resolveAppBaseUrl()}/

— Iska Homes`
          const html = `<p>Hi${contact.name ? ` ${escapeHtml(contact.name)}` : ''},</p>
<p>Your <strong>${escapeHtml(kind)}</strong> ends on <strong>${escapeHtml(new Date(sub.end_date).toUTCString().slice(0, 10))}</strong> (UTC).</p>
<p>Please renew or update payment to avoid interruption.</p>
<p><a href="${escapeHtml(resolveAppBaseUrl())}/">Open Iska Homes</a></p>`

          try {
            await sendSubscriptionReminderEmail({
              to: contact.email,
              subject,
              text,
              html
            })
            await logReminderAttempt({
              stateId: state.id,
              subscriptionId: sub.id,
              userId: sub.user_id,
              userType: sub.user_type,
              reminderSequence: seq,
              scheduledFor,
              outcome: 'sent',
              recipientEmail: contact.email,
              templateKey: 'subscription_pre_expiry_7d',
              metadata: { subscriptions_type: sub.subscriptions_type }
            })
            summary.pre_expiry_sent += 1
          } catch (mailErr) {
            await logReminderAttempt({
              stateId: state.id,
              subscriptionId: sub.id,
              userId: sub.user_id,
              userType: sub.user_type,
              reminderSequence: seq,
              scheduledFor,
              outcome: 'failed',
              failureReason: mailErr.message || String(mailErr),
              recipientEmail: contact.email,
              templateKey: 'subscription_pre_expiry_7d',
              metadata: { subscriptions_type: sub.subscriptions_type }
            })
            summary.errors.push(`pre_expiry ${sub.id}: ${mailErr.message}`)
          }
        }
      }

      if (sub.status === 'grace_period') {
        const dueIso = await earliestMissedGraceSlotIso(sub, now)
        if (!dueIso) continue

        const seq = await nextReminderSequence(sub.id)
        const contact = await fetchUserEmail(sub.user_id, sub.user_type)
        if (!contact.email) {
          await logReminderAttempt({
            stateId: state.id,
            subscriptionId: sub.id,
            userId: sub.user_id,
            userType: sub.user_type,
            reminderSequence: seq,
            scheduledFor: dueIso,
            outcome: 'skipped',
            skipReason: 'no_email',
            templateKey: 'subscription_grace_payment_reminder',
            metadata: { subscriptions_type: sub.subscriptions_type }
          })
          summary.skipped += 1
          continue
        }

        const kind =
          sub.subscriptions_type === 'addon' ? 'add-on' : 'subscription'
        const graceEnd = new Date(sub.grace_period_end_date).toUTCString().slice(0, 10)
        const subject = `Action required: your Iska Homes ${kind} grace period`
        const text = `Hi${contact.name ? ` ${contact.name}` : ''},

Your ${kind} billing period has ended. You are in a grace period until ${graceEnd} (UTC). Please complete payment to keep your access.

— Iska Homes`
        const html = `<p>Hi${contact.name ? ` ${escapeHtml(contact.name)}` : ''},</p>
<p>Your <strong>${escapeHtml(kind)}</strong> billing period has ended. Grace ends <strong>${escapeHtml(graceEnd)}</strong> (UTC).</p>
<p>Please complete payment to keep your access.</p>
<p><a href="${escapeHtml(resolveAppBaseUrl())}/">Open Iska Homes</a></p>`

        try {
          await sendSubscriptionReminderEmail({ to: contact.email, subject, text, html })
          await logReminderAttempt({
            stateId: state.id,
            subscriptionId: sub.id,
            userId: sub.user_id,
            userType: sub.user_type,
            reminderSequence: seq,
            scheduledFor: dueIso,
            outcome: 'sent',
            recipientEmail: contact.email,
            templateKey: 'subscription_grace_payment_reminder',
            metadata: { subscriptions_type: sub.subscriptions_type }
          })
          summary.grace_reminders_sent += 1

          const { data: stFresh } = await supabaseAdmin
            .from('subscription_reminder_state')
            .select('reminders_sent_count')
            .eq('id', state.id)
            .maybeSingle()
          const prevCount = Number(stFresh?.reminders_sent_count || 0)

          const slots = graceReminderSlots(sub.end_date, sub.grace_period_end_date)
          const dueIdx = slots.indexOf(dueIso)
          const nextSlot = dueIdx >= 0 && dueIdx < slots.length - 1 ? slots[dueIdx + 1] : null
          await supabaseAdmin
            .from('subscription_reminder_state')
            .update({
              last_reminder_at: new Date().toISOString(),
              reminders_sent_count: prevCount + 1,
              next_reminder_at: nextSlot,
              reminder_phase: 'in_grace',
              updated_at: new Date().toISOString()
            })
            .eq('id', state.id)
        } catch (mailErr) {
          await logReminderAttempt({
            stateId: state.id,
            subscriptionId: sub.id,
            userId: sub.user_id,
            userType: sub.user_type,
            reminderSequence: seq,
            scheduledFor: dueIso,
            outcome: 'failed',
            failureReason: mailErr.message || String(mailErr),
            recipientEmail: contact.email,
            templateKey: 'subscription_grace_payment_reminder',
            metadata: { subscriptions_type: sub.subscriptions_type }
          })
          summary.errors.push(`grace ${sub.id}: ${mailErr.message}`)
        }
      }
    } catch (e) {
      summary.errors.push(`remind ${sub.id}: ${e.message}`)
    }
  }

  const { data: pastGrace } = await supabaseAdmin
    .from('subscriptions')
    .select(
      `
      id,
      user_id,
      user_type,
      package_id,
      subscriptions_type,
      status,
      end_date,
      grace_period_end_date,
      currency,
      amount,
      duration_months,
      subscriptions_package:package_id ( id, name, local_currency_price, international_currency_price, subscriptions_type, user_type, ideal_duration, duration, span )
    `
    )
    .in('status', ['active', 'grace_period'])
    .lt('grace_period_end_date', nowIso)

  for (const sub of pastGrace || []) {
    const pkg = sub.subscriptions_package
    if (isStarterPlanPackage(pkg)) continue

    try {
      await finalizeExpiredSubscription(sub, summary)
    } catch (e) {
      summary.errors.push(`finalize ${sub.id}: ${e.message}`)
    }
  }

  return summary
}

async function markReminderStateCompleted(subscriptionId, nowIso) {
  const { data: state } = await supabaseAdmin
    .from('subscription_reminder_state')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .maybeSingle()
  if (!state?.id) return
  await supabaseAdmin
    .from('subscription_reminder_state')
    .update({
      status: 'completed',
      stopped_reason: 'grace_ended_downgraded',
      reminder_phase: 'completed',
      next_reminder_at: null,
      updated_at: nowIso
    })
    .eq('id', state.id)
}

async function finalizeExpiredSubscription(sub, summary) {
  const nowIso = new Date().toISOString()

  if (sub.subscriptions_type === 'addon') {
    const { error: upErr } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: nowIso,
        paid_status: 'cancelled'
      })
      .eq('id', sub.id)

    if (upErr) throw upErr

    await supabaseAdmin.from('subscription_history').insert({
      subscription_id: sub.id,
      user_id: sub.user_id,
      user_type: sub.user_type,
      event_type: 'expired',
      event_date: nowIso,
      from_package_id: sub.package_id,
      to_package_id: sub.package_id,
      from_status: sub.status,
      to_status: 'expired',
      reason: 'Grace period ended; add-on subscription expired (system)',
      changed_by: 'system',
      metadata: { subscriptions_type: 'addon' }
    })
    await markReminderStateCompleted(sub.id, nowIso)
    summary.expired_addon += 1
    return
  }

  const { data: freePlan, error: fpErr } = await findStarterPackageForUserType(sub.user_type)
  if (fpErr || !freePlan) {
    summary.errors.push(`no free package for ${sub.user_type} (${sub.id})`)
    const { error: exErr } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'expired', updated_at: nowIso })
      .eq('id', sub.id)
    if (exErr) throw exErr
    await markReminderStateCompleted(sub.id, nowIso)
    return
  }

  const durationMonths = isStarterPlanPackage(freePlan) ? 1200 : freePlan.ideal_duration || 1
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + durationMonths)
  const graceEnd = gracePeriodEndFromEndDate(endDate).toISOString()

  const { error: upErr } = await supabaseAdmin
    .from('subscriptions')
    .update({
      package_id: freePlan.id,
      status: 'active',
      paid_status: 'paid',
      amount: 0,
      currency: sub.currency || 'USD',
      duration_months: durationMonths,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      grace_period_end_date: graceEnd,
      activated_at: startDate.toISOString(),
      updated_at: nowIso
    })
    .eq('id', sub.id)

  if (upErr) throw upErr

  await supabaseAdmin.from('subscription_history').insert({
    subscription_id: sub.id,
    user_id: sub.user_id,
    user_type: sub.user_type,
    event_type: 'downgraded',
    event_date: nowIso,
    from_package_id: sub.package_id,
    to_package_id: freePlan.id,
    from_status: sub.status,
    to_status: 'active',
    reason: 'Grace period ended; subscription moved to free tier (system)',
    changed_by: 'system',
    metadata: { auto_downgrade: true, subscriptions_type: 'package' }
  })

  await markReminderStateCompleted(sub.id, nowIso)
  summary.demoted_package += 1
}
