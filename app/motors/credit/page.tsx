import type { Metadata } from 'next'
import { Suspense } from 'react'
import CreditForm from '@/components/motors/CreditForm'

export const metadata: Metadata = {
  title: 'Get Pre-Qualified | RoadHouse Motors Saskatchewan',
  description: 'Get pre-qualified for vehicle financing in minutes. All credit profiles welcome — including credit rebuilders and first-time buyers. Saskatchewan dealer DL#331386.',
  alternates: { canonical: 'https://motors.roadhouse.capital/credit' },
  openGraph: {
    title: 'Get Pre-Qualified | RoadHouse Motors Saskatchewan',
    description: 'Get pre-qualified for vehicle financing. All credit profiles welcome. Saskatchewan delivery available.',
    url: 'https://motors.roadhouse.capital/credit',
    images: [{ url: 'https://motors.roadhouse.capital/motors/rh-motors-header.jpg', width: 2560, height: 1440 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Pre-Qualified | RoadHouse Motors Saskatchewan',
    description: 'All credit profiles welcome — including credit rebuilders and first-time buyers. Saskatchewan dealer DL#331386.',
    images: ['https://motors.roadhouse.capital/motors/rh-motors-header.jpg'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do you work with bad credit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We have lender relationships across all credit tiers, including sub-prime and credit rebuilders. Complete the pre-qualification form and we\'ll find the best fit for your profile.',
      },
    },
    {
      '@type': 'Question',
      name: 'What credit score do I need to buy a car?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no minimum score. Sub-prime lenders we work with approve buyers from 500 and up, with appropriate down payment. Complete the pre-qualification form for a no-obligation assessment.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does pre-qualification take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We typically respond within 1 business day. Completing the form takes about 3 minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my information secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Your information is used only to assess financing options and is never sold or shared with third parties.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer vehicle delivery across Saskatchewan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, RoadHouse Motors offers delivery across Saskatchewan. Contact us at (306) 381-8222 to arrange delivery to your location.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I trade in my current vehicle at RoadHouse Motors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we accept trade-ins. Indicate your trade-in vehicle on the pre-qualification form and our team will provide a valuation.',
      },
    },
  ],
}

export default function CreditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense>
        <CreditForm />
      </Suspense>
    </>
  )
}
