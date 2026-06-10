/** @type {import('next').NextConfig} */

const nextConfig = {

  // ── Server external packages ───────────────────────────────────────────────
  // Prevents Next.js from bundling native C++ addons that must be loaded by
  // Node.js directly. bigint-buffer is a native addon pulled in by
  // @solana/web3.js — telling Next.js to treat it as external silences the
  // "Module parse failed" warning and lets Node handle it natively.
  serverExternalPackages: ['bigint-buffer'],


  // ── Turbopack config (Next.js 16 dev server default) ──────────────────────
  // Turbopack needs resolveAlias instead of webpack fallback.
  // Recent Solana wallet adapter versions handle Buffer/process internally,
  // so most polyfills aren't needed — just alias the crypto/stream packages.
  // Turbopack resolveAlias applies to BOTH server and client bundles — unlike webpack's
  // isServer guard. Aliasing http/https to browser shims here breaks SSR for any module
  // that uses Node's https.Agent (e.g. @solana/web3.js Connection). Only alias the
  // pure-JS polyfills that are safe in both environments.
  turbopack: {
    resolveAlias: {
      crypto:  'crypto-browserify',
      stream:  'stream-browserify',
      buffer:  'buffer',
      process: 'process/browser',
      url:     'url',
      assert:  'assert',
    },
  },

  // ── Webpack config (Vercel production builds + next build) ────────────────
  // Turbopack is dev-only; Vercel still uses webpack for `next build`.
  // Both configs must be present.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:      false,
        os:      false,
        path:    false,
        net:     false,
        tls:     false,
        crypto:  require.resolve('crypto-browserify'),
        stream:  require.resolve('stream-browserify'),
        buffer:  require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        zlib:    require.resolve('browserify-zlib'),
        http:    require.resolve('stream-http'),
        https:   require.resolve('https-browserify'),
        url:     require.resolve('url/'),
        assert:  require.resolve('assert/'),
      }

      const webpack = require('webpack')
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer:  ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      )
    }
    return config
  },

  // ── Images ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'kick.com' },
      { protocol: 'https', hostname: 'coconutcowboy.ca' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: '*.ipfs.nftstorage.link' },
      { protocol: 'https', hostname: 'roadhouse.capital' },
      // O'Brian's vehicle photos served from Webflow's CDN
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
    ],
  },

  // ── Security headers ───────────────────────────────────────────────────────
  async headers() {
    // CSP is Report-Only — collect violations for 1–2 weeks before enforcing.
    // Review via: GET /api/csp-report (Authorization: Bearer CRON_SECRET)
    // Tighten script-src / connect-src once Phantom + Stripe violations are mapped.
    const cspDirectives = [
      "default-src 'self'",
      // 'unsafe-inline' required for wallet adapters (Phantom/Solflare inject inline scripts)
      // 'unsafe-eval' required by some Solana/WASM dependencies — audit before removing
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      // Stripe, Solana RPC, Upstash KV (server-side only but harmless to list), Discord, Resend
      "connect-src 'self' https://api.stripe.com https://*.upstash.io wss://*.helius-rpc.com https://*.helius-rpc.com https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://discord.com https://api.resend.com",
      // Stripe payment iframe + Phantom popup
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https://player.kick.com https://*.kick.com",
      "worker-src 'self' blob:",
      "report-uri /api/csp-report",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',               value: 'nosniff' },
          { key: 'X-Frame-Options',                       value: 'DENY' },
          { key: 'X-XSS-Protection',                      value: '1; mode=block' },
          { key: 'Referrer-Policy',                       value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                    value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only',   value: cspDirectives },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|mp4|svg|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },

  // ── Redirects ──────────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'roadhousesyndicate.com' }],
        destination: 'https://roadhouse.capital/:path*',
        permanent: true,
      },
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'www.roadhouse.capital' }],
        destination: 'https://roadhouse.capital/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
