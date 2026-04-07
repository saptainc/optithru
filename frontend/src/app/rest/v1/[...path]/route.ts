import { NextRequest } from 'next/server'

const KONG_URL = process.env.SUPABASE_URL_INTERNAL || 'http://kong:8000'

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
  const url = new URL(`/rest/v1/${path}`, KONG_URL)
  url.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')

  const res = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
  })

  const responseHeaders = new Headers(res.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey, x-client-info, Prefer, Range')

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  })
}
