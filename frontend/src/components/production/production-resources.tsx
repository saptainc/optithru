'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, Factory, Pencil, Shield, ShieldOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductionResource {
  id: string
  organization_id: string
  name: string
  capacity_per_week: number
  capacity_unit: string
  current_load: number | null
  is_constraint: boolean
  created_at: string
}

interface Props {
  initialResources: ProductionResource[]
  organizationId: string
}

export function ProductionResources({ initialResources, organizationId }: Props) {
  const [resources, setResources] = useState<ProductionResource[]>(initialResources)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [capacityPerWeek, setCapacityPerWeek] = useState('')
  const [capacityUnit, setCapacityUnit] = useState('minutes')
  const [currentLoad, setCurrentLoad] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  function resetForm() {
    setName('')
    setCapacityPerWeek('')
    setCapacityUnit('minutes')
    setCurrentLoad('')
    setShowForm(false)
    setEditingId(null)
  }

  function startEdit(r: ProductionResource) {
    setEditingId(r.id)
    setName(r.name)
    setCapacityPerWeek(String(r.capacity_per_week))
    setCapacityUnit(r.capacity_unit)
    setCurrentLoad(r.current_load != null ? String(r.current_load) : '')
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!name.trim() || !capacityPerWeek) {
      toast.error('Name and capacity are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        organization_id: organizationId,
        name: name.trim(),
        capacity_per_week: Number(capacityPerWeek),
        capacity_unit: capacityUnit,
        current_load: currentLoad ? Number(currentLoad) : null,
      }

      if (editingId) {
        const { data, error } = await supabase
          .from('production_resources')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single()
        if (error) throw error
        setResources(prev => prev.map(r => r.id === editingId ? data : r))
        toast.success('Resource updated')
      } else {
        const { data, error } = await supabase
          .from('production_resources')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setResources(prev => [...prev, data])
        toast.success('Resource added')
      }
      resetForm()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save resource'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('production_resources')
      .delete()
      .eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setResources(prev => prev.filter(r => r.id !== id))
    toast.success('Resource deleted')
  }

  async function toggleConstraint(resource: ProductionResource) {
    const newValue = !resource.is_constraint

    // If marking as constraint, unmark all others first
    if (newValue) {
      const { error: clearError } = await supabase
        .from('production_resources')
        .update({ is_constraint: false })
        .eq('organization_id', organizationId)
      if (clearError) {
        toast.error(clearError.message)
        return
      }
    }

    const { error } = await supabase
      .from('production_resources')
      .update({ is_constraint: newValue })
      .eq('id', resource.id)
    if (error) {
      toast.error(error.message)
      return
    }

    setResources(prev =>
      prev.map(r => ({
        ...r,
        is_constraint: r.id === resource.id ? newValue : (newValue ? false : r.is_constraint),
      }))
    )
    toast.success(newValue ? `${resource.name} marked as constraint` : `${resource.name} unmarked`)
  }

  function getUtilization(r: ProductionResource): number {
    if (!r.current_load || !r.capacity_per_week) return 0
    return Math.min(100, Math.round((r.current_load / r.capacity_per_week) * 100))
  }

  function getUtilizationColor(pct: number): string {
    if (pct >= 90) return 'text-destructive'
    if (pct >= 70) return 'text-[oklch(0.60_0.15_292)]'
    return 'text-primary'
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {resources.length} resource{resources.length !== 1 ? 's' : ''} tracked
          {resources.some(r => r.is_constraint) && (
            <> &middot; Constraint: <span className="font-medium text-destructive">{resources.find(r => r.is_constraint)?.name}</span></>
          )}
        </p>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Resource
        </Button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? 'Edit Resource' : 'Add Resource'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="res-name">Resource Name</Label>
                <Input
                  id="res-name"
                  placeholder="e.g., Blending Machine, QC Station"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-capacity">Capacity per Week</Label>
                <Input
                  id="res-capacity"
                  type="number"
                  min="0"
                  placeholder="e.g., 2400"
                  value={capacityPerWeek}
                  onChange={e => setCapacityPerWeek(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-unit">Capacity Unit</Label>
                <Select value={capacityUnit} onValueChange={(v) => { if (v) setCapacityUnit(v) }}>
                  <SelectTrigger id="res-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="batches">Batches</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-load">Current Load (optional)</Label>
                <Input
                  id="res-load"
                  type="number"
                  min="0"
                  placeholder="e.g., 1800"
                  value={currentLoad}
                  onChange={e => setCurrentLoad(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource cards */}
      {resources.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Factory className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No production resources tracked yet.</p>
            <p className="text-sm mt-1">Add resources to identify your manufacturing constraint.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(r => {
          const utilization = getUtilization(r)
          return (
            <Card key={r.id} className={r.is_constraint ? 'border-destructive border-2' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {r.is_constraint && (
                      <Badge variant="destructive" className="text-xs">Constraint</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{r.capacity_per_week.toLocaleString()} {r.capacity_unit}/week</span>
                </div>
                {r.current_load != null && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Load</span>
                      <span className="font-medium">{r.current_load.toLocaleString()} {r.capacity_unit}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={`font-semibold ${getUtilizationColor(utilization)}`}>{utilization}%</span>
                      </div>
                      <Progress value={utilization} className="h-2" />
                    </div>
                  </>
                )}
                <div className="flex gap-1 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleConstraint(r)}
                    className={r.is_constraint ? 'text-destructive' : ''}
                  >
                    {r.is_constraint ? (
                      <><ShieldOff className="h-3.5 w-3.5 mr-1" /> Unmark</>
                    ) : (
                      <><Shield className="h-3.5 w-3.5 mr-1" /> Mark Constraint</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
