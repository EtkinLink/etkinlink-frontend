import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Only handle /api/* routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.etkinlink.website"

    // Extract the path after /api/
    const apiPath = request.nextUrl.pathname.replace(/^\/api/, "")
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ""

    // Build the backend URL
    const url = new URL(`${apiPath}${queryString}`, backendUrl)

    // Clone the request headers
    const headers = new Headers(request.headers)

    // Remove host header to avoid conflicts
    headers.delete("host")

    // Build request options
    const requestInit: RequestInit = {
      method: request.method,
      headers: headers,
    }

    // Add body for POST, PUT, PATCH requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      const body = await request.text()
      if (body) {
        requestInit.body = body
      }
    }

    try {
      // Forward the request to the backend
      const response = await fetch(url.toString(), requestInit)

      // Clone response headers
      const responseHeaders = new Headers(response.headers)

      // Create a new response with the backend response
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    } catch (error) {
      console.error("Middleware proxy error:", error)
      return new NextResponse(
        JSON.stringify({ error: { message: "Proxy error" } }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
