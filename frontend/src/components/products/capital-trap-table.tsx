'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react'
import Link from 'next/link'

export interface CapitalTrapData {
  variant_id: string
  product_name: string
  category: string
  inventory_quantity: number
  cogs: number
  throughput_per_unit: number
  avg_days_in_stock: number
  idd: number
  tdd: number
  idd_tdd_ratio: number
  is_capital_trap: boolean
}

function getStatusBadge(ratio: number) {
  if (ratio > 5) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Capital Trap
      </Badge>
    )
  }
  if (ratio >= 2) {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Eye className="h-3 w-3" />
        Watch
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      <CheckCircle className="h-3 w-3" />
      Healthy
    </Badge>
  )
}

type SortKey = 'idd_tdd_ratio' | 'idd' | 'tdd' | 'inventory_quantity' | 'avg_days_in_stock'

export function CapitalTrapTable({ data }: { data: CapitalTrapData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('idd_tdd_ratio')
  const [sortAsc, setSortAsc] = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const trapCount = data.filter(d => d.idd_tdd_ratio > 5).length
  const watchCount = data.filter(d => d.idd_tdd_ratio >= 2 && d.idd_tdd_ratio <= 5).length
  const totalIDD = data.reduce((sum, d) => sum + d.idd, 0)

  const sortIcon = (key: SortKey) => sortKey === key ? (sortAsc ? ' \u2191' : ' \u2193') : ''

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Capital Traps</CardDescription>
            <CardTitle className="text-2xl text-red-600">{trapCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">IDD/TDD ratio &gt; 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Watch List</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{watchCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">IDD/TDD ratio 2-5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Inventory Dollar Days</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalIDD)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Capital tied up x time</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('inventory_quantity')}>
                Inv Qty{sortIcon('inventory_quantity')}
              </TableHead>
              <TableHead className="text-right">COGS</TableHead>
              <TableHead className="text-right">T/Unit</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('avg_days_in_stock')}>
                Avg Days{sortIcon('avg_days_in_stock')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('idd')}>
                IDD{sortIcon('idd')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('tdd')}>
                TDD{sortIcon('tdd')}
              </TableHead>
              <TableHead className="text-right cursor-pointer font-bold" onClick={() => handleSort('idd_tdd_ratio')}>
                IDD/TDD{sortIcon('idd_tdd_ratio')}
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow
                key={row.variant_id}
                className={row.idd_tdd_ratio > 5 ? 'bg-red-50 dark:bg-red-950/20' : ''}
              >
                <TableCell className="font-medium text-sm max-w-[200px] truncate">
                  <Link href={`/dashboard/products/${row.variant_id}`} className="hover:underline text-primary">
                    {row.product_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.category || 'Other'}</Badge>
                </TableCell>
                <TableCell className="text-right">{row.inventory_quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.cogs)}</TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400">
                  {formatCurrency(row.throughput_per_unit)}
                </TableCell>
                <TableCell className="text-right">{row.avg_days_in_stock.toFixed(0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.idd)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.tdd)}</TableCell>
                <TableCell className="text-right font-bold">
                  {row.idd_tdd_ratio >= 999 ? '\u221e' : row.idd_tdd_ratio.toFixed(1)}
                </TableCell>
                <TableCell>{getStatusBadge(row.idd_tdd_ratio)}</TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No product data available for capital trap analysis.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
