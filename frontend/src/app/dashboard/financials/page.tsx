import { createClient } from '@/lib/supabase/server'
import { DollarSign } from 'lucide-react'
import { ThroughputWaterfall } from '@/components/financials/throughput-waterfall'
import { ThroughputPnL, type PnLData } from '@/components/financials/throughput-pnl'

export default async function FinancialsPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id

  if (!orgId) {
    return <div className="text-muted-foreground">No organization found.</div>
  }

  // Try RPC first, fall back to client-side computation
  let revenue = 0
  let totalThroughput = 0
  let inventoryInvestment = 0
  let totalOE = 0

  const { data: kpis } = await supabase.rpc('fn_system_kpis', {
    p_org_id: orgId,
  })

  if (kpis && kpis.length > 0) {
    const k = kpis[0]
    totalThroughput = Number(k.total_throughput) || 0
    inventoryInvestment = Number(k.total_inventory_investment) || 0
    totalOE = Number(k.total_operating_expense) || 0

    // Get revenue from orders
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('organization_id', orgId)

    if (orders) {
      revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    }
  } else {
    // Fallback: compute from tables
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('organization_id', orgId)

    if (orders) {
      revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    }

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
      .eq('organization_id', orgId)

    if (products) {
      for (const p of products) {
        inventoryInvestment += (p.inventory_quantity || 0) * (p.cogs || 0)
      }
    }

    const { data: marketingSpend } = await supabase
      .from('marketing_spend')
      .select('spend')
      .eq('organization_id', orgId)

    if (marketingSpend) {
      totalOE = marketingSpend.reduce((sum: number, ms: { spend: number }) => sum + (ms.spend || 0), 0)
    }
  }

  const tvc = revenue - totalThroughput
  const netProfit = totalThroughput - totalOE
  const investment = inventoryInvestment
  const roi = investment > 0 ? netProfit / investment : 0
  const productivity = totalOE > 0 ? totalThroughput / totalOE : 0
  const investmentTurns = investment > 0 ? totalThroughput / investment : 0

  const waterfallData = {
    revenue,
    tvc,
    throughput: totalThroughput,
    operating_expense: totalOE,
    net_profit: netProfit,
  }

  const pnlData: PnLData = {
    revenue,
    tvc,
    throughput: totalThroughput,
    operating_expense: totalOE,
    net_profit: netProfit,
    investment,
    roi,
    productivity,
    investment_turns: investmentTurns,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Financials</h1>
          <p className="text-sm text-muted-foreground">
            Throughput Accounting P&L and financial metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThroughputWaterfall data={waterfallData} />
        <ThroughputPnL data={pnlData} />
      </div>
    </div>
  )
}
