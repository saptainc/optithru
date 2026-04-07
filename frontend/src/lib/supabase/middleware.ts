import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_URL_INTERNAL = process.env.SUPABASE_URL_INTERNAL || SUPABASE_URL_PUBLIC

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL_PUBLIC,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      global: {
        fetch: (input, init) => {
          const url = input.toString().replace(SUPABASE_URL_PUBLIC, SUPABASE_URL_INTERNAL)
          return fetch(url, init)
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log(`[middleware] ${request.nextUrl.pathname} — user: ${user?.email || 'null'}, error: ${userError?.message || 'none'}, cookies: ${request.cookies.getAll().map(c => c.name).join(', ')}`)

  // Public routes that don't require auth
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/accept-invite', '/demo', '/onboarding', '/admin', '/changelog']
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/rest/')

  // Allow public paths, auth callbacks, and API routes through without auth
  if (!user && !isPublicPath && !isAuthCallback && !isApiRoute) {
    console.log(`[middleware] REDIRECTING to /login — no user for ${request.nextUrl.pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
