import type { NextConfig } from "next"

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.etkinlink.website"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
