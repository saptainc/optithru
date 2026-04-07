// ~/throughput-os/frontend/src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_URL_INTERNAL = process.env.SUPABASE_URL_INTERNAL || SUPABASE_URL_PUBLIC

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    SUPABASE_URL_PUBLIC,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* ignore in Server Components */ }
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
}

