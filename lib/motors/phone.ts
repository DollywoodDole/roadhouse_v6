// Normalises a raw phone string to E.164 (+1XXXXXXXXXX) for North American numbers.
// Returns null if the input cannot be resolved to a valid 10-digit NANP number.
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`
  return null
}
