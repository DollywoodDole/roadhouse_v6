export interface TeamMember {
  slug: string
  name: string
  title: string
  bio: string // paragraphs separated by \n\n
  pullQuote?: string
  photoUrl: string // ⚠️ placeholder path — flag when real photo is available
  contact?: { phone?: string; email?: string }
  order: number
  featured: boolean // featured renders at 2x / hero treatment
}

export const TEAM: TeamMember[] = [
  {
    slug: 'dalton-ellscheid',
    name: 'Dalton Ellscheid',
    title: 'Founder — RoadHouse Motors',
    featured: true,
    order: 1,
    photoUrl: '/motors/team/dalton.png',
    pullQuote: "I'd rather lose a sale than push someone into something that won't carry them.",
    bio: `I grew up on Saskatchewan roads. Gravel in spring, ice in November, that long stretch of highway between everywhere and nowhere where your vehicle becomes the most important thing you own. Out here, a truck isn't a status object — it's a tool, a shelter, and sometimes the only thing standing between you and a hard night.

RoadHouse Motors is the first node of a bigger build. The dealership model is broken in a hundred small ways — pressure tactics, opaque pricing, "I'm just doing my job" — and I'm not interested in running another one. I'd rather lose a sale than push someone into something that won't carry them.

Every vehicle on this lot has been picked with a real opinion about what works in this climate, on these roads, for the kind of life people actually live in Saskatchewan. We deliver province-wide. We work with people across the credit spectrum. And when something goes sideways after the sale, you'll get me, not a phone tree.

If you want to talk before you drive — I'm reachable.`,
    contact: {
      phone: '+13063818222',
      email: 'roadhousesyndicate@gmail.com',
    },
  },
]
