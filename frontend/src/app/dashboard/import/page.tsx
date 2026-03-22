import { createClient } from '@/lib/supabase/server'
import { Upload } from 'lucide-react'
import { ImportWizard } from '@/components/import/import-wizard'

export default async function ImportPage() {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id
  if (!orgId) return <div>No organization found.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Import Data</h1>
          <p className="text-sm text-muted-foreground">
            Upload CSV files to import products, orders, and marketing spend data.
          </p>
        </div>
      </div>
      <ImportWizard organizationId={orgId} />
    </div>
  )
}
