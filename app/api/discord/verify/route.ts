/**
 * RoadHouse Capital — Discord Verification Endpoint
 * ───────────────────────────────────────────────────
 * Magic link flow that links a Discord user ID to a Stripe subscription.
 *
 * GET  /api/discord/verify?t=TOKEN&id=DISCORD_USER_ID
 *      → Returns an HTML form for the user to enter their subscription email.
 *
 * POST /api/discord/verify
 *      Body: { token, discordUserId, email }
 *      → Validates token, looks up Stripe customer, saves discord_user_id to
 *        Stripe customer metadata, then grants the appropriate Discord role.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/discord-verify'
import { stripe } from '@/lib/stripe'
import { getMembershipTier } from '@/lib/membership'
import { grantMembershipRole } from '@/lib/discord'

// ── GET — serve verification form ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token         = searchParams.get('t') ?? ''
  const discordUserId = searchParams.get('id') ?? ''

  // Quick structural check before rendering the form
  if (!token || !discordUserId) {
    return htmlResponse(errorPage('Invalid link. Please run /verify again in Discord.'))
  }

  const result = await verifyToken(token)
  if (!result.valid || result.discordUserId !== discordUserId) {
    const msg = result.error === 'Token expired'
      ? 'This link has expired (15-minute limit). Please run /verify again in Discord.'
      : 'Invalid or tampered link. Please run /verify again in Discord.'
    return htmlResponse(errorPage(msg))
  }

  return htmlResponse(verifyForm(token, discordUserId))
}

// ── POST — complete verification ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { token?: string; discordUserId?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token = '', discordUserId = '', email = '' } = body

  if (!token || !discordUserId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate magic link token
  const tokenResult = await verifyToken(token)
  if (!tokenResult.valid || tokenResult.discordUserId !== discordUserId) {
    return NextResponse.json(
      { error: tokenResult.error ?? 'Invalid token' },
      { status: 401 }
    )
  }

  // Find Stripe customer by email
  const customers = await stripe.customers.list({ email: email.toLowerCase().trim(), limit: 5 })
  if (customers.data.length === 0) {
    return NextResponse.json(
      { error: 'No subscription found for that email address. Check your email or join at roadhouse.capital.' },
      { status: 404 }
    )
  }

  // Use the most recent customer record
  const customer = customers.data[0]

  // Find their active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status:   'active',
    limit:    1,
  })

  const activeSub = subscriptions.data[0]
  if (!activeSub) {
    return NextResponse.json(
      { error: 'No active subscription found. Visit roadhouse.capital to subscribe.' },
      { status: 404 }
    )
  }

  // Save discord_user_id to Stripe customer metadata
  await stripe.customers.update(customer.id, {
    metadata: { ...customer.metadata, discord_user_id: discordUserId },
  })

  // Also update the subscription metadata for webhook handlers
  await stripe.subscriptions.update(activeSub.id, {
    metadata: { ...activeSub.metadata, discord_user_id: discordUserId },
  })

  // Determine tier and grant Discord role
  const priceId = activeSub.items.data[0]?.price?.id
  const tier    = priceId ? getMembershipTier(priceId) : null

  if (tier) {
    await grantMembershipRole(discordUserId, tier)
    console.log(JSON.stringify({
      evt:          'discord.verify.success',
      discordUserId,
      customerId:   customer.id,
      tier,
    }))
    return NextResponse.json({ success: true, tier })
  }

  // Customer exists and subscribed, but price ID isn't a membership tier
  console.warn(JSON.stringify({
    evt:          'discord.verify.unknown_tier',
    discordUserId,
    customerId:   customer.id,
    priceId,
  }))
  return NextResponse.json(
    { error: 'Subscription found but could not determine membership tier. Contact support.' },
    { status: 422 }
  )
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function htmlResponse(body: string): NextResponse {
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function verifyForm(token: string, discordUserId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Discord — RoadHouse</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0A0806; color: #E8DCC8;
      font-family: 'Georgia', serif;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1A1712; border: 1px solid #2A2318;
      border-radius: 8px; padding: 2.5rem; max-width: 440px; width: 100%;
    }
    h1 { font-size: 1.4rem; color: #C9922A; margin-bottom: 0.5rem; }
    p  { color: #8A7D6A; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6; }
    label { display: block; font-size: 0.85rem; color: #E8D5A0; margin-bottom: 0.4rem; }
    input[type="email"] {
      width: 100%; padding: 0.65rem 0.9rem;
      background: #111009; border: 1px solid #2A2318; border-radius: 4px;
      color: #E8DCC8; font-size: 0.95rem; margin-bottom: 1.25rem;
    }
    input[type="email"]:focus { outline: none; border-color: #C9922A; }
    button {
      width: 100%; padding: 0.75rem;
      background: #C9922A; color: #0A0806;
      border: none; border-radius: 4px; font-size: 0.95rem; font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    #msg { margin-top: 1rem; font-size: 0.875rem; text-align: center; }
    .success { color: #4ade80; }
    .error   { color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link Your Membership</h1>
    <p>Enter the email address you used to subscribe at roadhouse.capital. Your Discord role will be assigned automatically.</p>
    <form id="form">
      <label for="email">Subscription email</label>
      <input type="email" id="email" name="email" placeholder="you@example.com" required autocomplete="email">
      <button type="submit" id="btn">Verify &amp; assign role</button>
    </form>
    <div id="msg"></div>
  </div>
  <script>
    const form = document.getElementById('form')
    const btn  = document.getElementById('btn')
    const msg  = document.getElementById('msg')

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      btn.disabled = true
      btn.textContent = 'Verifying…'
      msg.textContent = ''
      msg.className   = ''

      try {
        const res = await fetch('/api/discord/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token:         ${JSON.stringify(token)},
            discordUserId: ${JSON.stringify(discordUserId)},
            email:         document.getElementById('email').value.trim(),
          }),
        })
        const data = await res.json()
        if (res.ok) {
          msg.className   = 'success'
          msg.textContent = '✓ Verified! Your Discord role has been assigned. You can close this tab.'
          form.style.display = 'none'
        } else {
          msg.className   = 'error'
          msg.textContent = data.error ?? 'Verification failed. Please try again.'
          btn.disabled    = false
          btn.textContent = 'Verify & assign role'
        }
      } catch {
        msg.className   = 'error'
        msg.textContent = 'Network error. Please try again.'
        btn.disabled    = false
        btn.textContent = 'Verify & assign role'
      }
    })
  </script>
</body>
</html>`
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Error — RoadHouse</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0A0806; color: #E8DCC8;
      font-family: 'Georgia', serif;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1A1712; border: 1px solid #2A2318;
      border-radius: 8px; padding: 2.5rem; max-width: 440px; width: 100%;
      text-align: center;
    }
    h1 { font-size: 1.2rem; color: #f87171; margin-bottom: 1rem; }
    p  { color: #8A7D6A; font-size: 0.9rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Verification Failed</h1>
    <p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  </div>
</body>
</html>`
}
