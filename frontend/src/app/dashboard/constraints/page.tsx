import { createClient } from '@/lib/supabase/server'
import { Target } from 'lucide-react'
import { ConstraintManager } from '@/components/constraints/constraint-manager'

export default async function ConstraintsPage() {
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

  const { data: constraints } = await supabase
    .from('constraints')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Constraints</h1>
          <p className="text-sm text-muted-foreground">
            Identify and manage your system constraints. The active constraint determines T/CU rankings.
          </p>
        </div>
      </div>

      <ConstraintManager initialConstraints={constraints || []} organizationId={orgId} />
    </div>
  )
}
