import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Restrict to admin user
  if (user.email !== 'hari@1in3in5.org') redirect('/dashboard')

  // Fetch admin data
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, created_at')

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id, user_id, role, created_at')

  return (
    <AdminDashboard
      organizations={orgs || []}
      subscriptions={subs || []}
      members={members || []}
    />
  )
}
