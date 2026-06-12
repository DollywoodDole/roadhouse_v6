import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  const raw = process.env.MOTORS_LEAD_ENCRYPTION_KEY
  if (!raw) throw new Error('MOTORS_LEAD_ENCRYPTION_KEY not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('MOTORS_LEAD_ENCRYPTION_KEY must decode to exactly 32 bytes')
  return key
}

// AES-256-GCM. Encoded as "iv:tag:ciphertext" (each segment base64-encoded).
export function encryptPII(plaintext: string): string {
  const key    = getKey()
  const iv     = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct     = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`
}

export function decryptPII(token: string): string {
  const key   = getKey()
  const parts = token.split(':')
  if (parts.length !== 3) throw new Error('Invalid PII token format')
  const iv      = Buffer.from(parts[0], 'base64')
  const tag     = Buffer.from(parts[1], 'base64')
  const ct      = Buffer.from(parts[2], 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
