import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import { BufferStatusBoard } from '@/components/buffers/buffer-status-board'

interface BufferItem {
  variant_id: string
  product_name: string
  category: string
  image_url: string | null
  inventory_quantity: number
  avg_daily_usage: number
  lead_time_days: number
  buffer_quantity: number
  green_zone_qty: number
  yellow_zone_qty: number
  red_zone_qty: number
  current_zone: string
}

export default async function BuffersPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>

  let bufferData: BufferItem[] = []

  // Try RPC first
  const { data: rpcData } = await supabase.rpc('fn_calculate_buffers', { p_org_id: orgId })

  if (rpcData && rpcData.length > 0) {
    bufferData = rpcData
  } else {
    // Fallback: compute from v_product_throughput + order_line_items
    const { data: products } = await supabase
      .from('v_product_throughput')
      .select('variant_id, product_name, category, image_url, inventory_quantity')
      .eq('organization_id', orgId)

    if (products && products.length > 0) {
      // Get order line items from last 90 days to compute ADU
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data: lineItems } = await supabase
        .from('order_line_items')
        .select('variant_id, quantity, orders!inner(organization_id, order_date)')
        .eq('orders.organization_id', orgId)
        .gte('orders.order_date', ninetyDaysAgo.toISOString().split('T')[0])

      // Sum units sold per variant
      const unitsSold: Record<string, number> = {}
      if (lineItems) {
        for (const item of lineItems) {
          const vid = item.variant_id
          if (vid) {
            unitsSold[vid] = (unitsSold[vid] || 0) + (item.quantity || 1)
          }
        }
      }

      const leadTimeDays = 14

      bufferData = products.map((p) => {
        const sold = unitsSold[p.variant_id] || 0
        const adu = Math.max(sold / 90, 0.1)
        const buffer = Math.max(Math.ceil(adu * leadTimeDays * 1.5), 1)
        const zoneSize = Math.floor(buffer / 3)
        const redZone = zoneSize
        const yellowZone = zoneSize
        const greenZone = buffer - 2 * zoneSize
        const inv = p.inventory_quantity || 0

        let currentZone: string
        if (inv <= redZone) {
          currentZone = 'red'
        } else if (inv <= redZone + yellowZone) {
          currentZone = 'yellow'
        } else {
          currentZone = 'green'
        }

        return {
          variant_id: p.variant_id,
          product_name: p.product_name,
          category: p.category || '',
          image_url: p.image_url || null,
          inventory_quantity: inv,
          avg_daily_usage: Math.round(adu * 100) / 100,
          lead_time_days: leadTimeDays,
          buffer_quantity: buffer,
          green_zone_qty: greenZone,
          yellow_zone_qty: yellowZone,
          red_zone_qty: redZone,
          current_zone: currentZone,
        }
      })
    }
  }

  // Sort: red first, then yellow, then green
  const zoneOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 }
  bufferData.sort((a, b) => (zoneOrder[a.current_zone] ?? 3) - (zoneOrder[b.current_zone] ?? 3))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Buffer Management</h1>
          <p className="text-sm text-muted-foreground">
            Inventory buffer status with Green/Yellow/Red zones per SKU. Dynamic buffer adjustments
            based on consumption patterns.
          </p>
        </div>
      </div>

      <BufferStatusBoard buffers={bufferData} />
    </div>
  )
}
