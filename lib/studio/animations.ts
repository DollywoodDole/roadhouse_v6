// RoadHouse Studio — GSAP animation helpers
// Called exclusively from useGSAP / useEffect (client-side only)
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function registerGSAP() {
  gsap.registerPlugin(ScrollTrigger)
}

export function heroEntrance(container: Element) {
  // registerPlugin is idempotent — safe to call here as fallback
  gsap.registerPlugin(ScrollTrigger)

  const lines = container.querySelectorAll('[data-hero-line]')
  gsap.from(lines, {
    y: 40,
    opacity: 0,
    duration: 0.9,
    stagger: 0.13,
    ease: 'power3.out',
  })

  const rule = container.querySelector('[data-hero-rule]')
  if (rule) {
    gsap.from(rule, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.7,
      delay: 0.45,
      ease: 'power2.out',
    })
  }

  const stats = container.querySelectorAll('[data-stat]')
  if (stats.length) {
    gsap.from(stats, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.09,
      delay: 0.75,
      ease: 'power2.out',
    })
  }
}

export function sectionEntrance(els: NodeListOf<Element> | Element[]) {
  gsap.registerPlugin(ScrollTrigger)
  Array.from(els).forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.75,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    })
  })
}

export function processEntrance(steps: NodeListOf<Element> | Element[]) {
  gsap.registerPlugin(ScrollTrigger)
  Array.from(steps).forEach((step, i) => {
    gsap.from(step, {
      x: -50,
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 88%',
        once: true,
      },
      delay: i * 0.07,
    })
  })
}
