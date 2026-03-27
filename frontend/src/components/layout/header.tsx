'use client'

import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { FileDown, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { NotificationBell } from '@/components/layout/notification-bell'
import { AskAIPanel } from '@/components/layout/ask-ai-panel'
import { ProfileDropdown } from '@/components/layout/profile-dropdown'

export function Header({ user }: { user: User }) {
  const [exporting, setExporting] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

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
    <>
    <header className="h-12 border-b border-border flex items-center justify-between px-5 bg-background sticky top-0 z-30">
      <h1 className="text-[0.85rem] font-medium text-muted-foreground">Throughput Accounting</h1>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={exportReport}
          disabled={exporting}
          className="fizzy-pill gap-1.5 cursor-pointer"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAiPanelOpen(true)}
          className="fizzy-pill gap-1.5 text-primary cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>
        <NotificationBell organizationId={orgId} />
        <ProfileDropdown
          email={user.email || ''}
          initials={(user.email || 'U')[0].toUpperCase()}
        />
      </div>
    </header>
    <AskAIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
    </>
  )
}
