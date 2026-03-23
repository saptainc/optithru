'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Anomaly {
  id: string
  rule_id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  created_at: string
  resolved_at: string | null
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}

const severityTextColors: Record<string, string> = {
  critical: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
}

export function NotificationBell({ organizationId }: { organizationId: string }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchAnomalies() {
      if (!organizationId) return
      const supabase = createClient()
      const { data } = await supabase
        .from('anomalies')
        .select('*')
        .eq('organization_id', organizationId)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      setAnomalies(data || [])
    }
    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 60000)
    return () => clearInterval(interval)
  }, [organizationId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function resolveAnomaly(id: string) {
    const res = await fetch(`/api/v1/anomalies/${id}/resolve`, { method: 'POST' })
    if (res.ok) {
      setAnomalies((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const unresolvedCount = anomalies.length

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
            {unresolvedCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">Alerts</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {anomalies.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No active alerts</p>
            ) : (
              anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="flex items-start gap-3 p-3 border-b last:border-0 hover:bg-accent/50"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${severityColors[anomaly.severity] || severityColors.info}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${severityTextColors[anomaly.severity] || severityTextColors.info}`}>
                      {anomaly.severity.toUpperCase()}
                    </p>
                    <p className="text-sm text-foreground truncate">{anomaly.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(anomaly.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => resolveAnomaly(anomaly.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
