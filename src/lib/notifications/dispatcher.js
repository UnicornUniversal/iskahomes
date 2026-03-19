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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toSentenceCase(value, fallback = 'Not specified') {
  if (!value) return fallback
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return fallback
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
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

function buildAbsoluteUrl(pathname) {
  if (!pathname) return null
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${resolveAppBaseUrl()}${normalizedPath}`
}

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

function normalizeId(value) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  if (!normalized || normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'undefined') {
    return null
  }
  return normalized
}

function extractListingIdFromGroupedKey(groupedLeadKey) {
  if (!groupedLeadKey || typeof groupedLeadKey !== 'string') return null
  if (groupedLeadKey.startsWith('manual_')) return null
  const parts = groupedLeadKey.split('_')
  // Expected automated format: seeker_id_listing_id or seeker_id_listing_id_development_id
  return normalizeId(parts[1])
}

function extractSeekerIdFromGroupedKey(groupedLeadKey) {
  if (!groupedLeadKey || typeof groupedLeadKey !== 'string') return null
  if (groupedLeadKey.startsWith('manual_')) return null
  const parts = groupedLeadKey.split('_')
  return normalizeId(parts[0])
}

async function fetchListingContext(listingId) {
  const normalizedListingId = normalizeId(listingId)
  if (!normalizedListingId) return null
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id, title, town, city, state, country, full_address, slug, listing_type, media')
    .eq('id', normalizedListingId)
    .maybeSingle()
  if (error) {
    console.error('[notifications][dispatcher] listing fetch failed', {
      listingId: normalizedListingId,
      error: error.message || error
    })
  }
  return data || null
}

async function fetchPropertySeekerContext(seekerId) {
  const normalizedSeekerId = normalizeId(seekerId)
  if (!normalizedSeekerId) return null
  const { data, error } = await supabaseAdmin
    .from('property_seekers')
    .select('id, full_name, name, email, phone')
    .eq('id', normalizedSeekerId)
    .maybeSingle()
  if (error) {
    console.error('[notifications][dispatcher] seeker fetch failed', {
      seekerId: normalizedSeekerId,
      error: error.message || error
    })
  }
  return data || null
}

async function fetchClientContext(clientId) {
  if (!clientId) return null
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()
  if (error) {
    console.error('[notifications][dispatcher] client fetch failed', {
      clientId,
      error: error.message || error
    })
  }
  return data || null
}

function parseMaybeJsonArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

function parseMaybeJsonObject(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

function extractFirstImageUrl(mediaCandidate) {
  if (!mediaCandidate) return null
  let media = mediaCandidate

  for (let i = 0; i < 3 && typeof media === 'string'; i += 1) {
    const trimmed = media.trim()
    if (trimmed.startsWith('http')) return trimmed
    try {
      media = JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  if (Array.isArray(media)) {
    const first = media[0]
    if (typeof first === 'string' && first.startsWith('http')) return first
    if (first?.url) return first.url
  }

  if (media?.albums && Array.isArray(media.albums) && media.albums.length > 0) {
    for (const album of media.albums) {
      if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
        const firstImage = album.images[0]
        if (typeof firstImage === 'string' && firstImage.startsWith('http')) return firstImage
        if (firstImage?.url) return firstImage.url
      }
    }
  }

  if (media?.images && Array.isArray(media.images) && media.images.length > 0) {
    const firstImage = media.images[0]
    if (typeof firstImage === 'string' && firstImage.startsWith('http')) return firstImage
    if (firstImage?.url) return firstImage.url
  }

  if (media?.banner?.url) return media.banner.url
  if (media?.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
    const firstMediaFile = media.mediaFiles[0]
    if (typeof firstMediaFile === 'string' && firstMediaFile.startsWith('http')) return firstMediaFile
    if (firstMediaFile?.url) return firstMediaFile.url
  }

  return null
}

function buildListingDetailsPath(listing) {
  if (!listing?.id || !listing?.slug || !listing?.listing_type) return null
  return `/home/property/${listing.listing_type}/${listing.slug}/${listing.id}`
}

async function buildNotificationMessage(notificationType, record, { userId } = {}) {
  if (notificationType === NOTIFICATION_TYPES.REMINDER) {
    let listing = null
    let seeker = null
    let lead = null
    const groupedListingId = extractListingIdFromGroupedKey(record.grouped_lead_key)
    const groupedSeekerId = extractSeekerIdFromGroupedKey(record.grouped_lead_key)

    if (record.lead_id) {
      const { data } = await supabaseAdmin
        .from('leads')
        .select('id, listing_id, seeker_id, lead_type, lead_name, lead_email, lead_phone, lead_classification, lister_id, context_type')
        .eq('id', record.lead_id)
        .maybeSingle()
      lead = data || null

      const isProfileLead = lead?.context_type === 'profile'
      const resolvedListingId = normalizeId(lead?.listing_id) || groupedListingId
      const resolvedSeekerId = normalizeId(lead?.seeker_id) || groupedSeekerId

      console.log('[notifications][dispatcher][reminder] lead context resolved', {
        reminderId: record.id,
        leadId: record.lead_id,
        groupedLeadKey: record.grouped_lead_key,
        leadType: lead?.lead_type || null,
        contextType: lead?.context_type || null,
        leadListingId: lead?.listing_id || null,
        leadSeekerId: lead?.seeker_id || null,
        groupedListingId,
        groupedSeekerId,
        resolvedListingId,
        resolvedSeekerId,
        isProfileLead
      })

      if (!isProfileLead && resolvedListingId) {
        listing = await fetchListingContext(resolvedListingId)
        console.log('[notifications][dispatcher][reminder] listing fetch result', {
          reminderId: record.id,
          listingId: resolvedListingId,
          found: !!listing,
          title: listing?.title || null,
          listingType: listing?.listing_type || null,
          status: listing?.status || null,
          listingStatus: listing?.listing_status || null,
          hasMedia: !!listing?.media
        })
      }
      if (resolvedSeekerId) {
        seeker = await fetchPropertySeekerContext(resolvedSeekerId)
        console.log('[notifications][dispatcher][reminder] seeker fetch result', {
          reminderId: record.id,
          seekerId: resolvedSeekerId,
          found: !!seeker,
          name: seeker?.full_name || seeker?.name || null,
          email: seeker?.email || null,
          phone: seeker?.phone || null
        })
      }
    }

    const isProfileLead = lead?.context_type === 'profile'
    const isManualLead = lead?.lead_type === 'manual'

    if (!isProfileLead && !listing && record.grouped_lead_key) {
      listing = await fetchListingContext(groupedListingId)
      console.log('[notifications][dispatcher][reminder] grouped listing fallback result', {
        reminderId: record.id,
        listingId: groupedListingId,
        found: !!listing,
        title: listing?.title || null
      })
    }

    if (!seeker && groupedSeekerId) {
      seeker = await fetchPropertySeekerContext(groupedSeekerId)
      console.log('[notifications][dispatcher][reminder] grouped seeker fallback result', {
        reminderId: record.id,
        seekerId: groupedSeekerId,
        found: !!seeker,
        name: seeker?.full_name || seeker?.name || null
      })
    }

    const listingReferenceId = normalizeId(lead?.listing_id) || groupedListingId || null
    const propertyTitle = isProfileLead
      ? 'Profile Lead'
      : (listing?.title || (listingReferenceId ? `Property (${listingReferenceId})` : 'the property'))
    const propertyLocation = formatLocation(listing)
    const seekerName = isManualLead
      ? (lead?.lead_name || seeker?.full_name || seeker?.name || null)
      : (seeker?.full_name || seeker?.name || null)
    const leadClassification = lead?.lead_classification || 'Standard'
    const reminderPriority = toSentenceCase(record.priority || 'normal', 'Normal')
    const dueAt = formatDateTime(record.reminder_date, record.reminder_time)
    const dashboardSlug = record.user_id || userId || lead?.lister_id || null
    const leadDetailsUrl = dashboardSlug && record.lead_id
      ? buildAbsoluteUrl(`/developer/${dashboardSlug}/leads/${record.lead_id}`)
      : null
    const listingDetailsUrl = isProfileLead ? null : buildAbsoluteUrl(buildListingDetailsPath(listing))
    const listingImageUrl = isProfileLead ? null : (extractFirstImageUrl(listing?.media) || extractFirstImageUrl(listing?.images))

    console.log('[notifications][dispatcher][reminder] final notification context', {
      reminderId: record.id,
      leadId: record.lead_id,
      isProfileLead,
      listingReferenceId,
      propertyTitle,
      propertyLocation,
      seekerName,
      leadClassification,
      reminderPriority,
      dueAt,
      leadDetailsUrl,
      listingDetailsUrl,
      listingImageUrl
    })

    const emailTextLines = [
      `Reminder: ${record.note_text || 'You have a reminder due now.'}`,
      seekerName ? `Seeker: ${seekerName}` : null,
      isProfileLead ? `Context: ${propertyTitle}` : `Property: ${propertyTitle}`,
      (!isProfileLead && listingReferenceId) ? `Property Code: ${listingReferenceId}` : null,
      propertyLocation ? `Location: ${propertyLocation}` : null,
      `Lead Classification: ${leadClassification}`,
      `Reminder Priority: ${reminderPriority}`,
      `Due: ${dueAt}`,
      leadDetailsUrl ? `Lead Details: ${leadDetailsUrl}` : null,
      listingDetailsUrl ? `Listing: ${listingDetailsUrl}` : null
    ].filter(Boolean)

    const html = `
      <div style="background:#f4f7fb;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          ${listingImageUrl ? `<img src="${escapeHtml(listingImageUrl)}" alt="Property image" style="display:block;width:100%;height:240px;object-fit:cover;background:#e2e8f0;" />` : ''}
          <div style="padding:22px;">
            <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#64748b;">Lead Reminder</p>
            <h2 style="margin:0 0 14px 0;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(record.note_text || 'You have a reminder due now.')}</h2>
            <p style="margin:0 0 16px 0;font-size:15px;color:#334155;">This reminder is due on <strong>${escapeHtml(dueAt)}</strong>.</p>
            <div style="margin:0 0 18px 0;padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
              ${seekerName ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Seeker:</strong> ${escapeHtml(seekerName)}</p>` : ''}
              <p style="margin:0 0 8px 0;font-size:14px;"><strong>${isProfileLead ? 'Context' : 'Property'}:</strong> ${escapeHtml(propertyTitle)}</p>
              ${!isProfileLead && listingReferenceId ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Property Code:</strong> ${escapeHtml(listingReferenceId)}</p>` : ''}
              ${propertyLocation ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Location:</strong> ${escapeHtml(propertyLocation)}</p>` : ''}
              <p style="margin:0 0 8px 0;font-size:14px;"><strong>Lead Classification:</strong> ${escapeHtml(leadClassification)}</p>
              <p style="margin:0;font-size:14px;"><strong>Reminder Priority:</strong> ${escapeHtml(reminderPriority)}</p>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              ${leadDetailsUrl ? `<a href="${escapeHtml(leadDetailsUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;">Open Lead Details</a>` : ''}
              ${listingDetailsUrl ? `<a href="${escapeHtml(listingDetailsUrl)}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;font-weight:600;">Open Listing</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `

    const smsText = [
      `Reminder: ${record.note_text || 'You have a reminder due now.'}`,
      seekerName ? `Seeker: ${seekerName}` : null,
      isProfileLead ? `Context: ${propertyTitle}` : `Property: ${propertyTitle}`,
      (!isProfileLead && listingReferenceId) ? `Property Code: ${listingReferenceId}` : null,
      `Lead Classification: ${leadClassification}`,
      `Priority: ${reminderPriority}`,
      `Due: ${dueAt}`,
      leadDetailsUrl ? `Lead: ${leadDetailsUrl}` : null
    ].filter(Boolean).join('\n')

    return {
      subject: !isProfileLead && listingReferenceId
        ? `Lead Reminder: ${propertyTitle} (${listingReferenceId})`
        : `Lead Reminder: ${propertyTitle}`,
      text: emailTextLines.join('\n'),
      smsText,
      html
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
    const clientName = client?.name || 'Unknown client'
    const clientEmails = parseMaybeJsonArray(client?.emails)
    const clientPhones = parseMaybeJsonArray(client?.phones)
    const clientPrimaryEmail = clientEmails[0] || null
    const clientPrimaryPhone = clientPhones[0] || null
    const clientAddressObj = parseMaybeJsonObject(client?.address)
    const clientAddress = clientAddressObj?.fullAddress || null
    const dueAt = formatDateTime(record.next_due_date, record.next_due_time || '08:00:00')
    const listingImageUrl = extractFirstImageUrl(listing?.media) || extractFirstImageUrl(listing?.images)
    const amountValue = Number(record.amount || 0)
    const amountDisplay = Number.isFinite(amountValue) ? amountValue.toLocaleString('en-US') : `${record.amount || 0}`

    return {
      subject: 'Service Charge Reminder',
      text: [
        `Service charge payment reminder`,
        `Client: ${clientName}`,
        clientPrimaryEmail ? `Client Email: ${clientPrimaryEmail}` : null,
        clientPrimaryPhone ? `Client Phone: ${clientPrimaryPhone}` : null,
        clientAddress ? `Client Address: ${clientAddress}` : null,
        `Property: ${propertyTitle}`,
        propertyLocation ? `Location: ${propertyLocation}` : null,
        `Amount Due: ${amountDisplay}`,
        `Due Date: ${dueAt}`
      ].filter(Boolean).join('\n'),
      html: `
        <div style="background:#f4f7fb;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            ${listingImageUrl ? `<img src="${escapeHtml(listingImageUrl)}" alt="Property image" style="display:block;width:100%;height:220px;object-fit:cover;background:#e2e8f0;" />` : ''}
            <div style="padding:22px;">
              <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#64748b;">Service Charge</p>
              <h2 style="margin:0 0 14px 0;font-size:24px;line-height:1.3;color:#0f172a;">Payment Reminder</h2>
              <p style="margin:0 0 16px 0;font-size:15px;color:#334155;">A service charge payment is due on <strong>${escapeHtml(dueAt)}</strong>.</p>

              <div style="margin:0 0 16px 0;padding:14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;">
                <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9a3412;">Amount Due</p>
                <p style="margin:0;font-size:28px;line-height:1.1;font-weight:700;color:#9a3412;">${escapeHtml(amountDisplay)}</p>
              </div>

              <div style="padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px 0;font-size:14px;"><strong>Client:</strong> ${escapeHtml(clientName)}</p>
                ${clientPrimaryEmail ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Email:</strong> ${escapeHtml(clientPrimaryEmail)}</p>` : ''}
                ${clientPrimaryPhone ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Phone:</strong> ${escapeHtml(clientPrimaryPhone)}</p>` : ''}
                ${clientAddress ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Address:</strong> ${escapeHtml(clientAddress)}</p>` : ''}
                <p style="margin:0 0 8px 0;font-size:14px;"><strong>Property:</strong> ${escapeHtml(propertyTitle)}</p>
                ${propertyLocation ? `<p style="margin:0;font-size:14px;"><strong>Location:</strong> ${escapeHtml(propertyLocation)}</p>` : ''}
              </div>
            </div>
          </div>
        </div>
      `
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

async function sendEmail(to, subject, text, html = null) {
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
    html: html || `<div style="font-family:Segoe UI,Arial,sans-serif;white-space:pre-line;">${escapeHtml(text)}</div>`
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
  const message = await buildNotificationMessage(notificationType, record, { userId, userType })

  try {
    if (channels.sms) {
      if (!contact.phone) {
        throw new Error('SMS enabled but phone is missing')
      }
      await sendSms(contact.phone, message.smsText || message.text)
    }

    if (channels.email) {
      if (!contact.email) {
        throw new Error('Email enabled but email address is missing')
      }
      await sendEmail(contact.email, message.subject, message.text, message.html)
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

