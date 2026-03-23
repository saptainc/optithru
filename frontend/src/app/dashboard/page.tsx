import { createClient } from '@/lib/supabase/server'
import { DollarSign, Package, TrendingUp, PiggyBank } from 'lucide-react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ThroughputChart } from '@/components/dashboard/throughput-chart'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { ThroughputTrendChart } from '@/components/dashboard/throughput-trend-chart'
import { SnapshotButton } from '@/components/dashboard/snapshot-button'
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel'
import { formatCurrency } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id

  // Try RPC first, fall back to client-side calculation
  let totalThroughput = 0
  let inventoryInvestment = 0
  let totalOE = 0
  let netProfit = 0
  let productCount = 0
  let orderCount = 0

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
      productCount = Number(k.product_count) || 0
      orderCount = Number(k.order_count) || 0
    } else {
      // Fallback: compute client-side from tables
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

      const { data: products } = await supabase
        .from('v_product_throughput')
        .select('inventory_quantity, cogs')

      if (products) {
        productCount = products.length
        for (const p of products) {
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

  // Chart data
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

  // Fetch snapshot history
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

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('order_number, order_date, total, channel')
    .order('order_date', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Throughput Accounting overview</p>
        </div>
        {orgId && (
          <SnapshotButton
            organizationId={orgId}
            kpis={{ totalThroughput, inventoryInvestment, totalOE, netProfit }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Throughput"
          value={formatCurrency(totalThroughput)}
          description="Revenue minus truly variable costs"
          icon={TrendingUp}
          trend="up"
        />
        <KPICard
          title="Inventory Investment"
          value={formatCurrency(inventoryInvestment)}
          description="Capital tied up in stock (at cost)"
          icon={Package}
          trend="neutral"
        />
        <KPICard
          title="Operating Expense"
          value={formatCurrency(totalOE)}
          description="Marketing spend (simplified)"
          icon={DollarSign}
          trend="neutral"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          description={`T - OE = ${formatCurrency(totalThroughput)} - ${formatCurrency(totalOE)}`}
          icon={PiggyBank}
          trend={netProfit > 0 ? 'up' : 'down'}
        />
      </div>

      <ThroughputTrendChart snapshots={snapshots} />

      {orgId && <AIInsightsPanel orgId={orgId} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThroughputChart data={chartData} />
        <RecentOrders orders={recentOrders || []} />
      </div>
    </div>
  )
}
