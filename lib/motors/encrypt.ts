import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  const raw = process.env.MOTORS_LEAD_ENCRYPTION_KEY
  if (!raw) throw new Error('MOTORS_LEAD_ENCRYPTION_KEY not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('MOTORS_LEAD_ENCRYPTION_KEY must decode to exactly 32 bytes')
  return key
}

// AES-256-GCM. Encoded as "v1:iv:tag:ciphertext" (each segment base64-encoded).
// v1 prefix allows future key-rotation schemes without breaking existing blobs.
export function encryptPII(plaintext: string): string {
  const key    = getKey()
  const iv     = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct     = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`
}

// Accepts both v1 (4-part "v1:iv:tag:ct") and legacy 3-part ("iv:tag:ct") tokens.
export function decryptPII(token: string): string {
  const key   = getKey()
  const parts = token.split(':')
  let ivB64: string, tagB64: string, ctB64: string
  if (parts.length === 4 && parts[0] === 'v1') {
    [, ivB64, tagB64, ctB64] = parts as [string, string, string, string]
  } else if (parts.length === 3) {
    [ivB64, tagB64, ctB64] = parts as [string, string, string]
  } else {
    throw new Error('Invalid PII token format')
  }
  const iv       = Buffer.from(ivB64,  'base64')
  const tag      = Buffer.from(tagB64, 'base64')
  const ct       = Buffer.from(ctB64,  'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
