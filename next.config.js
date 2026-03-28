/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages — only during production builds.
  // During `npm run dev`, output is omitted so API routes work normally
  // (they are legacy dead code but Next.js dev server still parses them).
  // static export for Cloudflare Pages (only enable if NOT on Vercel)
  // ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),

  images: {
    // Required when using output: 'export'
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  swcMinify: false,
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  // Environment variable forwarded to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787',
  },
}

module.exports = nextConfig
