import type { Metadata } from 'next'
import { Suspense } from 'react'
import CreditForm from '@/components/motors/CreditForm'

export const metadata: Metadata = {
  title: 'Apply for Financing | RoadHouse Motors SK',
  description: 'Apply for vehicle financing at RoadHouse Motors. Bad credit, no credit, bankruptcy — we work with all credit situations. Saskatchewan delivery available.',
  alternates: { canonical: 'https://motors.roadhouse.capital/credit' },
  openGraph: {
    title: 'Apply for Financing | RoadHouse Motors SK',
    description: 'Apply for vehicle financing. We work with all credit situations. Saskatchewan delivery available.',
    url: 'https://motors.roadhouse.capital/credit',
  },
}

export default function CreditPage() {
  return (
    <Suspense>
      <CreditForm />
    </Suspense>
  )
}
