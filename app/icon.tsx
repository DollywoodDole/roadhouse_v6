import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: '#0A0806',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        border: '1px solid #2A2318',
      }}
    >
      <span style={{ color: '#C9922A', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>R</span>
    </div>,
    { ...size }
  )
}
