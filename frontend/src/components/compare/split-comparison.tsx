'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

export interface CompareProduct {
  variant_id: string
  product_name: string
  category: string
  price: number
  cogs: number
  throughput_per_unit: number
  gross_margin: number
  traditional_rank: number
  toc_rank: number
  rank_change: number
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3 w-3" />
        0
      </span>
    )
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-primary text-sm font-medium">
        <ArrowUp className="h-3 w-3" />
        +{change}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-destructive text-sm font-medium">
      <ArrowDown className="h-3 w-3" />
      {change}
    </span>
  )
}

export function SplitComparison({ products }: { products: CompareProduct[] }) {
  const traditionalSorted = [...products].sort((a, b) => a.traditional_rank - b.traditional_rank)
  const tocSorted = [...products].sort((a, b) => a.toc_rank - b.toc_rank)

  const significantChanges = products.filter(p => Math.abs(p.rank_change) > 3).length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rank Inversions</p>
              <p className="text-2xl font-bold">{significantChanges} products</p>
              <p className="text-xs text-muted-foreground">
                have significantly different rankings (moved &gt; 3 positions)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Products Compared</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traditional Accounting */}
        <Card>
          <CardHeader>
            <CardTitle>Traditional Accounting</CardTitle>
            <CardDescription>Ranked by Gross Margin (Price - COGS)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                    <TableHead className="text-right">TOC Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traditionalSorted.map((p) => {
                    const isInversion = Math.abs(p.rank_change) > 3
                    return (
                      <TableRow
                        key={`trad-${p.variant_id}`}
                        className={isInversion ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                      >
                        <TableCell className="font-bold">#{p.traditional_rank}</TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">
                          {p.product_name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(p.gross_margin)}
                        </TableCell>
                        <TableCell className="text-right">
                          <RankChangeIndicator change={p.rank_change} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* TOC Throughput Accounting */}
        <Card>
          <CardHeader>
            <CardTitle>Throughput Accounting</CardTitle>
            <CardDescription>Ranked by Throughput per Unit (Price - TVC)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">T/Unit</TableHead>
                    <TableHead className="text-right">vs Trad.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tocSorted.map((p) => {
                    const isInversion = Math.abs(p.rank_change) > 3
                    return (
                      <TableRow
                        key={`toc-${p.variant_id}`}
                        className={isInversion ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                      >
                        <TableCell className="font-bold">#{p.toc_rank}</TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">
                          {p.product_name}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(p.throughput_per_unit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <RankChangeIndicator change={p.rank_change} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
