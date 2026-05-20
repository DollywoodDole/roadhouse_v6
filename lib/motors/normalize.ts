// Normalizes raw Webflow-scraped field values to standard filter categories.
// body_style and transmission come from O'Brian's CMS with inconsistent formatting.

export function normalizeBodyStyle(raw: string): string {
  const r = raw.toLowerCase()
  if (r.includes('pickup') || r.includes('truck') || r.includes('cab')) return 'Truck'
  if (r.includes('suv') || r.includes('sport utility') || r.includes('crossover')) return 'SUV'
  if (r.includes('van') || r.includes('minivan')) return 'Van'
  if (r.includes('sedan') || r.includes('4-door') || r.includes('4 door')) return 'Sedan'
  if (r.includes('coupe') || r.includes('2-door') || r.includes('2 door')) return 'Coupe'
  if (r.includes('hatchback') || r.includes('hatch')) return 'Hatchback'
  if (r.includes('atv') || r.includes('quad')) return 'ATV'
  if (r.includes('sbs') || r.includes('side by side') || r.includes('side-by-side')) return 'SBS'
  return 'Other'
}

export function normalizeTransmission(raw: string): string {
  const r = raw.toLowerCase()
  if (r.includes('cvt') || r.includes('continuously variable')) return 'CVT'
  if (r.includes('manual')) return 'Manual'
  return 'Automatic'
}
