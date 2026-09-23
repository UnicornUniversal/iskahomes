import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const PREFIX = {
  developer: 'dv',
  agency: 'ag'
}

export function generateApiKeyPair(organizationType = 'developer', environment = 'live') {
  const type = PREFIX[organizationType] || 'dv'
  const env = environment === 'test' ? 'test' : 'live'
  const pub = crypto.randomBytes(16).toString('hex')
  const sec = crypto.randomBytes(24).toString('hex')
  const publishableKey = `pk_${env}_${type}_${pub}`
  const secretKey = `sk_${env}_${type}_${sec}`
  return {
    publishableKey,
    secretKey,
    secretKeyPrefix: secretKey.slice(0, 20)
  }
}

export function isValidGeneratedKeyPair(publishableKey, secretKey, organizationType = 'developer', environment = 'live') {
  const type = PREFIX[organizationType] || 'dv'
  const env = environment === 'test' ? 'test' : 'live'
  const pkOk = new RegExp(`^pk_${env}_${type}_[a-f0-9]{32}$`).test(publishableKey || '')
  const skOk = new RegExp(`^sk_${env}_${type}_[a-f0-9]{48}$`).test(secretKey || '')
  return pkOk && skOk
}

export async function hashSecretKey(secretKey) {
  return bcrypt.hash(secretKey, 10)
}

export async function verifySecretKey(secretKey, hash) {
  if (!secretKey || !hash) return false
  return bcrypt.compare(secretKey, hash)
}

export function maskSecretPrefix(prefix, last4 = '') {
  if (!prefix) return 'sk_••••'
  return `${prefix.slice(0, 12)}${'•'.repeat(12)}${last4}`
}

export function publicKeyPayload(row, { includeSecret = false, secretKey = null } = {}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    environment: row.environment,
    publishable_key: row.publishable_key,
    secret_key_prefix: row.secret_key_prefix,
    secret_key: includeSecret ? secretKey : undefined,
    permissions: row.permissions || {},
    last_platform_source: row.last_platform_source,
    last_used_at: row.last_used_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}
