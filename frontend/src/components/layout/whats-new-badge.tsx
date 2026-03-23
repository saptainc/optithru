'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function WhatsNewBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function checkNew() {
      const lastSeen = localStorage.getItem('last_seen_changelog_at')
      const supabase = createClient()

      let query = supabase
        .from('changelog_entries')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)

      if (lastSeen) {
        query = query.gt('published_at', lastSeen)
      }

      const { count: newCount } = await query
      setCount(newCount || 0)
    }
    checkNew()
  }, [])

  function markSeen() {
    localStorage.setItem('last_seen_changelog_at', new Date().toISOString())
    setCount(0)
  }

  return (
    <Link
      href="/changelog"
      onClick={markSeen}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>What&apos;s New</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-medium">
          {count}
        </span>
      )}
    </Link>
  )
}
