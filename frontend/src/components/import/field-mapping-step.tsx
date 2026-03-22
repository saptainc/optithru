'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { TargetField, FieldMapping } from '@/lib/import-fields'

interface Props {
  csvHeaders: string[]
  csvData: Record<string, string>[]
  mappings: FieldMapping[]
  targetFields: TargetField[]
  onMappingsChange: (mappings: FieldMapping[]) => void
}

export function FieldMappingStep({ csvHeaders, csvData, mappings, targetFields, onMappingsChange }: Props) {
  const usedTargets = new Set(mappings.filter(m => m.targetField).map(m => m.targetField))
  const requiredFields = targetFields.filter(f => f.required)
  const mappedRequired = requiredFields.filter(f => usedTargets.has(f.key))

  function handleChange(csvColumn: string, targetField: string | null) {
    onMappingsChange(
      mappings.map(m =>
        m.csvColumn === csvColumn
          ? { ...m, targetField: targetField === '-- skip --' ? null : targetField }
          : m
      )
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <span className="font-medium">{mappedRequired.length} of {requiredFields.length}</span>
        {' '}required fields mapped
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CSV Column</TableHead>
              <TableHead>Sample Data</TableHead>
              <TableHead>Maps To</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map(m => {
              const samples = csvData.slice(0, 3).map(row => row[m.csvColumn] || '').join(', ')
              const target = targetFields.find(f => f.key === m.targetField)
              const isRequiredMissing = !m.targetField && requiredFields.some(f =>
                !usedTargets.has(f.key) && f.alternateMatches?.some(alt =>
                  m.csvColumn.toLowerCase().includes(alt)
                )
              )

              return (
                <TableRow key={m.csvColumn}>
                  <TableCell className="font-medium text-sm">{m.csvColumn}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {samples}
                  </TableCell>
                  <TableCell>
                    <select
                      value={m.targetField || '-- skip --'}
                      onChange={e => handleChange(m.csvColumn, e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full max-w-[200px]"
                    >
                      <option value="-- skip --">-- Skip --</option>
                      {targetFields.map(f => (
                        <option
                          key={f.key}
                          value={f.key}
                          disabled={usedTargets.has(f.key) && m.targetField !== f.key}
                        >
                          {f.label} {f.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    {m.targetField ? (
                      <Badge className="bg-green-100 text-green-800">Mapped</Badge>
                    ) : (
                      <Badge variant="outline">Skipped</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
