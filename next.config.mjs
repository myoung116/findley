/** @type {import('next').NextConfig} */

const supabaseHost = 'dwhpszbluhjyrvwidwpi.supabase.co'

const securityHeaders = [
  // Prevent browsers from guessing the content type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow embedding the app in an iframe (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop passing the referrer when navigating to a different origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year (HSTS)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Disable browser features the app doesn't need
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Content Security Policy — tightly scoped to what the app actually uses
  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      // Next.js requires inline scripts for hydration; use nonce in prod for stricter policy
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      // Tailwind inline styles + Supabase Realtime
      `style-src 'self' 'unsafe-inline'`,
      // Supabase API, auth, and storage
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      // Images from self and data URIs
      `img-src 'self' data: blob:`,
      // Fonts served from the app itself
      `font-src 'self'`,
      // No plugins, no object embeds
      `object-src 'none'`,
      // Only load frames from the same origin
      `frame-ancestors 'none'`,
      // Always use HTTPS for any external resources
      `upgrade-insecure-requests`,
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
