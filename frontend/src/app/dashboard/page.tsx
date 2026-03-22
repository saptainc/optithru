import { createClient } from '@/lib/supabase/server'
import { DollarSign, Package, TrendingUp, PiggyBank } from 'lucide-react'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ThroughputChart } from '@/components/dashboard/throughput-chart'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { formatCurrency, formatPercent } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch product throughput data from the view
  const { data: products } = await supabase
    .from('v_product_throughput')
    .select('product_name, price, cogs, throughput_per_unit, throughput_margin_pct, inventory_quantity')
    .order('throughput_per_unit', { ascending: false })

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('order_number, order_date, total, channel')
    .order('order_date', { ascending: false })
    .limit(8)

  // Fetch all orders for total throughput calculation
  const { data: allLineItems } = await supabase
    .from('order_line_items')
    .select(`
      quantity,
      unit_price,
      product_variant_id,
      product_variants (cogs, shipping_cost, payment_processing_pct, payment_processing_fixed)
    `)

  // Fetch marketing spend for OE
  const { data: marketingSpend } = await supabase
    .from('marketing_spend')
    .select('spend')

  // ---- Calculate KPIs ----

  // Total Throughput: sum of (price - TVC) * qty across all line items
  let totalThroughput = 0
  if (allLineItems) {
    for (const li of allLineItems) {
      const pv = (li as any).product_variants
      if (pv) {
        const processing = li.unit_price * (pv.payment_processing_pct || 0.029) + (pv.payment_processing_fixed || 0.30)
        const tvc = (pv.cogs || 0) + (pv.shipping_cost || 0) + processing
        const throughputPerUnit = li.unit_price - tvc
        totalThroughput += throughputPerUnit * li.quantity
      }
    }
  }

  // Inventory Investment: sum of (qty * cogs)
  let inventoryInvestment = 0
  if (products) {
    for (const p of products) {
      inventoryInvestment += (p.inventory_quantity || 0) * (p.cogs || 0)
    }
  }

  // Operating Expense: sum of marketing spend (simplified — real OE would include salaries etc.)
  let totalOE = 0
  if (marketingSpend) {
    totalOE = marketingSpend.reduce((sum, ms) => sum + (ms.spend || 0), 0)
  }

  // Net Profit
  const netProfit = totalThroughput - totalOE

  // Chart data: top 10 products by throughput/unit
  const chartData = (products || []).slice(0, 10).map((p) => ({
    name: p.product_name.length > 25 ? p.product_name.slice(0, 25) + '...' : p.product_name,
    throughput: p.throughput_per_unit,
    margin: p.throughput_margin_pct,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Throughput Accounting overview</p>
      </div>

      {/* KPI Cards */}
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

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThroughputChart data={chartData} />
        <RecentOrders orders={recentOrders || []} />
      </div>
    </div>
  )
}
