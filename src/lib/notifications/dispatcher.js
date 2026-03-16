import sgMail from '@/lib/sendgrid'
import { getNotificationChannelsForType, getUserContact } from './preferences'
import {
  getNotificationRecord,
  markNotificationAttempt,
  markNotificationFailed,
  markNotificationSent
} from './records'
import { NOTIFICATION_STATUS, NOTIFICATION_TYPES } from './constants'

function buildNotificationMessage(notificationType, record) {
  if (notificationType === NOTIFICATION_TYPES.REMINDER) {
    return {
      subject: 'Reminder Due',
      text: `Reminder: ${record.note_text || 'You have a reminder due now.'}`
    }
  }

  if (notificationType === NOTIFICATION_TYPES.APPOINTMENT) {
    return {
      subject: 'Appointment Reminder',
      text: `You have an appointment with ${record.client_name || 'a client'} at ${record.appointment_time || 'the scheduled time'}.`
    }
  }

  if (notificationType === NOTIFICATION_TYPES.SERVICE_CHARGE) {
    return {
      subject: 'Service Charge Reminder',
      text: `Service charge payment reminder. Amount due: ${record.amount || 0}.`
    }
  }

  if (notificationType === NOTIFICATION_TYPES.ENGAGEMENT) {
    return {
      subject: 'Engagement Reminder',
      text: `${record.heading || 'Client engagement'}${record.note ? `: ${record.note}` : ''}`
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
    return { skipped: true, reason: 'record_not_found' }
  }

  if (record.notification_status && record.notification_status !== NOTIFICATION_STATUS.PENDING) {
    return { skipped: true, reason: 'record_not_pending' }
  }

  await markNotificationAttempt(notificationType, recordId)

  const channels = await getNotificationChannelsForType({
    userId,
    userType,
    notificationType
  })

  if (!channels.sms && !channels.email) {
    await markNotificationSent(notificationType, recordId)
    return { sent: false, reason: 'all_channels_disabled' }
  }

  const contact = await getUserContact({ userId, userType })
  const message = buildNotificationMessage(notificationType, record)

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
    return { sent: true }
  } catch (error) {
    await markNotificationFailed(notificationType, recordId, error.message || 'Delivery failed')
    throw error
  }
}

