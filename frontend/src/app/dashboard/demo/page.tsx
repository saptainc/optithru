import { createClient } from '@/lib/supabase/server'
import { Presentation } from 'lucide-react'
import { DemoScenarios } from '@/components/demo/demo-scenarios'

export default async function DemoPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id || ''

  // Fetch saved simulations
  const { data: simulations } = await supabase
    .from('simulations')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Presentation className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Demo Scenarios</h1>
          <p className="text-sm text-muted-foreground">
            5 &quot;aha moment&quot; scenarios that demonstrate the power of Throughput Accounting
          </p>
        </div>
      </div>

      <DemoScenarios organizationId={orgId} savedSimulations={simulations || []} />
    </div>
  )
}
