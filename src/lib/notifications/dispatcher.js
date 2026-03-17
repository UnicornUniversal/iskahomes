import sgMail from '@/lib/sendgrid'
import { supabaseAdmin } from '@/lib/supabase'
import { getNotificationChannelsForType, getUserContact } from './preferences'
import {
  getNotificationRecord,
  markNotificationAttempt,
  markNotificationFailed,
  markNotificationSent
} from './records'
import { NOTIFICATION_STATUS, NOTIFICATION_TYPES } from './constants'

function formatLocation(entity) {
  if (!entity) return null
  const parts = [entity.town, entity.city, entity.state, entity.country].filter(Boolean)
  if (parts.length > 0) return parts.join(', ')
  return entity.full_address || null
}

function formatDateTime(dateValue, timeValue = null) {
  if (!dateValue) return 'Not specified'
  const iso = timeValue ? `${dateValue}T${timeValue}` : dateValue
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return `${dateValue}${timeValue ? ` ${timeValue}` : ''}`
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function extractListingIdFromGroupedKey(groupedLeadKey) {
  if (!groupedLeadKey || typeof groupedLeadKey !== 'string') return null
  const parts = groupedLeadKey.split('_')
  const listingId = parts[parts.length - 1]
  if (!listingId || listingId === 'null') return null
  return listingId
}

async function fetchListingContext(listingId) {
  if (!listingId) return null
  const { data } = await supabaseAdmin
    .from('listings')
    .select('id, title, town, city, state, country, full_address')
    .eq('id', listingId)
    .maybeSingle()
  return data || null
}

async function fetchPropertySeekerContext(seekerId) {
  if (!seekerId) return null
  const { data } = await supabaseAdmin
    .from('property_seekers')
    .select('id, full_name, name')
    .eq('id', seekerId)
    .maybeSingle()
  return data || null
}

async function fetchClientContext(clientId) {
  if (!clientId) return null
  const { data } = await supabaseAdmin
    .from('clients')
    .select('id, name, full_name')
    .eq('id', clientId)
    .maybeSingle()
  return data || null
}

async function buildNotificationMessage(notificationType, record) {
  if (notificationType === NOTIFICATION_TYPES.REMINDER) {
    let listing = null
    let seeker = null

    if (record.lead_id) {
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, listing_id, seeker_id')
        .eq('id', record.lead_id)
        .maybeSingle()

      if (lead?.listing_id) {
        listing = await fetchListingContext(lead.listing_id)
      }
      if (lead?.seeker_id) {
        seeker = await fetchPropertySeekerContext(lead.seeker_id)
      }
    }

    if (!listing && record.grouped_lead_key) {
      listing = await fetchListingContext(extractListingIdFromGroupedKey(record.grouped_lead_key))
    }

    const propertyTitle = listing?.title || 'the property'
    const propertyLocation = formatLocation(listing)
    const seekerName = seeker?.full_name || seeker?.name || 'Unknown seeker'
    const dueAt = formatDateTime(record.reminder_date, record.reminder_time)

    return {
      subject: `Lead Reminder: ${propertyTitle}`,
      text: [
        `Reminder: ${record.note_text || 'You have a reminder due now.'}`,
        `Seeker: ${seekerName}`,
        `Property: ${propertyTitle}`,
        propertyLocation ? `Location: ${propertyLocation}` : null,
        `Due: ${dueAt}`
      ].filter(Boolean).join('\n')
    }
  }

  if (notificationType === NOTIFICATION_TYPES.APPOINTMENT) {
    const listing = await fetchListingContext(record.listing_id)
    const propertyTitle = listing?.title || 'the property'
    const propertyLocation = formatLocation(listing)
    const dueAt = formatDateTime(record.appointment_date, record.appointment_time)

    return {
      subject: `Appointment: ${propertyTitle}`,
      text: [
        `Client: ${record.client_name || 'a client'}`,
        `Property: ${propertyTitle}`,
        propertyLocation ? `Location: ${propertyLocation}` : null,
        `Date/Time: ${dueAt}`,
        `Type: ${record.appointment_type || 'in-person'}`,
        record.meeting_location ? `Meeting Location: ${record.meeting_location}` : null,
        record.notes ? `Notes: ${record.notes}` : null
      ].filter(Boolean).join('\n')
    }
  }

  if (notificationType === NOTIFICATION_TYPES.SERVICE_CHARGE) {
    const listing = await fetchListingContext(record.unit_id)
    const client = await fetchClientContext(record.client_id)
    const propertyTitle = listing?.title || 'the property'
    const propertyLocation = formatLocation(listing)
    const clientName = client?.name || client?.full_name || 'Unknown client'
    const dueAt = formatDateTime(record.next_due_date)

    return {
      subject: 'Service Charge Reminder',
      text: [
        `Service charge payment reminder`,
        `Client: ${clientName}`,
        `Property: ${propertyTitle}`,
        propertyLocation ? `Location: ${propertyLocation}` : null,
        `Amount Due: ${record.amount || 0}`,
        `Due Date: ${dueAt}`
      ].filter(Boolean).join('\n')
    }
  }

  if (notificationType === NOTIFICATION_TYPES.ENGAGEMENT) {
    const client = await fetchClientContext(record.client_id)
    const clientName = client?.name || client?.full_name || 'Unknown client'

    return {
      subject: 'Engagement Reminder',
      text: [
        record.heading || 'Client engagement',
        `Client: ${clientName}`,
        `Scheduled: ${formatDateTime(record.date_time)}`,
        record.note ? `Note: ${record.note}` : null
      ].filter(Boolean).join('\n')
    }
  }

  return {
    subject: 'Notification',
    text: 'You have a new notification.'
  }
}

async function sendEmail(to, subject, text) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME || 'Iska Homes'

  if (!fromEmail) {
    throw new Error('SENDGRID_FROM_EMAIL is not configured')
  }

  await sgMail.send({
    to,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject,
    text,
    html: `<p>${text}</p>`
  })
}

async function sendSms(to, text) {
  const apiKey = process.env.MNOTIFY_API_KEY
  if (!apiKey) {
    throw new Error('MNOTIFY_API_KEY must be set')
  }

  const normalizedRecipient = String(to).replace(/\D/g, '')
  if (!normalizedRecipient) {
    throw new Error('Invalid recipient phone number')
  }

  const senderId = process.env.MNOTIFY_SENDER_ID || 'mNotify'
  const response = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: [normalizedRecipient],
      sender: senderId,
      message: text,
      is_schedule: false,
      schedule_date: ''
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`SMS delivery failed: ${body || response.statusText}`)
  }
}

export async function dispatchNotificationJob(payload) {
  const {
    notificationType,
    recordId,
    userId,
    userType
  } = payload

  const record = await getNotificationRecord(notificationType, recordId)
  if (!record) {
    console.warn('[notifications][dispatcher] record not found', { notificationType, recordId })
    return { skipped: true, reason: 'record_not_found' }
  }

  if (record.notification_status && record.notification_status !== NOTIFICATION_STATUS.PENDING) {
    console.warn('[notifications][dispatcher] record not pending', {
      notificationType,
      recordId,
      status: record.notification_status
    })
    return { skipped: true, reason: 'record_not_pending' }
  }

  await markNotificationAttempt(notificationType, recordId)

  const channels = await getNotificationChannelsForType({
    userId,
    userType,
    notificationType
  })

  console.log('[notifications][dispatcher] resolved channels', {
    notificationType,
    recordId,
    channels
  })

  if (!channels.sms && !channels.email) {
    await markNotificationSent(notificationType, recordId)
    console.log('[notifications][dispatcher] all channels disabled; marking as sent', {
      notificationType,
      recordId
    })
    return { sent: false, reason: 'all_channels_disabled' }
  }

  const contact = await getUserContact({ userId, userType })
  const message = await buildNotificationMessage(notificationType, record)

  try {
    if (channels.sms) {
      if (!contact.phone) {
        throw new Error('SMS enabled but phone is missing')
      }
      await sendSms(contact.phone, message.text)
    }

    if (channels.email) {
      if (!contact.email) {
        throw new Error('Email enabled but email address is missing')
      }
      await sendEmail(contact.email, message.subject, message.text)
    }

    await markNotificationSent(notificationType, recordId)
    console.log('[notifications][dispatcher] notification sent', {
      notificationType,
      recordId,
      sms: channels.sms,
      email: channels.email
    })
    return { sent: true }
  } catch (error) {
    await markNotificationFailed(notificationType, recordId, error.message || 'Delivery failed')
    console.error('[notifications][dispatcher] notification failed', {
      notificationType,
      recordId,
      error: error?.message || error
    })
    throw error
  }
}

