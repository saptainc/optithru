import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from '@/components/auth/signup-form'

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignupForm />
    </div>
  )
}
