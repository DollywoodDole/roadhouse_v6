// TODO: replace the static REVIEWS array with a fetch from Google Business Profile API
// once GBP is set up for RoadHouse Motors. Endpoint: My Business Information API.
// Keep the Review interface stable so the swap is zero-change at the component level.

export interface Review {
  id: string
  authorName: string
  authorLocation?: string // e.g. "Saskatoon, SK"
  rating: 1 | 2 | 3 | 4 | 5
  title?: string
  body: string
  vehiclePurchased?: string // e.g. "2022 Ford F-150"
  reviewDate: string // ISO 8601
  source: 'direct' | 'google' | 'facebook'
  verified: boolean
}

// EMPTY — do NOT add placeholder or fabricated reviews.
// Section is invisible until at least 3 real reviews are present.
export const REVIEWS: Review[] = []

export const REVIEWS_ENABLED = REVIEWS.length >= 3
