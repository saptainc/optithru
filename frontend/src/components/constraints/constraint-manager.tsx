'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, Zap, ZapOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Constraint {
  id: string
  name: string
  type: string
  capacity: number
  description: string | null
  is_active: boolean
  organization_id: string
  created_at: string
}

const CONSTRAINT_TYPES = [
  { value: 'production_capacity', label: 'Production Capacity' },
  { value: 'marketing_budget', label: 'Marketing Budget' },
  { value: 'inventory_capital', label: 'Inventory Capital' },
  { value: 'labor_hours', label: 'Labor Hours' },
  { value: 'shelf_space', label: 'Shelf Space' },
]

function typeLabel(type: string): string {
  return CONSTRAINT_TYPES.find((t) => t.value === type)?.label ?? type
}

interface ConstraintManagerProps {
  initialConstraints: Constraint[]
  organizationId: string
}

export function ConstraintManager({ initialConstraints, organizationId }: ConstraintManagerProps) {
  const supabase = createClient()

  const [constraints, setConstraints] = useState<Constraint[]>(initialConstraints)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!name.trim() || !type || !capacity) {
      toast.error('Please fill in name, type, and capacity.')
      return
    }

    setAdding(true)
    const { data, error } = await supabase
      .from('constraints')
      .insert({
        name: name.trim(),
        type,
        capacity: parseFloat(capacity),
        description: description.trim() || null,
        is_active: false,
        organization_id: organizationId,
      })
      .select()
      .single()

    setAdding(false)

    if (error) {
      toast.error(`Failed to add constraint: ${error.message}`)
      return
    }

    setConstraints((prev) => [data as Constraint, ...prev])
    setName('')
    setType('')
    setCapacity('')
    setDescription('')
    toast.success('Constraint added.')
  }

  async function handleActivate(id: string) {
    // Deactivate all first
    const { error: deactivateError } = await supabase
      .from('constraints')
      .update({ is_active: false })
      .eq('organization_id', organizationId)

    if (deactivateError) {
      toast.error(`Failed to deactivate constraints: ${deactivateError.message}`)
      return
    }

    // Activate the selected one
    const { error: activateError } = await supabase
      .from('constraints')
      .update({ is_active: true })
      .eq('id', id)

    if (activateError) {
      toast.error(`Failed to activate constraint: ${activateError.message}`)
      return
    }

    setConstraints((prev) =>
      prev.map((c) => ({ ...c, is_active: c.id === id }))
    )
    toast.success('Constraint activated.')
  }

  async function handleDeactivate(id: string) {
    const { error } = await supabase
      .from('constraints')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      toast.error(`Failed to deactivate constraint: ${error.message}`)
      return
    }

    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
    )
    toast.success('Constraint deactivated.')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error(`Failed to delete constraint: ${error.message}`)
      return
    }

    setConstraints((prev) => prev.filter((c) => c.id !== id))
    toast.success('Constraint deleted.')
  }

  return (
    <div className="space-y-6">
      {/* Add Constraint Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Constraint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="constraint-name">Name</Label>
              <Input
                id="constraint-name"
                placeholder="e.g. Filling Machine"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraint-type">Type</Label>
              <Select value={type} onValueChange={(val) => { if (val !== null) setType(val) }}>
                <SelectTrigger id="constraint-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTRAINT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraint-capacity">Capacity (units/month)</Label>
              <Input
                id="constraint-capacity"
                type="number"
                placeholder="e.g. 5000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraint-description">Description</Label>
              <Input
                id="constraint-description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <Button className="mt-4" onClick={handleAdd} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" />
            {adding ? 'Adding...' : 'Add Constraint'}
          </Button>
        </CardContent>
      </Card>

      {/* Constraint List */}
      {constraints.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No constraints defined yet. Add one above to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {constraints.map((constraint) => (
            <Card
              key={constraint.id}
              className={
                constraint.is_active
                  ? 'border-primary border-2'
                  : ''
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{constraint.name}</CardTitle>
                  <Badge variant={constraint.is_active ? 'default' : 'secondary'}>
                    {constraint.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{typeLabel(constraint.type)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Capacity: <span className="font-medium text-foreground">{constraint.capacity.toLocaleString()}</span>
                  </span>
                </div>

                {constraint.description && (
                  <p className="text-sm text-muted-foreground">{constraint.description}</p>
                )}

                <div className="flex gap-2 pt-1">
                  {constraint.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(constraint.id)}
                    >
                      <ZapOff className="mr-1 h-3 w-3" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(constraint.id)}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(constraint.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
