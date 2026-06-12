import { NextRequest, NextResponse } from 'next/server'

const GRAPH = 'https://graph.facebook.com/v25.0'
const WARN_DAYS = 14

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${process.env.CRON_SECRET?.trim()}`
}

async function sendAlert(subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to     = process.env.MOTORS_FB_ALERT_EMAIL
  if (!apiKey || !to) return

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'RoadHouse Motors <hello@roadhouse.capital>',
      to:      [to],
      subject,
      text:    body,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[fb-token-check] alert email failed: Resend ${res.status}: ${err}`)
  }
}

// GET /api/motors/fb-token-check — Bearer CRON_SECRET
// Checks FB Page Access Token validity and expiry. Sends Resend alert if token
// expires within WARN_DAYS days or is already invalid.
export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token    = process.env.MOTORS_FB_PAGE_ACCESS_TOKEN
  const appId    = process.env.MOTORS_FB_APP_ID
  const appSecret = process.env.MOTORS_FB_APP_SECRET

  if (!token) {
    return NextResponse.json({ status: 'unconfigured', note: 'MOTORS_FB_PAGE_ACCESS_TOKEN not set — skipping check' })
  }

  // Step 1: basic validity check via /me
  let tokenValid = false
  let pageId     = ''
  try {
    const meRes  = await fetch(`${GRAPH}/me?access_token=${encodeURIComponent(token)}&fields=id,name`)
    const meData = await meRes.json() as { id?: string; name?: string; error?: { message: string } }
    if (meData.error) {
      await sendAlert(
        'ACTION REQUIRED: RoadHouse Motors FB Token Invalid',
        `The Facebook Page Access Token has been invalidated or expired.\n\nError: ${meData.error.message}\n\nRefresh the token at:\nhttps://business.facebook.com → Business Settings → System Users\n\nUpdate MOTORS_FB_PAGE_ACCESS_TOKEN in Vercel and FB_PAGE_ACCESS_TOKEN in GitHub Secrets.`,
      )
      return NextResponse.json({ status: 'invalid', error: meData.error.message })
    }
    tokenValid = true
    pageId     = meData.id ?? ''
  } catch (err) {
    console.error('[fb-token-check] /me request failed:', err)
    return NextResponse.json({ error: 'Failed to reach Graph API' }, { status: 500 })
  }

  // Step 2: expiry check via debug_token (requires app credentials)
  if (tokenValid && appId && appSecret) {
    try {
      const debugUrl = `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`
      const debugRes  = await fetch(debugUrl)
      const debugData = await debugRes.json() as {
        data?: { expires_at?: number; is_valid?: boolean; error?: { message: string } }
        error?: { message: string }
      }

      if (debugData.error || debugData.data?.error) {
        console.warn('[fb-token-check] debug_token error:', debugData.error ?? debugData.data?.error)
      } else if (debugData.data) {
        const { expires_at, is_valid } = debugData.data

        if (!is_valid) {
          await sendAlert(
            'ACTION REQUIRED: RoadHouse Motors FB Token Invalid',
            `The Facebook Page Access Token is no longer valid (debug_token confirmed).\n\nPage ID: ${pageId}\n\nRefresh the token and update:\n• Vercel: MOTORS_FB_PAGE_ACCESS_TOKEN\n• GitHub Secrets: FB_PAGE_ACCESS_TOKEN`,
          )
          return NextResponse.json({ status: 'invalid' })
        }

        // expires_at == 0 means permanent token — no expiry alert needed
        if (expires_at && expires_at > 0) {
          const daysLeft = Math.floor((expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysLeft <= WARN_DAYS) {
            const expiryDate = new Date(expires_at * 1000).toISOString().split('T')[0]
            await sendAlert(
              `WARNING: RoadHouse Motors FB Token Expires in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}`,
              `The Facebook Page Access Token expires on ${expiryDate} (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining).\n\nPage ID: ${pageId}\n\nRefresh the token and update:\n• Vercel: MOTORS_FB_PAGE_ACCESS_TOKEN\n• GitHub Secrets: FB_PAGE_ACCESS_TOKEN\n\nToken refresh: https://business.facebook.com → Business Settings → System Users`,
            )
            return NextResponse.json({ status: 'expiring', daysLeft, expiresAt: expiryDate })
          }
          return NextResponse.json({ status: 'ok', daysLeft })
        }
      }
    } catch (err) {
      console.error('[fb-token-check] debug_token request failed:', err)
    }
  }

  return NextResponse.json({ status: 'ok', pageId, note: appId ? undefined : 'Set MOTORS_FB_APP_ID + MOTORS_FB_APP_SECRET for full expiry check' })
}
