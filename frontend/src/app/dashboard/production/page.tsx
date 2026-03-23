import { createClient } from '@/lib/supabase/server'
import { Factory } from 'lucide-react'
import { ProductionResources } from '@/components/production/production-resources'

export default async function ProductionPage() {
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div className="text-muted-foreground">No organization found.</div>

  const { data: resources } = await supabase
    .from('production_resources')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Factory className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Production Resources</h1>
          <p className="text-sm text-muted-foreground">
            Track manufacturing capacity and identify your production constraint
          </p>
        </div>
      </div>
      <ProductionResources initialResources={resources || []} organizationId={orgId} />
    </div>
  )
}
