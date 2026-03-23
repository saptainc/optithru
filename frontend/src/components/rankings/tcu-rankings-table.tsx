'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'

interface Product {
  variant_id?: string
  product_id?: string
  product_name: string
  category: string
  image_url: string | null
  price: number
  cogs: number
  throughput_per_unit: number
  throughput_margin_pct: number
  inventory_quantity: number
  inventory_investment: number
  organization_id: string
}

interface Constraint {
  id: string
  name: string
  type: string
  capacity: number
  is_active: boolean
}

interface TCURankingsTableProps {
  products: Product[]
  constraints: Constraint[]
  organizationId: string
}

interface RankedProduct extends Product {
  constraint_units: number
  tcu: number
  rank: number
}

function getPriorityBadge(rank: number, total: number) {
  const pct = rank / total
  if (pct <= 0.25) {
    return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Exploit</Badge>
  }
  if (pct <= 0.5) {
    return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Subordinate</Badge>
  }
  if (pct <= 0.75) {
    return <Badge variant="secondary">Monitor</Badge>
  }
  return <Badge variant="destructive">Review</Badge>
}

function getTcuColor(tcu: number, maxTcu: number): string {
  if (maxTcu === 0) return 'text-muted-foreground'
  const ratio = tcu / maxTcu
  if (ratio >= 0.7) return 'text-emerald-600 font-semibold'
  if (ratio >= 0.4) return 'text-blue-600'
  if (ratio >= 0.2) return 'text-amber-600'
  return 'text-red-600'
}

export function TCURankingsTable({
  products,
  constraints,
  organizationId,
}: TCURankingsTableProps) {
  const [selectedConstraint, setSelectedConstraint] = useState<string>('none')

  const totalRevenue = useMemo(
    () => products.reduce((sum, p) => sum + (p.price * (p.inventory_quantity || 1)), 0),
    [products]
  )

  const rankedProducts = useMemo<RankedProduct[]>(() => {
    const constraint = constraints.find((c) => c.id === selectedConstraint)

    const withTcu = products.map((p) => {
      let constraint_units = 1
      let tcu = p.throughput_per_unit

      if (constraint) {
        switch (constraint.type) {
          case 'marketing_budget': {
            const productRevenue = p.price * (p.inventory_quantity || 1)
            const revenueShare = totalRevenue > 0 ? productRevenue / totalRevenue : 0
            constraint_units = revenueShare * constraint.capacity
            tcu = constraint_units > 0 ? p.throughput_per_unit / constraint_units : 0
            break
          }
          case 'inventory_capital': {
            constraint_units = (p.inventory_quantity || 0) * p.cogs
            tcu = constraint_units > 0 ? p.throughput_per_unit / constraint_units : 0
            break
          }
          default: {
            constraint_units = 1
            tcu = p.throughput_per_unit
            break
          }
        }
      }

      return { ...p, constraint_units, tcu }
    })

    const sorted = withTcu.sort((a, b) => b.tcu - a.tcu)
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }))
  }, [products, constraints, selectedConstraint, totalRevenue])

  const maxTcu = rankedProducts.length > 0 ? rankedProducts[0].tcu : 0
  const activeConstraint = constraints.find((c) => c.is_active)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Product Rankings by T/CU</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Constraint:</span>
          <Select value={selectedConstraint} onValueChange={(val) => { if (val !== null) setSelectedConstraint(val) }}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="No constraint (T/unit)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No constraint (T/unit)</SelectItem>
              {constraints.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.is_active ? ' (active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {activeConstraint && selectedConstraint === 'none' && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
            Tip: You have an active constraint &quot;{activeConstraint.name}&quot;. Select it above to see T/CU rankings.
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">T/Unit</TableHead>
                <TableHead className="text-right">CU</TableHead>
                <TableHead className="text-right">T/CU</TableHead>
                <TableHead className="text-center">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No products found. Import products first.
                  </TableCell>
                </TableRow>
              )}
              {rankedProducts.map((p) => (
                <TableRow key={p.variant_id || p.product_id || p.product_name}>
                  <TableCell className="font-mono text-muted-foreground">{p.rank}</TableCell>
                  <TableCell className="font-medium max-w-[240px] truncate">
                    <Link href={`/dashboard/products/${p.variant_id}`} className="hover:underline text-primary">
                      {p.product_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category || '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.throughput_per_unit)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {selectedConstraint === 'none' ? '—' : p.constraint_units.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${getTcuColor(p.tcu, maxTcu)}`}>
                    {p.tcu === Infinity || isNaN(p.tcu) ? '—' : p.tcu < 100 ? p.tcu.toFixed(2) : formatCurrency(p.tcu)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getPriorityBadge(p.rank, rankedProducts.length)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rankedProducts.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing {rankedProducts.length} products.{' '}
            {selectedConstraint !== 'none'
              ? 'T/CU = Throughput per unit / Constraint units consumed.'
              : 'Ranked by throughput per unit (no constraint selected).'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
