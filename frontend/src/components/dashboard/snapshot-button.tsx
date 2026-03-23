'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SnapshotButtonProps {
  organizationId: string
  kpis: {
    totalThroughput: number
    inventoryInvestment: number
    totalOE: number
    netProfit: number
  }
}

export function SnapshotButton({ organizationId, kpis }: SnapshotButtonProps) {
  const [loading, setLoading] = useState(false)

  async function captureSnapshot() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Try RPC first
      const { error: rpcError } = await supabase.rpc('fn_capture_snapshot', {
        p_org_id: organizationId,
      })

      if (!rpcError) {
        toast.success('Snapshot captured successfully')
        setLoading(false)
        return
      }

      // Fallback: direct insert
      const roi = kpis.inventoryInvestment > 0
        ? Math.round((kpis.netProfit / kpis.inventoryInvestment) * 10000) / 100
        : 0
      const productivity = kpis.totalOE > 0
        ? Math.round((kpis.totalThroughput / kpis.totalOE) * 10000) / 10000
        : 0

      const { error } = await supabase.from('toc_snapshots').insert({
        organization_id: organizationId,
        snapshot_date: new Date().toISOString().split('T')[0],
        total_throughput: kpis.totalThroughput,
        total_inventory: kpis.inventoryInvestment,
        total_operating_expense: kpis.totalOE,
        net_profit: kpis.netProfit,
        roi,
        productivity,
      })

      if (error) throw error
      toast.success('Snapshot captured successfully')
    } catch (err) {
      toast.error('Failed to capture snapshot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={captureSnapshot} disabled={loading}>
      <Camera className="h-4 w-4 mr-2" />
      {loading ? 'Capturing...' : 'Capture Snapshot'}
    </Button>
  )
}
