'use client'

import { useRef, useState, useCallback } from 'react'

export default function StudioAudio() {
  const [muted, setMuted] = useState(true)
  const ctxRef            = useRef<AudioContext | null>(null)

  const toggle = useCallback(() => {
    if (muted) {
      if (!ctxRef.current) {
        const ctx  = new AudioContext()
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 40
        gain.gain.value = 0.03
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        ctxRef.current = ctx
      } else {
        ctxRef.current.resume()
      }
      setMuted(false)
    } else {
      ctxRef.current?.suspend()
      setMuted(true)
    }
  }, [muted])

  return (
    <button
      data-studio-audio
      onClick={toggle}
      aria-label={muted ? 'Enable ambient audio' : 'Disable ambient audio'}
      style={{
        position:             'fixed',
        bottom:               '24px',
        left:                 '24px',
        zIndex:               50,
        background:           'rgba(7,8,10,0.8)',
        border:               `1px solid ${muted ? '#1A1C1F' : 'rgba(200,134,30,0.3)'}`,
        backdropFilter:       'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding:              '8px 12px',
        cursor:               'pointer',
        display:              'flex',
        alignItems:           'center',
        gap:                  '6px',
        fontFamily:           'var(--font-dm-mono-studio)',
        fontSize:             '8px',
        color:                muted ? '#3A3A38' : '#C8861E',
        letterSpacing:        '0.1em',
        textTransform:        'uppercase' as const,
        transition:           'color 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{
        width:        5,
        height:       5,
        borderRadius: '50%',
        background:   muted ? '#2A2520' : '#C8861E',
        transition:   'background 0.15s ease',
        flexShrink:   0,
      }} />
      {muted ? 'SOUND' : 'MUTE'}
    </button>
  )
}
