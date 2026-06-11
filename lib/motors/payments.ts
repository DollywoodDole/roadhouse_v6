// Bi-weekly payment defaults — kept in sync with PaymentEstimator defaults
export const DOC_FEE          = 499
export const DEFAULT_RATE     = 0.0799  // near-prime
export const DEFAULT_TERM     = 72      // months
export const DEFAULT_DOWN_PCT = 0.10

/**
 * Estimates a bi-weekly payment at near-prime (7.99%), 72-month term, 10% down.
 * Includes $499 doc fee. OAC — actual rate set by lender.
 */
export function biWeeklyPayment(price: number): number {
  const down      = Math.min(Math.floor(price * DEFAULT_DOWN_PCT), Math.floor(price * 0.5))
  const principal = price + DOC_FEE - down
  if (principal <= 0) return 0
  const r       = DEFAULT_RATE / 12
  const monthly = (principal * r * Math.pow(1 + r, DEFAULT_TERM)) / (Math.pow(1 + r, DEFAULT_TERM) - 1)
  return (monthly * 12) / 26
}
