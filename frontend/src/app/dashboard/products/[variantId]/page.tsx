import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/components/products/product-detail'
import { notFound } from 'next/navigation'

export default async function ProductDetailPage({ params }: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('v_product_throughput')
    .select('*')
    .eq('variant_id', variantId)
    .single()

  if (!product) notFound()

  // Sales data for velocity
  const { data: sales } = await supabase
    .from('order_line_items')
    .select('quantity, unit_price, total_price, order_id, orders(order_date)')
    .eq('product_variant_id', variantId)
    .order('order_id', { ascending: false })
    .limit(100)

  // Buffer target
  const { data: buffer } = await supabase
    .from('buffer_targets')
    .select('*')
    .eq('product_variant_id', variantId)
    .single()

  return <ProductDetail product={product} sales={sales || []} buffer={buffer} />
}
