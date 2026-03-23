import { createClient } from '@/lib/supabase/server'
import { FlaskConical } from 'lucide-react'
import { WhatIfSimulator } from '@/components/simulate/what-if-simulator'

export default async function SimulatePage() {
  const supabase = await createClient()

  // Get org ID
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>

  // Fetch baseline KPIs (RPC-first, fallback to manual calc)
  let totalThroughput = 0
  let totalOE = 0
  let netProfit = 0
  let inventoryInvestment = 0

  const { data: kpis } = await supabase.rpc('fn_system_kpis', { p_org_id: orgId })
  if (kpis && kpis.length > 0) {
    const k = kpis[0]
    totalThroughput = Number(k.total_throughput) || 0
    totalOE = Number(k.total_operating_expense) || 0
    netProfit = Number(k.net_profit) || 0
    inventoryInvestment = Number(k.total_inventory_investment) || 0
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

    const { data: marketingSpend } = await supabase
      .from('marketing_spend')
      .select('spend')
    if (marketingSpend) {
      totalOE = marketingSpend.reduce((sum: number, ms: { spend: number }) => sum + (ms.spend || 0), 0)
    }
    netProfit = totalThroughput - totalOE
  }

  // Fetch products from v_product_throughput
  const { data: productsRaw } = await supabase
    .from('v_product_throughput')
    .select('variant_id, product_name, category, price, cogs, throughput_per_unit, inventory_quantity')
    .eq('organization_id', orgId)
    .order('throughput_per_unit', { ascending: false })

  const products = (productsRaw || []).map(p => ({
    variant_id: p.variant_id as string,
    product_name: p.product_name as string,
    category: (p.category as string) || '',
    price: Number(p.price) || 0,
    cogs: Number(p.cogs) || 0,
    throughput_per_unit: Number(p.throughput_per_unit) || 0,
    inventory_quantity: Number(p.inventory_quantity) || 0,
    inventory_investment: (Number(p.inventory_quantity) || 0) * (Number(p.cogs) || 0),
  }))

  // Compute inventory investment from products if not from RPC
  if (!inventoryInvestment) {
    inventoryInvestment = products.reduce((sum, p) => sum + p.inventory_investment, 0)
  }

  // Fetch marketing channels (aggregated by channel)
  let channelData: Array<{ channel: string; total_spend: number; estimated_throughput: number }> = []

  const { data: rpcChannels } = await supabase.rpc('fn_channel_tcu', { p_org_id: orgId })
  if (rpcChannels && rpcChannels.length > 0) {
    channelData = rpcChannels.map((c: Record<string, unknown>) => ({
      channel: String(c.channel),
      total_spend: Number(c.total_spend) || 0,
      estimated_throughput: Number(c.estimated_throughput) || 0,
    }))
  } else {
    const { data: spend } = await supabase
      .from('marketing_spend')
      .select('channel, spend, revenue_attributed')
      .eq('organization_id', orgId)

    const avgMargin = products.length > 0 ? 0.55 : 0.55

    if (spend) {
      const byChannel: Record<string, { spend: number; revenue: number }> = {}
      for (const row of spend) {
        const ch = (row.channel as string) || 'unknown'
        if (!byChannel[ch]) byChannel[ch] = { spend: 0, revenue: 0 }
        byChannel[ch].spend += Number(row.spend) || 0
        byChannel[ch].revenue += Number(row.revenue_attributed) || 0
      }
      channelData = Object.entries(byChannel).map(([channel, d]) => ({
        channel,
        total_spend: d.spend,
        estimated_throughput: Math.round(d.revenue * avgMargin * 100) / 100,
      }))
    }
  }

  // Fetch constraints
  const { data: constraintsRaw } = await supabase
    .from('constraints')
    .select('id, name, type, capacity, is_active')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })

  const constraintsList = (constraintsRaw || []).map(c => ({
    id: c.id as string,
    name: c.name as string,
    type: (c.type as string) || '',
    capacity: Number(c.capacity) || 0,
    is_active: Boolean(c.is_active),
  }))

  const baseline = {
    throughput: totalThroughput,
    oe: totalOE,
    netProfit,
    investment: inventoryInvestment,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">What-If Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Model scenarios: price changes, budget reallocation, SKU discontinuation, constraint changes. See projected throughput impact.
          </p>
        </div>
      </div>

      <WhatIfSimulator
        organizationId={orgId}
        baseline={baseline}
        products={products}
        channels={channelData}
        constraints={constraintsList}
      />
    </div>
  )
}
