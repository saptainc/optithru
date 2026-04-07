'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink } from 'lucide-react'

interface ActiveCard {
  id: string
  number: number
  title: string
  board: string
  toc_step: string
  target_metric: string
  url: string
}

interface DrawerData {
  my_active_cards: ActiveCard[]
  total_active: number
}

const STEP_LABELS: Record<string, string> = {
  exploit: 'Exploit',
  subordinate: 'Subordinate',
  elevate: 'Elevate',
  protect_buffer: 'Protect Buffer',
}

const METRIC_LABELS: Record<string, string> = {
  throughput: '$T',
  inventory: '$I',
  operating_expense: '$OE',
}

export function TaskDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<DrawerData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch('/api/v1/kanban/toc/drawer', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute top-0 right-0 h-full w-96 bg-background border-l border-border shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Active Focus Tasks</h2>
            <p className="text-xs text-muted-foreground">
              {data ? `${data.total_active} active across all boards` : 'Loading...'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading tasks...
            </div>
          )}

          {!loading && data && data.my_active_cards.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No active focus tasks assigned to you
            </div>
          )}

          {!loading && data && data.my_active_cards.map((card) => (
            <div key={card.id} className="py-3 border-b border-border last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-muted-foreground mr-1">#{card.number}</span>
                    {card.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{card.board}</p>
                </div>
                <a
                  href={`/dashboard/production`}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="flex gap-1.5 mt-2">
                {card.toc_step && (
                  <Badge variant="outline" className="text-[0.6rem]">
                    {STEP_LABELS[card.toc_step] || card.toc_step}
                  </Badge>
                )}
                {card.target_metric && (
                  <Badge variant="outline" className="text-[0.6rem]">
                    {METRIC_LABELS[card.target_metric] || card.target_metric}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
