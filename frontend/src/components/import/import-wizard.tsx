'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ENTITY_FIELDS, autoMapFields, type FieldMapping } from '@/lib/import-fields'
import { CSVUploadStep } from './csv-upload-step'
import { FieldMappingStep } from './field-mapping-step'
import { ValidationStep } from './validation-step'
import { ImportStep } from './import-step'

const ENTITY_OPTIONS = [
  { value: 'products', label: 'Products' },
  { value: 'product_variants', label: 'Product Variants' },
  { value: 'orders', label: 'Orders' },
  { value: 'marketing_spend', label: 'Marketing Spend' },
]

const STEP_LABELS = ['Upload', 'Map Fields', 'Validate', 'Import']

export function ImportWizard({ organizationId }: { organizationId: string }) {
  const [step, setStep] = useState(0)
  const [entityType, setEntityType] = useState('product_variants')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [validRows, setValidRows] = useState<Record<string, any>[]>([])
  const [errors, setErrors] = useState<{ row: number; field: string; message: string }[]>([])
  const [fileName, setFileName] = useState('')

  function handleFileLoaded(headers: string[], data: Record<string, string>[], name: string) {
    setCsvHeaders(headers)
    setCsvData(data)
    setFileName(name)
    setMappings(autoMapFields(headers, entityType))
    setStep(1)
  }

  function handleReset() {
    setStep(0)
    setCsvHeaders([])
    setCsvData([])
    setMappings([])
    setValidRows([])
    setErrors([])
    setFileName('')
  }

  const targetFields = ENTITY_FIELDS[entityType] || []
  const requiredFields = targetFields.filter(f => f.required)
  const mappedRequired = requiredFields.filter(f =>
    mappings.some(m => m.targetField === f.key)
  )
  const canProceedFromMapping = mappedRequired.length === requiredFields.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">CSV Import Wizard</CardTitle>
          <select
            value={entityType}
            onChange={e => { setEntityType(e.target.value); handleReset() }}
            className="border rounded-md px-3 py-1.5 text-sm"
            disabled={step > 0}
          >
            {ENTITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 mt-4">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full mb-1 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`text-xs ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>
                {i + 1}. {label}
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {step === 0 && (
          <CSVUploadStep onFileLoaded={handleFileLoaded} />
        )}
        {step === 1 && (
          <FieldMappingStep
            csvHeaders={csvHeaders}
            csvData={csvData}
            mappings={mappings}
            targetFields={targetFields}
            onMappingsChange={setMappings}
          />
        )}
        {step === 2 && (
          <ValidationStep
            csvData={csvData}
            mappings={mappings}
            entityType={entityType}
            onValidated={(valid, errs) => { setValidRows(valid); setErrors(errs) }}
          />
        )}
        {step === 3 && (
          <ImportStep
            validRows={validRows}
            entityType={entityType}
            organizationId={organizationId}
            fileName={fileName}
            onReset={handleReset}
          />
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step === 0 ? handleReset() : setStep(step - 1)}
          disabled={step === 3}
        >
          {step === 0 ? 'Reset' : 'Back'}
        </Button>
        {step < 3 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 0 && csvData.length === 0) ||
              (step === 1 && !canProceedFromMapping) ||
              (step === 2 && validRows.length === 0)
            }
          >
            {step === 2 ? 'Start Import' : 'Continue'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
