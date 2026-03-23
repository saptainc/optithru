'use client'

import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { NotificationBell } from '@/components/layout/notification-bell'

export function Header({ user }: { user: User }) {
  const [exporting, setExporting] = useState(false)
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .limit(1)
        .single()
      if (membership) setOrgId(membership.organization_id)
    }
    loadOrg()
  }, [])

  async function exportReport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .limit(1)
        .single()

      if (!membership) {
        toast.error('No organization found')
        return
      }

      const response = await fetch(`/api/v1/reports/throughput-analysis?org_id=${membership.organization_id}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `throughput-analysis-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
      <h1 className="text-lg font-semibold">Throughput OS</h1>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={exportReport} disabled={exporting}>
          <FileDown className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Report'}
        </Button>
        <NotificationBell organizationId={orgId} />
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </div>
    </header>
  )
}
