import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getKey, setKey, deleteKey } from '@/lib/redis'

const OTP_TTL_SECONDS = 180
const OTP_MAX_ATTEMPTS = 5

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { otpTicket, otp } = body

    if (!otpTicket || !otp) {
      return NextResponse.json(
        { error: 'otpTicket and otp are required' },
        { status: 400 }
      )
    }

    const recordKey = `signin:otp:${otpTicket}`
    const otpRecord = await getKey(recordKey)

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP has expired or is invalid. Please request a new code.' },
        { status: 400 }
      )
    }

    const attempts = Number(otpRecord.attempts || 0)
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await deleteKey(recordKey)
      return NextResponse.json(
        { error: 'Maximum OTP attempts exceeded. Please request a new code.' },
        { status: 429 }
      )
    }

    const incomingHash = hashOtp(String(otp).trim())
    if (incomingHash !== otpRecord.otpHash) {
      otpRecord.attempts = attempts + 1
      await setKey(recordKey, otpRecord, { ttl: OTP_TTL_SECONDS })
      return NextResponse.json(
        { error: 'Invalid OTP code.' },
        { status: 401 }
      )
    }

    await deleteKey(recordKey)
    await setKey(
      `signin:otp:verified:${otpTicket}`,
      { userId: otpRecord.userId, email: otpRecord.email, verifiedAt: new Date().toISOString() },
      { ttl: OTP_TTL_SECONDS }
    )

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.'
    })
  } catch (error) {
    console.error('Signin OTP verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP.' },
      { status: 500 }
    )
  }
}
