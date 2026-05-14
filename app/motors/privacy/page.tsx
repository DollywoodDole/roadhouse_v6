import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | RoadHouse Motors',
  description: 'Privacy Policy for RoadHouse Motors — how we collect, use, and protect your information.',
  robots: { index: true, follow: true },
}

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: [
      'When you submit a pre-qualification or vehicle inquiry form on this site, we collect the information you provide: name, phone number, email address, vehicle of interest, credit range, monthly income, employment status, and any notes you include.',
      'When you browse our inventory, we may collect standard server-side access logs (IP address, browser type, pages visited) for security and performance purposes. We do not use third-party tracking pixels or behavioural advertising on this site.',
    ],
  },
  {
    title: 'How We Use Your Information',
    body: [
      'We use the information you submit solely to respond to your vehicle inquiry or pre-qualification request. A member of our team will contact you by phone or email within one business day.',
      'We do not sell, rent, or share your personal information with any third party for marketing purposes.',
    ],
  },
  {
    title: 'Social Media',
    body: [
      'RoadHouse Motors maintains a Facebook Page and an Instagram account (@roadhousemotorsyxe). If you interact with those accounts — liking, commenting, or sending a message — those interactions are governed by Meta\'s Privacy Policy. We use the Meta Graph API solely to publish vehicle listings from our inventory. We do not collect or store any data from visitors to our social media profiles.',
    ],
  },
  {
    title: 'Data Storage & Security',
    body: [
      'Inquiry submissions are stored securely and are accessible only to RoadHouse Motors staff. We retain your information only as long as necessary to fulfill the purpose for which it was collected, or as required by applicable law.',
      'We take reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, or loss.',
    ],
  },
  {
    title: 'Your Rights (PIPEDA)',
    body: [
      'Under Canada\'s Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to access the personal information we hold about you, request corrections, and withdraw consent to its use at any time.',
      'To exercise any of these rights, contact us at the phone number or address below and we will respond within 30 days.',
    ],
  },
  {
    title: 'Cookies',
    body: [
      'This site does not use advertising or analytics cookies. Essential cookies may be set by our hosting provider (Vercel) for performance and security purposes only.',
    ],
  },
  {
    title: 'Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. The date at the bottom of this page reflects the most recent revision. Continued use of this site following any changes constitutes acceptance of the updated policy.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'RoadHouse Motors\nDealer Licence DL331386\nSaskatchewan, Canada\nPhone: (306) 381-8222',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-white/40 text-sm mb-12">
        Effective date: May 14, 2026 &nbsp;&middot;&nbsp; RoadHouse Motors &nbsp;&middot;&nbsp; DL331386
      </p>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-white mb-3">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.body.map((para, i) => (
                <p key={i} className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
