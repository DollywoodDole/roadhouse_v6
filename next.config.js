/** @type {import('next').NextConfig} */

const nextConfig = {

  // ── Turbopack config (Next.js 16 dev server default) ──────────────────────
  // Turbopack needs resolveAlias instead of webpack fallback.
  // Recent Solana wallet adapter versions handle Buffer/process internally,
  // so most polyfills aren't needed — just alias the crypto/stream packages.
  turbopack: {
    resolveAlias: {
      crypto:  'crypto-browserify',
      stream:  'stream-browserify',
      buffer:  'buffer',
      process: 'process/browser',
      zlib:    'browserify-zlib',
      http:    'stream-http',
      https:   'https-browserify',
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
    ],
  },

  // ── Security headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
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
