'use client'

import { useEffect, useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { FieldMapping } from '@/lib/import-fields'

interface ValidationError {
  row: number
  field: string
  message: string
}

export function ValidationStep({ csvData, mappings, entityType, onValidated }: {
  csvData: Record<string, string>[]
  mappings: FieldMapping[]
  entityType: string
  onValidated: (valid: Record<string, unknown>[], errors: ValidationError[]) => void
}) {
  const [validRows, setValidRows] = useState<Record<string, unknown>[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const valid: Record<string, unknown>[] = []
    const errs: ValidationError[] = []

    csvData.forEach((row, i) => {
      const mapped: Record<string, unknown> = {}
      let rowValid = true

      mappings.forEach(m => {
        if (!m.targetField) return
        const val = row[m.csvColumn]?.trim() || ''
        mapped[m.targetField!] = val
      })

      // Check mapped fields have values
      mappings.filter(m => m.targetField).forEach(m => {
        const field = m.targetField!
        const val = mapped[field]
        if (!val && val !== 0) {
          errs.push({ row: i + 1, field, message: 'Empty value' })
          rowValid = false
        }
      })

      // Coerce numbers
      const numberFields = ['price', 'cogs', 'shipping_cost', 'total', 'spend', 'revenue_attributed', 'conversions', 'clicks', 'impressions', 'inventory_quantity']
      for (const key of numberFields) {
        if (mapped[key] !== undefined && mapped[key] !== '') {
          const num = parseFloat(String(mapped[key]))
          if (isNaN(num)) {
            errs.push({ row: i + 1, field: key, message: `"${mapped[key]}" is not a number` })
            rowValid = false
          } else {
            mapped[key] = num
          }
        }
      }

      if (rowValid) valid.push(mapped)
    })

    setValidRows(valid)
    setErrors(errs)
    onValidated(valid, errs)
  }, [csvData, mappings, entityType])

  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-4 ${
        errors.length === 0 ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200' :
        validRows.length > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200' :
        'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200'
      }`}>
        <div className="font-medium">
          {validRows.length} rows valid, {errors.length} errors
        </div>
        {errors.length > 0 && validRows.length > 0 && (
          <div className="text-sm mt-1">Valid rows will be imported. Rows with errors will be skipped.</div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.slice(0, 50).map((err, i) => (
                <TableRow key={i}>
                  <TableCell>{err.row}</TableCell>
                  <TableCell><Badge variant="outline">{err.field}</Badge></TableCell>
                  <TableCell className="text-sm">{err.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {errors.length > 50 && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              ...and {errors.length - 50} more errors
            </div>
          )}
        </div>
      )}
    </div>
  )
}
