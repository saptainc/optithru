import { createClient } from '@/lib/supabase/server'
import { DollarSign, Package, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { BufferAlerts } from '@/components/dashboard/buffer-alerts'
import { ConstraintStatus } from '@/components/dashboard/constraint-status'
import { ThroughputChart } from '@/components/dashboard/throughput-chart'
import { ChannelThroughputChart } from '@/components/dashboard/channel-throughput'
import { ThroughputTrendChart } from '@/components/dashboard/throughput-trend-chart'
import { SnapshotButton } from '@/components/dashboard/snapshot-button'
import { formatCurrency } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id

  // ── Row 1: Macro KPIs ──
  let totalThroughput = 0
  let inventoryInvestment = 0
  let totalOE = 0
  let netProfit = 0

  if (orgId) {
    const { data: kpis } = await supabase.rpc('fn_system_kpis', {
      p_org_id: orgId,
    })

    if (kpis && kpis.length > 0) {
      const k = kpis[0]
      totalThroughput = Number(k.total_throughput) || 0
      inventoryInvestment = Number(k.total_inventory_investment) || 0
      totalOE = Number(k.total_operating_expense) || 0
      netProfit = Number(k.net_profit) || 0
    } else {
      // Fallback: compute from tables
      const { data: allLineItems } = await supabase
        .from('order_line_items')
        .select(`
          quantity,
          unit_price,
          product_variant_id,
          product_variants (cogs, shipping_cost, payment_processing_pct, payment_processing_fixed)
        `)

      if (allLineItems) {
        for (const li of allLineItems) {
          const pv = (li as Record<string, unknown>).product_variants as Record<string, number> | null
          if (pv) {
            const processing = li.unit_price * (pv.payment_processing_pct || 0.029) + (pv.payment_processing_fixed || 0.30)
            const tvc = (pv.cogs || 0) + (pv.shipping_cost || 0) + processing
            totalThroughput += (li.unit_price - tvc) * li.quantity
          }
        }
      }

      const { data: invProducts } = await supabase
        .from('v_product_throughput')
        .select('inventory_quantity, cogs')

      if (invProducts) {
        for (const p of invProducts) {
          inventoryInvestment += (p.inventory_quantity || 0) * (p.cogs || 0)
        }
      }

      const { data: marketingSpend } = await supabase
        .from('marketing_spend')
        .select('spend')

      if (marketingSpend) {
        totalOE = marketingSpend.reduce((sum: number, ms: { spend: number }) => sum + (ms.spend || 0), 0)
      }

      netProfit = totalThroughput - totalOE
    }
  }

  const roi = inventoryInvestment > 0 ? (netProfit / inventoryInvestment) : 0

  // ── Row 2: Buffer alerts (Red/Yellow only) + Active Constraint ──
  let bufferAlerts: { variant_id: string; product_name: string; current_zone: string; inventory_quantity: number; buffer_quantity: number; avg_daily_usage: number }[] = []
  if (orgId) {
    const { data: bufferData } = await supabase.rpc('fn_calculate_buffers', {
      p_org_id: orgId,
    })
    if (bufferData) {
      bufferAlerts = bufferData
        .filter((b: Record<string, unknown>) => b.current_zone === 'red' || b.current_zone === 'yellow')
        .map((b: Record<string, unknown>) => ({
          variant_id: String(b.variant_id),
          product_name: String(b.product_name),
          current_zone: String(b.current_zone),
          inventory_quantity: Number(b.inventory_quantity) || 0,
          buffer_quantity: Number(b.buffer_quantity) || 0,
          avg_daily_usage: Number(b.avg_daily_usage) || 0,
        }))
    }
  }

  let activeConstraint: { id: string; name: string; type: string; capacity: number; is_active: boolean } | null = null
  if (orgId) {
    const { data: constraintData } = await supabase
      .from('constraints')
      .select('id, name, type, capacity, is_active')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (constraintData) {
      activeConstraint = constraintData
    }
  }

  // ── Row 3: Top products by T/CU + Channel throughput ──
  const { data: products } = await supabase
    .from('v_product_throughput')
    .select('product_name, price, cogs, throughput_per_unit, throughput_margin_pct, inventory_quantity')
    .order('throughput_per_unit', { ascending: false })
    .limit(10)

  const chartData = (products || []).map((p) => ({
    name: p.product_name.length > 25 ? p.product_name.slice(0, 25) + '...' : p.product_name,
    throughput: p.throughput_per_unit,
    margin: p.throughput_margin_pct,
  }))

  let channelThroughput: { channel: string; throughput: number }[] = []
  if (orgId) {
    const { data: channelData } = await supabase.rpc('fn_channel_tcu', {
      p_org_id: orgId,
    })
    if (channelData) {
      channelThroughput = channelData.map((c: Record<string, unknown>) => ({
        channel: String(c.channel),
        throughput: Number(c.revenue || 0) - Number(c.spend || 0),
      }))
        .sort((a: { throughput: number }, b: { throughput: number }) => b.throughput - a.throughput)
    }
  }

  // ── Row 4: 30-day trend ──
  let snapshots: { snapshot_date: string; total_throughput: number; net_profit: number; total_inventory: number; total_operating_expense: number }[] = []
  if (orgId) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: snapshotData } = await supabase
      .from('toc_snapshots')
      .select('snapshot_date, total_throughput, net_profit, total_inventory, total_operating_expense')
      .eq('organization_id', orgId)
      .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })
    snapshots = snapshotData || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.5rem] font-black tracking-tight">Executive Dashboard</h1>
          <p className="text-[0.85rem] text-muted-foreground">
            Identify · Exploit · Subordinate · Elevate
          </p>
        </div>
        {orgId && (
          <SnapshotButton
            organizationId={orgId}
            kpis={{ totalThroughput, inventoryInvestment, totalOE, netProfit }}
          />
        )}
      </div>

      {/* Row 1: The Global Goal — 5 macro KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          title="Throughput ($T)"
          value={formatCurrency(totalThroughput)}
          description="Revenue minus truly variable costs"
          icon={TrendingUp}
          trend="neutral"
        />
        <KPICard
          title="Investment ($I)"
          value={formatCurrency(inventoryInvestment)}
          description="Money tied up in things to be sold"
          icon={Package}
          trend="neutral"
        />
        <KPICard
          title="Operating Exp ($OE)"
          value={formatCurrency(totalOE)}
          description="Money spent turning $I into $T"
          icon={DollarSign}
          trend="neutral"
        />
        <KPICard
          title="Net Profit ($NP)"
          value={formatCurrency(netProfit)}
          description="$T minus $OE"
          icon={PiggyBank}
          trend="neutral"
        />
        <KPICard
          title="ROI"
          value={`${(roi * 100).toFixed(1)}%`}
          description="($T − $OE) ÷ $I"
          icon={BarChart3}
          trend="neutral"
        />
      </div>

      {/* Row 2: Flow Protection — Buffer threats + Active Constraint */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        <BufferAlerts buffers={bufferAlerts} />
        <ConstraintStatus constraint={activeConstraint} />
      </div>

      {/* Row 3: Profit Drivers — T/CU ranking + Channel $T */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ThroughputChart data={chartData} />
        <ChannelThroughputChart channels={channelThroughput} />
      </div>

      {/* Row 4: Context & Trends — 30-day T vs OE */}
      <ThroughputTrendChart snapshots={snapshots} />
    </div>
  )
}
