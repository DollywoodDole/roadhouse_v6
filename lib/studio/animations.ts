// RoadHouse Studio — GSAP animation helpers
// Called exclusively from useGSAP / useEffect (client-side only)
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function registerGSAP() {
  gsap.registerPlugin(ScrollTrigger)
}

// ── Scramble text ─────────────────────────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789◆·/'

export function scrambleText(el: Element, finalText: string, durationMs = 700) {
  const totalFrames = Math.ceil(durationMs / 16)
  let frame = 0

  const interval = setInterval(() => {
    const progress = frame / totalFrames
    let output = ''
    for (let i = 0; i < finalText.length; i++) {
      const ch = finalText[i]
      if (ch === ' ' || ch === '.' || ch === '/' || ch === '–') {
        output += ch
      } else if (i / finalText.length < progress) {
        output += ch
      } else {
        output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      }
    }
    el.textContent = output
    frame++
    if (frame >= totalFrames) {
      el.textContent = finalText
      clearInterval(interval)
    }
  }, 16)
}

export function scrambleOnEnter(el: Element, finalText: string) {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.create({
    trigger: el,
    start:   'top 85%',
    once:    true,
    onEnter: () => scrambleText(el, finalText),
  })
}

// ── Hero entrance ─────────────────────────────────────────────────────────────
export function heroEntrance(container: Element) {
  gsap.registerPlugin(ScrollTrigger)

  const lines = container.querySelectorAll('[data-hero-line]')
  gsap.from(lines, {
    y:        40,
    opacity:  0,
    duration: 0.9,
    stagger:  0.13,
    ease:     'power3.out',
  })

  const rule = container.querySelector('[data-hero-rule]')
  if (rule) {
    gsap.from(rule, {
      scaleX:          0,
      transformOrigin: 'left center',
      duration:        0.7,
      delay:           0.45,
      ease:            'power2.out',
    })
  }

  const stats = container.querySelectorAll('[data-stat]')
  if (stats.length) {
    gsap.from(stats, {
      y:        20,
      opacity:  0,
      duration: 0.5,
      stagger:  0.09,
      delay:    0.75,
      ease:     'power2.out',
      onComplete() {
        // Scramble each stat value after fade-in
        container.querySelectorAll('[data-stat-value]').forEach((el) => {
          const val = el.getAttribute('data-stat-final') ?? el.textContent ?? ''
          scrambleText(el, val, 600)
        })
      },
    })
  }
}

// ── Section entrance (generic stagger) ───────────────────────────────────────
export function sectionEntrance(els: NodeListOf<Element> | Element[]) {
  gsap.registerPlugin(ScrollTrigger)
  Array.from(els).forEach((el) => {
    gsap.from(el, {
      y:        40,
      opacity:  0,
      duration: 0.75,
      ease:     'power2.out',
      scrollTrigger: {
        trigger: el,
        start:   'top 88%',
        once:    true,
      },
    })
  })
}

// ── Process entrance (slide-in from left) ────────────────────────────────────
export function processEntrance(steps: NodeListOf<Element> | Element[]) {
  gsap.registerPlugin(ScrollTrigger)
  Array.from(steps).forEach((step, i) => {
    gsap.from(step, {
      x:        -40,
      opacity:  0,
      duration: 0.65,
      ease:     'power2.out',
      delay:    i * 0.07,
      scrollTrigger: {
        trigger: step,
        start:   'top 88%',
        once:    true,
      },
    })
  })
}

// ── Process connecting line (scaleX 0 → 1) ───────────────────────────────────
export function processLine(lineEl: Element) {
  gsap.registerPlugin(ScrollTrigger)
  gsap.fromTo(
    lineEl,
    { scaleX: 0 },
    {
      scaleX:          1,
      transformOrigin: 'left center',
      duration:        1.4,
      ease:            'power3.inOut',
      scrollTrigger: {
        trigger: lineEl,
        start:   'top 80%',
        once:    true,
      },
    }
  )
}
