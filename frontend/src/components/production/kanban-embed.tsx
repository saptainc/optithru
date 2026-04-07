'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function KanbanEmbed() {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initSession() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Not authenticated')
          return
        }

        const res = await fetch('/api/v1/kanban/session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          const body = await res.text()
          setError(`Kanban session failed: ${body}`)
          return
        }

        const data = await res.json()
        // transfer_url is a full URL on the kanban subdomain
        const url = data.transfer_url
        if (url) {
          setIframeSrc(url + (url.includes('?') ? '&' : '?') + 'embed=true')
        } else {
          setError('No transfer URL returned')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load kanban')
      }
    }
    initSession()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground text-sm">
        {error}
      </div>
    )
  }

  if (!iframeSrc) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading kanban board...
      </div>
    )
  }

  return (
    <iframe
      src={iframeSrc}
      className="w-full h-[700px] border-0 rounded-lg"
      allow="clipboard-write"
    />
  )
}
