import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import { TCURankingsTable } from '@/components/rankings/tcu-rankings-table'
import { TCUScatterChart } from '@/components/rankings/tcu-scatter-chart'

export default async function RankingsPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>

  const { data: constraints } = await supabase
    .from('constraints')
    .select('id, name, type, capacity, is_active')
    .eq('organization_id', orgId)

  const { data: products } = await supabase
    .from('v_product_throughput')
    .select('*')
    .eq('organization_id', orgId)
    .order('throughput_per_unit', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">T/CU Rankings</h1>
          <p className="text-sm text-muted-foreground">
            Products ranked by Throughput per Constraint Unit. Select a constraint to see how rankings change.
          </p>
        </div>
      </div>

      <TCURankingsTable
        products={products || []}
        constraints={constraints || []}
        organizationId={orgId}
      />
      <TCUScatterChart products={products || []} />
    </div>
  )
}
