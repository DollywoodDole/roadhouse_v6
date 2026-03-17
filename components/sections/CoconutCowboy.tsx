'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const RECIPES = [
  {
    name: '🍹 Cowboy Colada',
    subtitle: 'A tropical twist on the classic piña.',
    ingredients: ['2 oz Coconut Cowboy Vodka', '2 oz pineapple juice', '1 oz coconut cream', 'Ice — blended or on the rocks'],
    method: 'Blend or shake. Garnish with a pineapple wedge. Simple, smooth, dangerous.',
  },
  {
    name: '🍸 Cowboy Martini',
    subtitle: 'Country club never had it this good.',
    ingredients: ['2.5 oz Coconut Cowboy Vodka', '0.5 oz dry vermouth', 'Ice — stirred, not shaken'],
    method: 'Strain into a chilled glass. Express a lemon peel. Tip your hat.',
  },
  {
    name: '🤍 White Russian Cowboy',
    subtitle: 'The Dude, but make it tropical.',
    ingredients: ['2 oz Coconut Cowboy Vodka', '1 oz coffee liqueur', 'Heavy cream, floated on top', 'Ice'],
    method: 'Build in a rocks glass. Don\'t stir the cream. Abide.',
  },
  {
    name: '✨ Cowboy\'s Delight',
    subtitle: 'The house special. No apologies.',
    ingredients: ['2 oz Coconut Cowboy Vodka', '1 oz lime juice', '0.5 oz simple syrup', 'Ginger beer, topped', 'Mint, for garnish'],
    method: 'Shake the first three. Top with ginger beer. A mule without the mule.',
  },
]

export default function CoconutCowboy() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="coconut" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Praetorian Holdings — Personal Product</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Coconut <span className="text-gold">Cowboy</span>
        </h2>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Product info */}
        <div>
          <div className="bg-rh-card border border-rh-border rounded-lg p-8 card-glow mb-6">
            <div className="flex items-center gap-4 mb-5">
              <span className="text-5xl">🥥🤠</span>
              <div>
                <h3
                  className="text-2xl font-light italic text-rh-text"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  One Smooth Ride.
                </h3>
                <div className="text-[10px] tracking-widest uppercase text-gold mt-1">
                  22% ABV · Alberta & Milwaukee
                </div>
              </div>
            </div>
            <p className="text-rh-muted text-sm leading-relaxed mb-6">
              Born in Alberta, Canada and Milwaukee, USA — Coconut Cowboy is the fusion nobody asked for and everyone needed.
              Tropical island calm married to prairie country grit. Smooth enough for a cocktail.
              Bold enough to stand alone.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://coconutcowboy.ca/"
                target="_blank"
                rel="noopener noreferrer"
                className="stripe-btn px-5 py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded flex items-center gap-2"
              >
                Visit Site <ExternalLink size={10} />
              </a>
              <a
                href={`mailto:${siteConfig.founderEmail}`}
                className="px-5 py-2.5 border border-rh-border text-rh-text text-[10px] tracking-widest uppercase rounded hover:border-gold/40 hover:bg-gold/5 transition-colors"
              >
                Business Inquiries
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
            <h4
              className="text-lg font-light italic text-rh-text mb-4"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Frequently Asked
            </h4>
            <div className="space-y-3">
              {[
                { q: 'Where to buy?', a: 'Select retailers in Alberta, Canada and Milwaukee, USA. Store locator at coconutcowboy.ca.' },
                { q: 'Stocking inquiries?', a: `Send business and retail inquiries to ${siteConfig.founderEmail} with your business info and location.` },
                { q: 'What is the ABV?', a: '22% ABV — lower than standard spirits, making it remarkably smooth and cocktail-friendly.' },
                { q: 'Submit your Cowboy photos?', a: 'Absolutely. Submit through coconutcowboy.ca and join the gang.' },
              ].map(item => (
                <div key={item.q} className="border-b border-rh-border/50 pb-3">
                  <div className="text-[11px] font-medium text-rh-text mb-1">{item.q}</div>
                  <div className="text-[11px] text-rh-muted">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recipes */}
        <div>
          <h3
            className="text-2xl font-light italic text-rh-text mb-4"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Cocktail <span className="text-gold">Recipes</span>
          </h3>
          <div className="space-y-3">
            {RECIPES.map((recipe, i) => (
              <div key={recipe.name} className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-rh-text">{recipe.name}</div>
                    <div className="text-[10px] text-rh-faint mt-0.5">{recipe.subtitle}</div>
                  </div>
                  <span className={`text-gold transition-transform duration-200 ${open === i ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {open === i && (
                  <div className="px-5 pb-5">
                    <div className="gold-line mb-4" />
                    <div className="text-[10px] tracking-widest uppercase text-rh-faint mb-2">Ingredients</div>
                    <ul className="mb-4 space-y-1">
                      {recipe.ingredients.map(ing => (
                        <li key={ing} className="text-[11px] text-rh-muted flex items-start gap-2">
                          <span className="text-gold/40">·</span>{ing}
                        </li>
                      ))}
                    </ul>
                    <div className="text-[10px] tracking-widest uppercase text-rh-faint mb-2">Method</div>
                    <p className="text-[11px] text-rh-muted leading-relaxed italic">{recipe.method}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
