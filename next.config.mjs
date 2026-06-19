/** @type {import('next').NextConfig} */
const nextConfig = {
  // Biarkan TypeScript error tidak memblokir build produksi
  typescript: {
    ignoreBuildErrors: true,
  },

  // Aktifkan image optimization bawaan Next.js (WebP/AVIF auto-convert)
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 hari
  },

  // Kompres response dengan gzip/brotli
  compress: true,

  // Cache headers untuk aset statis — browser & CDN cache agresif
  async headers() {
    return [
      {
        // Aset yang di-hash oleh Next.js build (_next/static) — immutable
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Favicon dan file publik lainnya — cache 1 hari
        source: '/:file(favicon.ico|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
      {
        // Security headers untuk semua halaman
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
