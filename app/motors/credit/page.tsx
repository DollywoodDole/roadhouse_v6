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
    images: [{ url: 'https://motors.roadhouse.capital/motors/rh-motors-header.jpg', width: 2560, height: 1440 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply for Financing | RoadHouse Motors SK',
    description: 'Bad credit, no credit, bankruptcy — we work with all credit situations in Saskatchewan.',
    images: ['https://motors.roadhouse.capital/motors/rh-motors-header.jpg'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I get approved for financing with bad credit in Saskatchewan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. RoadHouse Motors works with all credit situations including bad credit, no credit, bankruptcy, and repossessions. We partner with multiple lenders to find financing options that work for your situation.',
      },
    },
    {
      '@type': 'Question',
      name: 'What credit score do I need to buy a car at RoadHouse Motors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no minimum credit score requirement. We help customers with credit scores ranging from excellent to poor, and even those who have been discharged from bankruptcy.',
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
      name: 'How long does the credit application process take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We review all applications and respond within one business day. Complete the online form and a member of our team will be in touch to discuss your financing options.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I trade in my current vehicle at RoadHouse Motors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we accept trade-ins. Indicate your trade-in vehicle on the credit application and our team will provide a valuation.',
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
