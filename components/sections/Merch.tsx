'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'

const MERCH = [
  {
    id: 'rh-tee',
    name: 'RoadHouse Tee',
    price: 3500,
    display: '$35 CAD',
    desc: 'Premium heavyweight tee. Black with gold embroidered logo. One Smooth Ride.',
    badge: 'Bestseller',
    priceId: siteConfig.stripe.merch.tee,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'rh-hat',
    name: 'RoadHouse Snapback',
    price: 4000,
    display: '$40 CAD',
    desc: 'Structured snapback. Embroidered script logo. Gold brim undervisor.',
    badge: 'New',
    priceId: siteConfig.stripe.merch.hat,
    sizes: ['One Size'],
  },
  {
    id: 'cc-hoodie',
    name: 'Coconut Cowboy Hoodie',
    price: 7500,
    display: '$75 CAD',
    desc: '12 oz fleece. Coconut Cowboy × RoadHouse collab. Pull-up a chair energy.',
    badge: 'Collab',
    priceId: siteConfig.stripe.merch.hoodie,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'sticker-pack',
    name: 'Sticker Pack',
    price: 1200,
    display: '$12 CAD',
    desc: '8-pack. Waterproof vinyl. RoadHouse · Coconut Cowboy · $ROAD logos.',
    badge: null,
    priceId: siteConfig.stripe.merch.stickers,
    sizes: [],
  },
  {
    id: 'rh-glass',
    name: 'Whiskey Glass Set (2)',
    price: 4500,
    display: '$45 CAD',
    desc: 'Etched rocks glasses. Gold RoadHouse crest. For those who arrived early.',
    badge: 'Limited',
    priceId: siteConfig.stripe.merch.glass,
    sizes: [],
  },
  {
    id: 'rh-phone',
    name: 'Phone Case',
    price: 2800,
    display: '$28 CAD',
    desc: 'MagSafe compatible. Matte black with gold foil logo. iPhone 15/16 Pro.',
    badge: null,
    priceId: siteConfig.stripe.merch.phone,
    sizes: ['iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Pro Max'],
  },
]

async function handleCheckout(priceId: string, selectedSize: string, itemName: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, metadata: { size: selectedSize, item: itemName, type: 'merch' } }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else alert('Checkout error. Please try again.')
}

export default function Merch() {
  const [loading, setLoading] = useState<string | null>(null)
  const [sizes, setSizes] = useState<Record<string, string>>({})

  const buy = async (item: typeof MERCH[0]) => {
    if (!item.priceId) {
      alert('This item is not yet available. Check back soon.')
      return
    }
    setLoading(item.id)
    try {
      await handleCheckout(item.priceId, sizes[item.id] || item.sizes[0] || 'N/A', item.name)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="merch" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Praetorian Holdings — Merchandise</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Merch <span className="text-gold">Store</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Wear the standard. Limited runs, high quality. Ships from Saskatchewan.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MERCH.map(item => (
          <div key={item.id} className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow flex flex-col">
            {/* Item image placeholder */}
            <div
              className="h-48 relative flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1A1712 0%, #242016 50%, #1A1712 100%)',
              }}
            >
              <span className="text-5xl opacity-30">🛒</span>
              {item.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] tracking-widest uppercase bg-gold text-rh-black rounded font-medium">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-medium text-rh-text tracking-wide">{item.name}</h3>
                <span
                  className="text-lg font-light text-gold ml-2 whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {item.display}
                </span>
              </div>
              <p className="text-[11px] text-rh-muted leading-relaxed mb-4 flex-1">{item.desc}</p>

              {item.sizes.length > 0 && (
                <div className="mb-4">
                  <div className="text-[9px] tracking-widest uppercase text-rh-faint mb-2">Size</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setSizes(prev => ({ ...prev, [item.id]: s }))}
                        className={`px-2.5 py-1 text-[10px] tracking-wider rounded border transition-colors ${
                          (sizes[item.id] || item.sizes[0]) === s
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-rh-border text-rh-muted hover:border-gold/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => buy(item)}
                disabled={loading === item.id}
                className="stripe-btn w-full py-2.5 text-rh-black text-[11px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={13} />
                    Buy with Stripe
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-rh-faint text-center tracking-wider">
        Secure checkout via Stripe · Prices in CAD · Ships 5–10 business days
      </p>
    </section>
  )
}