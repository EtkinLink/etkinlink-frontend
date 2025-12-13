import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.etkinlink.website'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${path}${searchParams ? '?' + searchParams : ''}`

  const headers = new Headers(request.headers)
  // Authorization header'ı proxy'ye geç
  const auth = request.headers.get('authorization')
  if (auth) {
    headers.set('Authorization', auth)
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    // Response status'u direkt dön
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy GET error:', error)
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  const url = `${BACKEND_URL}/${path}`

  const headers = new Headers(request.headers)
  // Authorization header'ı proxy'ye geç
  const auth = request.headers.get('authorization')
  if (auth) {
    headers.set('Authorization', auth)
  }
  headers.set('Content-Type', 'application/json')

  try {
    const body = await request.json()
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy POST error:', error)
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  const url = `${BACKEND_URL}/${path}`

  const headers = new Headers(request.headers)
  const auth = request.headers.get('authorization')
  if (auth) {
    headers.set('Authorization', auth)
  }
  headers.set('Content-Type', 'application/json')

  try {
    const body = await request.json()
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy PUT error:', error)
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  const url = `${BACKEND_URL}/${path}`

  const headers = new Headers(request.headers)
  const auth = request.headers.get('authorization')
  if (auth) {
    headers.set('Authorization', auth)
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy DELETE error:', error)
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
