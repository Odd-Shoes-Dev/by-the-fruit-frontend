/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  async headers() {
    // Security headers shared by every route
    const securityHeaders = [
      { key: 'X-Frame-Options',           value: 'DENY' },
      { key: 'X-Content-Type-Options',    value: 'nosniff' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-XSS-Protection',          value: '1; mode=block' },
    ]

    return [
      {
        // Landing page is public — allow search engines to index it
        source: '/',
        headers: [
          ...securityHeaders,
          { key: 'X-Robots-Tag', value: 'index, follow' },
        ],
      },
      {
        // Sitemap and manifest are public assets
        source: '/(sitemap.xml|manifest.json|robots.txt)',
        headers: securityHeaders,
      },
      {
        // Everything else is private — block all crawlers
        source: '/((?!$|sitemap\\.xml|manifest\\.json|robots\\.txt).*)',
        headers: [
          ...securityHeaders,
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet, noarchive, noimageindex' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
