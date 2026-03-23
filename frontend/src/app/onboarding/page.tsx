import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id || ''

  // Check onboarding progress
  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle()

  // If complete, redirect to dashboard
  if (progress?.step === 'complete') redirect('/dashboard')

  return <OnboardingChecklist organizationId={orgId} progress={progress} />
}
