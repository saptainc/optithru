import { NextRequest } from 'next/server'

const KONG_URL = process.env.SUPABASE_URL_INTERNAL || 'http://kong:8000'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info, x-supabase-api-version',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params)
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params)
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params)
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params)
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params)
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/')
  const url = new URL(`/auth/v1/${path}`, KONG_URL)
  url.search = request.nextUrl.search

  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  }

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try { body = await request.text() } catch { body = undefined }
  }

  console.log(`[auth-proxy] ${request.method} ${url.toString()}`)

  const res = await fetch(url.toString(), {
    method: request.method,
    headers,
    body,
  })

  console.log(`[auth-proxy] response: ${res.status}`)

  const responseHeaders = new Headers()
  for (const [key, value] of res.headers.entries()) {
    if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      responseHeaders.set(key, value)
    }
  }
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey, x-client-info, x-supabase-api-version')

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  })
}
