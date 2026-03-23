'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScenarioPanel } from './scenario-panel'
import { ProductMixOptimizer } from './product-mix-optimizer'
import { SubscriptionCalculator } from './subscription-calculator'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'

interface SimulatorProps {
  organizationId: string
  baseline: { throughput: number; oe: number; netProfit: number; investment: number }
  products: Array<{
    variant_id: string
    product_name: string
    category: string
    price: number
    cogs: number
    throughput_per_unit: number
    inventory_quantity: number
    inventory_investment: number
  }>
  channels: Array<{
    channel: string
    total_spend: number
    estimated_throughput: number
  }>
  constraints: Array<{
    id: string
    name: string
    type: string
    capacity: number
    is_active: boolean
  }>
}

async function saveScenario(
  organizationId: string,
  name: string,
  type: string,
  parameters: Record<string, unknown>,
  baselineThroughput: number,
  projectedThroughput: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('simulations').insert({
    organization_id: organizationId,
    name,
    type,
    parameters,
    baseline_throughput: baselineThroughput,
    projected_throughput: projectedThroughput,
    delta_throughput: projectedThroughput - baselineThroughput,
    created_by: user?.id,
  })
  if (error) {
    toast.error('Failed to save scenario: ' + error.message)
  } else {
    toast.success('Scenario saved')
  }
}

export function WhatIfSimulator({ organizationId, baseline, products, channels, constraints }: SimulatorProps) {
  // Tab 1: Price Change
  const [priceDelta, setPriceDelta] = useState(0)
  const [priceScenarioName, setPriceScenarioName] = useState('')

  // Tab 2: Budget Reallocation
  const [channelShifts, setChannelShifts] = useState<Record<string, number>>(
    () => Object.fromEntries(channels.map(c => [c.channel, 0]))
  )
  const [budgetScenarioName, setBudgetScenarioName] = useState('')

  // Tab 3: SKU Discontinuation
  const [discontinuedSkus, setDiscontinuedSkus] = useState<Set<string>>(new Set())
  const [skuScenarioName, setSkuScenarioName] = useState('')

  // Tab 4: Constraint Change
  const [selectedConstraintId, setSelectedConstraintId] = useState(
    constraints.find(c => c.is_active)?.id || constraints[0]?.id || ''
  )
  const [capacityDelta, setCapacityDelta] = useState(0)
  const [constraintScenarioName, setConstraintScenarioName] = useState('')

  // ---------- Price Change calculations ----------
  const priceProjectedThroughput = products.reduce((sum, p) => {
    const newThroughputPerUnit = p.throughput_per_unit + (p.price * priceDelta / 100)
    return sum + newThroughputPerUnit * p.inventory_quantity
  }, 0)
  const priceAfter = {
    throughput: priceProjectedThroughput,
    oe: baseline.oe,
    netProfit: priceProjectedThroughput - baseline.oe,
    investment: baseline.investment,
  }

  // ---------- Budget Reallocation calculations ----------
  const budgetProjectedThroughput = channels.reduce((sum, c) => {
    const shift = channelShifts[c.channel] || 0
    return sum + c.estimated_throughput * (1 + shift / 100)
  }, 0)
  const channelBaselineThroughput = channels.reduce((sum, c) => sum + c.estimated_throughput, 0)
  const budgetThroughputDelta = budgetProjectedThroughput - channelBaselineThroughput
  const budgetAfter = {
    throughput: baseline.throughput + budgetThroughputDelta,
    oe: baseline.oe,
    netProfit: baseline.throughput + budgetThroughputDelta - baseline.oe,
    investment: baseline.investment,
  }

  // ---------- SKU Discontinuation calculations ----------
  const discontinuedProducts = products.filter(p => discontinuedSkus.has(p.variant_id))
  const throughputLost = discontinuedProducts.reduce(
    (sum, p) => sum + p.throughput_per_unit * p.inventory_quantity, 0
  )
  const freedCapital = discontinuedProducts.reduce(
    (sum, p) => sum + p.inventory_investment, 0
  )
  const skuAfter = {
    throughput: baseline.throughput - throughputLost,
    oe: baseline.oe,
    netProfit: baseline.throughput - throughputLost - baseline.oe,
    investment: baseline.investment - freedCapital,
  }

  // ---------- Constraint Change calculations ----------
  const selectedConstraint = constraints.find(c => c.id === selectedConstraintId)
  const newCapacity = selectedConstraint
    ? selectedConstraint.capacity * (1 + capacityDelta / 100)
    : 0
  const capacityMultiplier = selectedConstraint && selectedConstraint.capacity > 0
    ? newCapacity / selectedConstraint.capacity
    : 1
  // Simplified: throughput scales with constraint capacity
  const constraintProjectedThroughput = baseline.throughput * capacityMultiplier
  const constraintAfter = {
    throughput: constraintProjectedThroughput,
    oe: baseline.oe,
    netProfit: constraintProjectedThroughput - baseline.oe,
    investment: baseline.investment,
  }

  const toggleSku = (variantId: string) => {
    setDiscontinuedSkus(prev => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  return (
    <Tabs defaultValue="price">
      <TabsList>
        <TabsTrigger value="price">Price Change</TabsTrigger>
        <TabsTrigger value="budget">Budget Reallocation</TabsTrigger>
        <TabsTrigger value="sku">SKU Discontinuation</TabsTrigger>
        <TabsTrigger value="constraint">Constraint Change</TabsTrigger>
        <TabsTrigger value="mix">Product Mix</TabsTrigger>
        <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
      </TabsList>

      {/* Tab 1: Price Change */}
      <TabsContent value="price">
        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adjust Price Across All SKUs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Price Change: {priceDelta > 0 ? '+' : ''}{priceDelta}%</Label>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={priceDelta}
                  onChange={e => setPriceDelta(Number(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+30%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScenarioPanel title="Price Change Impact" before={baseline} after={priceAfter} />

          <div className="flex items-center gap-3">
            <Input
              placeholder="Scenario name (e.g. 10% price increase)"
              value={priceScenarioName}
              onChange={e => setPriceScenarioName(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={() =>
                saveScenario(
                  organizationId,
                  priceScenarioName || `Price ${priceDelta > 0 ? '+' : ''}${priceDelta}%`,
                  'price_change',
                  { price_delta_pct: priceDelta },
                  baseline.throughput,
                  priceAfter.throughput
                )
              }
            >
              Save Scenario
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Budget Reallocation */}
      <TabsContent value="budget">
        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adjust Channel Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {channels.map(c => (
                <div key={c.channel} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{c.channel.replace(/_/g, ' ')}</Label>
                    <span className="text-sm text-muted-foreground">
                      Spend: {formatCurrency(c.total_spend)} &middot; Shift: {channelShifts[c.channel] > 0 ? '+' : ''}{channelShifts[c.channel]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={5}
                    value={channelShifts[c.channel] || 0}
                    onChange={e =>
                      setChannelShifts(prev => ({ ...prev, [c.channel]: Number(e.target.value) }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              ))}
              {channels.length === 0 && (
                <p className="text-sm text-muted-foreground">No marketing channel data available.</p>
              )}
            </CardContent>
          </Card>

          <ScenarioPanel title="Budget Reallocation Impact" before={baseline} after={budgetAfter} />

          <div className="flex items-center gap-3">
            <Input
              placeholder="Scenario name (e.g. Shift to email)"
              value={budgetScenarioName}
              onChange={e => setBudgetScenarioName(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={() =>
                saveScenario(
                  organizationId,
                  budgetScenarioName || 'Budget reallocation',
                  'budget_reallocation',
                  { channel_shifts: channelShifts },
                  baseline.throughput,
                  budgetAfter.throughput
                )
              }
            >
              Save Scenario
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 3: SKU Discontinuation */}
      <TabsContent value="sku">
        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select SKUs to Discontinue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {products.map(p => (
                  <label
                    key={p.variant_id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={discontinuedSkus.has(p.variant_id)}
                      onChange={() => toggleSku(p.variant_id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        T/unit: {formatCurrency(p.throughput_per_unit)} &middot; Inv: {formatCurrency(p.inventory_investment)}
                      </p>
                    </div>
                    {discontinuedSkus.has(p.variant_id) && (
                      <Badge variant="destructive" className="text-xs">Remove</Badge>
                    )}
                  </label>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">No products available.</p>
                )}
              </div>

              {discontinuedSkus.size > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Throughput Lost</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(throughputLost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Freed Capital</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      +{formatCurrency(freedCapital)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <ScenarioPanel title="SKU Discontinuation Impact" before={baseline} after={skuAfter} />

          <div className="flex items-center gap-3">
            <Input
              placeholder="Scenario name (e.g. Drop low-T products)"
              value={skuScenarioName}
              onChange={e => setSkuScenarioName(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={() =>
                saveScenario(
                  organizationId,
                  skuScenarioName || `Discontinue ${discontinuedSkus.size} SKUs`,
                  'sku_discontinuation',
                  { discontinued_variant_ids: Array.from(discontinuedSkus) },
                  baseline.throughput,
                  skuAfter.throughput
                )
              }
            >
              Save Scenario
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 4: Constraint Change */}
      <TabsContent value="constraint">
        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adjust Constraint Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Constraint</Label>
                <select
                  value={selectedConstraintId}
                  onChange={e => {
                    setSelectedConstraintId(e.target.value)
                    setCapacityDelta(0)
                  }}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {constraints.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) {c.is_active ? '- Active' : ''}
                    </option>
                  ))}
                  {constraints.length === 0 && (
                    <option value="">No constraints defined</option>
                  )}
                </select>
              </div>

              {selectedConstraint && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Current capacity: <span className="font-medium text-foreground">{selectedConstraint.capacity}</span>
                    {' '}&rarr;{' '}
                    Projected: <span className="font-medium text-foreground">{Math.round(newCapacity)}</span>
                  </div>

                  <div>
                    <Label>Capacity Change: {capacityDelta > 0 ? '+' : ''}{capacityDelta}%</Label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={5}
                      value={capacityDelta}
                      onChange={e => setCapacityDelta(Number(e.target.value))}
                      className="w-full mt-2 accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {capacityDelta > 0
                      ? `Increasing ${selectedConstraint.name} capacity by ${capacityDelta}% could unlock additional throughput if this is the binding constraint.`
                      : capacityDelta < 0
                        ? `Reducing ${selectedConstraint.name} capacity by ${Math.abs(capacityDelta)}% would reduce system throughput proportionally.`
                        : `Adjust the slider to model constraint capacity changes.`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <ScenarioPanel title="Constraint Change Impact" before={baseline} after={constraintAfter} />

          <div className="flex items-center gap-3">
            <Input
              placeholder="Scenario name (e.g. Add production shift)"
              value={constraintScenarioName}
              onChange={e => setConstraintScenarioName(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={() =>
                saveScenario(
                  organizationId,
                  constraintScenarioName || `${selectedConstraint?.name || 'Constraint'} ${capacityDelta > 0 ? '+' : ''}${capacityDelta}%`,
                  'constraint_change',
                  {
                    constraint_id: selectedConstraintId,
                    capacity_delta_pct: capacityDelta,
                    original_capacity: selectedConstraint?.capacity,
                    new_capacity: newCapacity,
                  },
                  baseline.throughput,
                  constraintAfter.throughput
                )
              }
            >
              Save Scenario
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 5: Product Mix */}
      <TabsContent value="mix">
        <div className="mt-4">
          <ProductMixOptimizer products={products.map(p => ({
            ...p,
            tcu: p.throughput_per_unit,
            units_sold: Math.max(Math.round(p.inventory_quantity * 0.3), 1),
          }))} />
        </div>
      </TabsContent>

      {/* Tab 6: Subscriptions */}
      <TabsContent value="subscription">
        <div className="mt-4">
          <SubscriptionCalculator products={products.map(p => ({
            variant_id: p.variant_id,
            product_name: p.product_name,
            price: p.price,
            throughput_per_unit: p.throughput_per_unit,
            throughput_margin_pct: p.price > 0 ? (p.throughput_per_unit / p.price) * 100 : 0,
          }))} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
