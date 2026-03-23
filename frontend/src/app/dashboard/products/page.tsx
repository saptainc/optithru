import { createClient } from '@/lib/supabase/server'
import { Package } from 'lucide-react'
import { ProductTable } from '@/components/products/product-table'
import { CapitalTrapTable, type CapitalTrapData } from '@/components/products/capital-trap-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ProductsPage() {
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

  const { data: products, error } = await supabase
    .from('v_product_throughput')
    .select('*')
    .eq('organization_id', orgId)
    .order('throughput_per_unit', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading products: {error.message}</div>
  }

  // Compute capital trap data
  // Try RPC first
  let capitalTrapData: CapitalTrapData[] = []

  const { data: rpcResult } = await supabase.rpc('fn_dollar_days', {
    p_org_id: orgId,
  })

  if (rpcResult && rpcResult.length > 0) {
    capitalTrapData = rpcResult.map((r: Record<string, unknown>) => ({
      variant_id: String(r.variant_id || ''),
      product_name: String(r.product_name || ''),
      category: String(r.category || 'Other'),
      inventory_quantity: Number(r.inventory_quantity) || 0,
      cogs: Number(r.cogs) || 0,
      throughput_per_unit: Number(r.throughput_per_unit) || 0,
      avg_days_in_stock: Number(r.avg_days_in_stock) || 0,
      idd: Number(r.idd) || 0,
      tdd: Number(r.tdd) || 0,
      idd_tdd_ratio: Number(r.idd_tdd_ratio) || 0,
      is_capital_trap: Boolean(r.is_capital_trap),
    }))
  } else {
    // Fallback: compute client-side from v_product_throughput
    // Get units sold per variant from order_line_items
    const { data: salesData } = await supabase
      .from('order_line_items')
      .select('product_variant_id, quantity')

    const unitsSoldMap = new Map<string, number>()
    if (salesData) {
      for (const li of salesData) {
        const current = unitsSoldMap.get(li.product_variant_id) || 0
        unitsSoldMap.set(li.product_variant_id, current + li.quantity)
      }
    }

    capitalTrapData = (products || []).map((p) => {
      const unitsSold = unitsSoldMap.get(p.variant_id) || 0
      // avg_days_in_stock: how many days of stock we have at current sell rate
      // if unitsSold is 0, assume 90 days (whole period)
      const dailySellRate = unitsSold / 90 // assume 90-day window
      const avgDaysInStock = dailySellRate > 0
        ? p.inventory_quantity / dailySellRate
        : 90

      const idd = p.inventory_quantity * (p.cogs || 0) * avgDaysInStock
      const tdd = unitsSold * (p.throughput_per_unit || 0)
      const iddTddRatio = tdd > 0 ? idd / tdd : 999

      return {
        variant_id: p.variant_id,
        product_name: p.product_name,
        category: p.category || 'Other',
        inventory_quantity: p.inventory_quantity || 0,
        cogs: p.cogs || 0,
        throughput_per_unit: p.throughput_per_unit || 0,
        avg_days_in_stock: Math.round(avgDaysInStock),
        idd: Math.round(idd),
        tdd: Math.round(tdd),
        idd_tdd_ratio: Math.round(iddTddRatio * 10) / 10,
        is_capital_trap: iddTddRatio > 5,
      }
    })

    // Sort by IDD/TDD ratio descending
    capitalTrapData.sort((a, b) => b.idd_tdd_ratio - a.idd_tdd_ratio)
  }

  const trapCount = capitalTrapData.filter(d => d.is_capital_trap).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">
              {products?.length || 0} products · Click COGS or Shipping to edit · Throughput recalculates instantly
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="capital-traps">
            Capital Traps
            {trapCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {trapCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductTable initialData={products || []} />
        </TabsContent>

        <TabsContent value="capital-traps">
          <CapitalTrapTable data={capitalTrapData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
