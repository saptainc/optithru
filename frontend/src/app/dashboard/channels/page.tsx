import { createClient } from '@/lib/supabase/server'
import { Megaphone } from 'lucide-react'
import { ChannelAnalysis } from '@/components/channels/channel-analysis'
import { BudgetReallocationCard } from '@/components/channels/budget-reallocation-card'

export default async function ChannelsPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>

  // Try RPC first
  let channelData: {
    channel: string
    total_spend: number
    total_revenue: number
    estimated_throughput: number
    tcu: number
    conversions: number
    cpa: number
    roas: number
  }[] = []

  const { data: rpcData } = await supabase.rpc('fn_channel_tcu', { p_org_id: orgId })

  if (rpcData && rpcData.length > 0) {
    channelData = rpcData
  } else {
    // Fallback: compute from marketing_spend table
    const { data: spend } = await supabase
      .from('marketing_spend')
      .select('channel, spend, revenue_attributed, conversions')
      .eq('organization_id', orgId)

    const { data: products } = await supabase
      .from('v_product_throughput')
      .select('throughput_margin_pct')
      .eq('organization_id', orgId)

    const avgMargin =
      products && products.length > 0
        ? products.reduce((sum: number, p: { throughput_margin_pct: number | null }) => sum + (p.throughput_margin_pct || 0), 0) /
          products.length /
          100
        : 0.55

    if (spend) {
      const byChannel: Record<string, { spend: number; revenue: number; conversions: number }> = {}
      for (const row of spend) {
        const ch = row.channel || 'unknown'
        if (!byChannel[ch]) byChannel[ch] = { spend: 0, revenue: 0, conversions: 0 }
        byChannel[ch].spend += row.spend || 0
        byChannel[ch].revenue += row.revenue_attributed || 0
        byChannel[ch].conversions += row.conversions || 0
      }

      channelData = Object.entries(byChannel)
        .map(([channel, d]) => ({
          channel,
          total_spend: d.spend,
          total_revenue: d.revenue,
          estimated_throughput: Math.round(d.revenue * avgMargin * 100) / 100,
          tcu: d.spend > 0 ? Math.round((d.revenue * avgMargin / d.spend) * 100) / 100 : 0,
          conversions: d.conversions,
          cpa: d.conversions > 0 ? Math.round((d.spend / d.conversions) * 100) / 100 : 0,
          roas: d.spend > 0 ? Math.round((d.revenue / d.spend) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.tcu - a.tcu)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Marketing Channels</h1>
          <p className="text-sm text-muted-foreground">
            Throughput per constraint unit (T/CU) by marketing channel. Higher T/CU = better ROI on
            spend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChannelAnalysis channels={channelData} />
        </div>
        <BudgetReallocationCard channels={channelData} />
      </div>
    </div>
  )
}
