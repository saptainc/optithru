'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle } from 'lucide-react'

const TABLE_MAP: Record<string, string> = {
  products: 'products',
  product_variants: 'product_variants',
  orders: 'orders',
  marketing_spend: 'marketing_spend',
}

const PAGE_MAP: Record<string, string> = {
  products: '/dashboard/products',
  product_variants: '/dashboard/products',
  orders: '/dashboard/orders',
  marketing_spend: '/dashboard/channels',
}

export function ImportStep({ validRows, entityType, organizationId, fileName, onReset }: {
  validRows: Record<string, unknown>[]
  entityType: string
  organizationId: string
  fileName: string
  onReset: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('importing')
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    runImport()
  }, [])

  async function resolveProductNames(rows: Record<string, unknown>[]) {
    // Get unique product names from the rows
    const names = [...new Set(rows.map(r => r.product_name).filter(Boolean))] as string[]
    if (names.length === 0) return new Map()

    // Query products table for matching names
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .eq('organization_id', organizationId)
      .in('name', names)

    const nameToId = new Map()
    if (products) {
      products.forEach(p => nameToId.set(p.name, p.id))
    }

    // Also try case-insensitive partial matching for unmatched names
    const unmatchedNames = names.filter(n => !nameToId.has(n))
    if (unmatchedNames.length > 0) {
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', organizationId)

      if (allProducts) {
        for (const name of unmatchedNames) {
          const match = allProducts.find(p =>
            p.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.name.toLowerCase())
          )
          if (match) nameToId.set(name, match.id)
        }
      }
    }

    return nameToId
  }

  async function runImport() {
    const table = TABLE_MAP[entityType]
    if (!table) {
      setStatus('error')
      setErrorMessages(['Unknown entity type: ' + entityType])
      return
    }

    let rows: Record<string, unknown>[] = validRows.map(row => ({
      ...row,
      organization_id: organizationId,
    }))

    const errs: string[] = []

    // Handle FK resolution for product_variants
    if (entityType === 'product_variants') {
      const nameToId = await resolveProductNames(rows)

      const resolved = []
      const unresolved = []

      for (const row of rows) {
        const productName = row.product_name
        const productId = nameToId.get(productName)

        if (productId) {
          const { product_name, ...rest } = row
          resolved.push({ ...rest, product_id: productId })
        } else {
          unresolved.push(productName)
        }
      }

      if (unresolved.length > 0) {
        const uniqueUnresolved = [...new Set(unresolved)]
        errs.push(
          `${unresolved.length} rows skipped — could not find matching products for: ${uniqueUnresolved.join(', ')}. ` +
          `Make sure these products exist in the Products table first.`
        )
      }

      rows = resolved
    }

    // Batch insert
    const BATCH_SIZE = 500
    let imported = 0
    let failed = 0

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)

      const { error } = await supabase.from(table).insert(batch)

      if (error) {
        failed += batch.length
        errs.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        imported += batch.length
      }

      setProgress(Math.round(((i + batch.length) / Math.max(rows.length, 1)) * 100))
      setSuccessCount(imported)
      setErrorCount(failed + (validRows.length - rows.length))
    }

    setErrorMessages(errs)
    setStatus(imported > 0 ? 'done' : 'error')

    // Create import audit record
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('csv_imports').insert({
      organization_id: organizationId,
      entity_type: entityType,
      status: imported > 0 ? 'completed' : 'failed',
      file_name: fileName,
      row_count: validRows.length,
      success_count: imported,
      error_count: failed + (validRows.length - rows.length),
      error_details: errs,
      created_by: user?.id,
    })
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>{status === 'importing' ? 'Importing...' : 'Complete'}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {status !== 'importing' && (
        <div className="space-y-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">{successCount} imported</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">{errorCount} failed</span>
              </div>
            )}
          </div>

          {errorMessages.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded text-sm text-red-700 dark:text-red-300">
              {errorMessages.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onReset}>Import Another</Button>
            <Button onClick={() => router.push(PAGE_MAP[entityType] || '/dashboard')}>
              View Data
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
