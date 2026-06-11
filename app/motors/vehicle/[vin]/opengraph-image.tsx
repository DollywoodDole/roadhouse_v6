import { ImageResponse } from 'next/og'
import { getVehicleByVin, DEALER_ID } from '@/lib/motors/storage'

export const runtime     = 'nodejs'
export const alt         = 'RoadHouse Motors'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const buf  = await res.arrayBuffer()
    const mime = res.headers.get('content-type') ?? 'image/jpeg'
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return null
  }
}

function BrandedFallback() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a08', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ width: 64, height: 3, background: '#C9922A', marginBottom: 36 }} />
      <div style={{ color: '#C9922A', fontSize: 44, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>
        RoadHouse Motors
      </div>
      <div style={{ color: '#E8DCC880', fontSize: 22, marginTop: 20 }}>Saskatchewan Delivery Available</div>
      <div style={{ color: '#4A4238', fontSize: 15, marginTop: 12, letterSpacing: 2 }}>DL331386 · motors.roadhouse.capital</div>
    </div>
  )
}

export default async function VehicleOGImage({
  params,
}: {
  params: Promise<{ vin: string }>
}) {
  const { vin }   = await params
  const vehicle   = await getVehicleByVin(DEALER_ID, vin)

  if (!vehicle) {
    return new ImageResponse(<BrandedFallback />, size)
  }

  const imgSrc = vehicle.images[0]?.startsWith('https://') ? vehicle.images[0] : null
  const imgData = imgSrc ? await imageToBase64(imgSrc) : null

  const label   = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
  const price   = vehicle.price > 0
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(vehicle.price)
    : 'Contact for Price'
  const mileage = `${new Intl.NumberFormat('en-CA').format(vehicle.mileage)} km`
  const specs   = [mileage, vehicle.transmission, vehicle.fuel_type].filter(Boolean).join('  ·  ')

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a08' }}>

        {/* Left — obsidian info panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          width: 460, height: '100%', padding: '52px 44px',
          background: '#0f0d0b',
          borderRight: '1px solid #2A2318',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 3, background: '#C9922A', marginBottom: 24 }} />
            <div style={{ color: '#8A7D6A', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase' }}>
              RoadHouse Motors
            </div>
          </div>

          {/* Vehicle info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: '#E8DCC8', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#F0C060', fontSize: 30, fontWeight: 700 }}>{price}</div>
              {vehicle.price > 0 && (
                <div style={{ color: '#8A7D6A', fontSize: 14 }}>CAD + applicable taxes</div>
              )}
            </div>
            <div style={{ color: '#4A4238', fontSize: 13, marginTop: 4 }}>{specs}</div>
          </div>

          {/* Footer */}
          <div style={{ color: '#3A3228', fontSize: 12, letterSpacing: 1 }}>
            Dealer Licence DL331386 · SK, Canada
          </div>
        </div>

        {/* Right — vehicle image */}
        <div style={{ display: 'flex', flex: 1, height: '100%', background: '#111009', overflow: 'hidden' }}>
          {imgData ? (
            <img src={imgData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#2A2318', fontSize: 16, letterSpacing: 4 }}>NO IMAGE</div>
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}
