/** @type {import('next').NextConfig} */

/* Plan §10 — reliability and performance as a design requirement.
   Multi-layer caching, modern image formats and security headers
   configured here rather than deferred to a later phase. */

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    // WebP/AVIF keep heavy property galleries fast, not just
    // good-looking (Plan §10).
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Immutable static assets.
        source: '/img/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Health checks must never be served from a cache.
        source: '/api/health',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        // Admin pages must never be cached by an intermediary.
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },

  async redirects() {
    // Routes that moved in the business-plan restructure.
    return [
      { source: '/tools/survey-lookup', destination: '/verification#review', permanent: true },
      { source: '/tools/price-estimator', destination: '/tools/corridor-comparison', permanent: true },
      { source: '/tools/land-evaluator', destination: '/tools/jda-readiness', permanent: true },
      { source: '/admin/blueprint', destination: '/admin/plan', permanent: true },
      { source: '/admin/feasibility', destination: '/admin/plan', permanent: true },
      { source: '/admin/vision', destination: '/admin/plan', permanent: true },
      { source: '/admin', destination: '/admin/dashboard', permanent: false },
    ]
  },
}

module.exports = nextConfig
