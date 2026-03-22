import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has an org, create one if not
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!membership) {
          // Create default org
          const { data: org } = await supabase
            .from('organizations')
            .insert({ name: 'My Organization', slug: `org-${user.id.slice(0, 8)}` })
            .select('id')
            .single()

          if (org) {
            await supabase
              .from('organization_members')
              .insert({ user_id: user.id, organization_id: org.id, role: 'owner' })
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
