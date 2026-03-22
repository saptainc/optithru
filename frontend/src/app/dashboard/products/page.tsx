import { createClient } from '@/lib/supabase/server'
import { Package } from 'lucide-react'
import { ProductTable } from '@/components/products/product-table'

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

      <ProductTable initialData={products || []} />
    </div>
  )
}
