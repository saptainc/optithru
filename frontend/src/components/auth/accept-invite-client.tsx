'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter()
  const hasRun = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthenticated'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function acceptInvite() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setStatus('unauthenticated')
        setMessage('Please log in first to accept this invite.')
        return
      }

      try {
        const response = await fetch('/api/v1/invites/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Invite accepted! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          setStatus('error')
          setMessage(data.detail || 'Failed to accept invite.')
        }
      } catch {
        setStatus('error')
        setMessage('Network error. Please try again.')
      }
    }

    acceptInvite()
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Organization Invite</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Accepting invite...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-green-700 dark:text-green-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{message}</p>
              <Button variant="outline" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <XCircle className="h-8 w-8 text-yellow-500" />
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => router.push(`/login?redirect=/accept-invite?token=${token}`)}>
                Log In
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
