import { redirect } from 'next/navigation'
import { AcceptInviteClient } from '@/components/auth/accept-invite-client'

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) redirect('/login')

  return <AcceptInviteClient token={token} />
}
