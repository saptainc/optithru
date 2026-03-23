import { createClient } from '@/lib/supabase/server'
import { ArrowLeftRight } from 'lucide-react'
import { SplitComparison, type CompareProduct } from '@/components/compare/split-comparison'

export default async function ComparePage() {
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
    .select('variant_id, product_name, category, price, cogs, throughput_per_unit')
    .eq('organization_id', orgId)

  if (error) {
    return <div className="text-red-500">Error loading products: {error.message}</div>
  }

  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Compare</h1>
            <p className="text-sm text-muted-foreground">No products to compare.</p>
          </div>
        </div>
      </div>
    )
  }

  // Compute traditional gross margin ranking
  const withMargins = products.map(p => ({
    ...p,
    gross_margin: (p.price || 0) - (p.cogs || 0),
    category: p.category || 'Other',
  }))

  // Sort by gross margin DESC for traditional rank
  const traditionalSorted = [...withMargins].sort((a, b) => b.gross_margin - a.gross_margin)
  const traditionalRankMap = new Map<string, number>()
  traditionalSorted.forEach((p, i) => traditionalRankMap.set(p.variant_id, i + 1))

  // Sort by throughput per unit DESC for TOC rank
  const tocSorted = [...withMargins].sort((a, b) => (b.throughput_per_unit || 0) - (a.throughput_per_unit || 0))
  const tocRankMap = new Map<string, number>()
  tocSorted.forEach((p, i) => tocRankMap.set(p.variant_id, i + 1))

  // Build compare data
  const compareProducts: CompareProduct[] = withMargins.map(p => {
    const tradRank = traditionalRankMap.get(p.variant_id) || 0
    const tocRank = tocRankMap.get(p.variant_id) || 0
    return {
      variant_id: p.variant_id,
      product_name: p.product_name,
      category: p.category,
      price: p.price || 0,
      cogs: p.cogs || 0,
      throughput_per_unit: p.throughput_per_unit || 0,
      gross_margin: p.gross_margin,
      traditional_rank: tradRank,
      toc_rank: tocRank,
      rank_change: tradRank - tocRank, // positive = improved in TOC
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Compare</h1>
          <p className="text-sm text-muted-foreground">
            Traditional gross margin vs. Throughput Accounting rankings
          </p>
        </div>
      </div>

      <SplitComparison products={compareProducts} />
    </div>
  )
}
