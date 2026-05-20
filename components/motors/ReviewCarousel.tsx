'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Review } from '@/lib/motors/reviews'

const TRUNCATE = 240
const AUTO_ADVANCE_MS = 7000

// Card width percentage on md+ screens — creates partial-neighbor peek effect
// Mobile: 100% (single card), md+: 72% (28% split across two partial neighbors)
const MD_CARD_PCT = 72
const MD_OFFSET_BASE = (100 - MD_CARD_PCT) / 2 // 14% — centers the active card

const SOURCE_BADGE: Record<Review['source'], string> = {
  google: 'Verified Google Review',
  facebook: 'Verified Facebook Review',
  direct: 'Verified Review',
}

function Stars({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-[18px] h-[18px] shrink-0 ${i < rating ? 'text-amber-400' : 'text-white/15'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

interface ReviewCardProps {
  review: Review
  active: boolean
}

function ReviewCard({ review, active }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.body.length > TRUNCATE
  const displayBody =
    isLong && !expanded ? review.body.slice(0, TRUNCATE).trimEnd() + '…' : review.body

  return (
    <div
      // Each card takes 100% on mobile, MD_CARD_PCT% on md+
      className={`flex-shrink-0 w-full md:w-[72%] px-2 transition-opacity duration-300 select-none ${
        active ? 'opacity-100' : 'opacity-30 pointer-events-none'
      }`}
      aria-hidden={!active}
    >
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
        <Stars rating={review.rating} />

        {review.title && (
          <h3 className="text-white font-semibold text-base leading-snug">{review.title}</h3>
        )}

        <div>
          <p className="text-white/65 text-sm leading-relaxed">{displayBody}</p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1.5 text-amber-400/70 hover:text-amber-400 text-xs transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {review.verified && (
              <span
                className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0"
                aria-label="Verified buyer"
              >
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
            <div>
              <p className="text-white text-sm font-medium leading-none">{review.authorName}</p>
              {(review.authorLocation || review.vehiclePurchased) && (
                <p className="text-white/35 text-xs mt-0.5">
                  {review.authorLocation}
                  {review.authorLocation && review.vehiclePurchased && ' · '}
                  {review.vehiclePurchased}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <time className="text-white/25 text-xs" dateTime={review.reviewDate}>
              {new Date(review.reviewDate).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
              })}
            </time>
            {review.verified && (
              <span className="text-white/20 text-xs border border-white/[0.08] px-2 py-0.5 rounded-full">
                {SOURCE_BADGE[review.source]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  reviews: Review[]
}

export default function ReviewCarousel({ reviews }: Props) {
  // Returns nothing when no reviews — section is invisible until REVIEWS_ENABLED
  if (reviews.length === 0) return null

  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isMd, setIsMd] = useState(false)
  const touchX = useRef<number | null>(null)
  const prefersReduced = useRef(false)

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mq = window.matchMedia('(min-width: 768px)')
    setIsMd(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const goNext = useCallback(() => setIdx((i) => (i + 1) % reviews.length), [reviews.length])
  const goPrev = useCallback(
    () => setIdx((i) => (i - 1 + reviews.length) % reviews.length),
    [reviews.length]
  )

  // Auto-advance — pauses on hover, focus, touch
  useEffect(() => {
    if (paused || reviews.length < 2) return
    const id = setInterval(goNext, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [paused, goNext, reviews.length])

  // Track translate: on mobile shift by 100% per card, on md shift by 72% + center offset
  const trackTransform = isMd
    ? `translateX(calc(-${idx * MD_CARD_PCT}% - ${idx * 8}px + ${MD_OFFSET_BASE}%))`
    : `translateX(-${idx * 100}%)`

  const transition = prefersReduced.current ? '' : 'transition-transform duration-500 ease-in-out'

  return (
    <section
      aria-label="Customer reviews"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Track */}
      <div
        className="overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
          setPaused(true)
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) {
            dx < 0 ? goNext() : goPrev()
          }
          touchX.current = null
          setPaused(false)
        }}
      >
        <div
          className={`flex gap-2 ${transition}`}
          style={{ transform: trackTransform }}
          aria-live="polite"
          aria-atomic="true"
        >
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} active={i === idx} />
          ))}
        </div>
      </div>

      {/* Controls: prev / dots / next */}
      {reviews.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={goPrev}
            aria-label="Previous review"
            className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Select review">
            {reviews.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === idx}
                aria-label={`Review ${i + 1} of ${reviews.length}`}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            aria-label="Next review"
            className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
