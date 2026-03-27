'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'

const COLORS = [
  'oklch(0.57 0.19 260)',
  'hsl(217,91%,60%)',
  'oklch(0.60 0.15 292)',
  'hsl(0,84%,60%)',
  'hsl(262,83%,58%)',
  'hsl(174,72%,56%)',
  'hsl(340,82%,52%)',
  'hsl(47,100%,68%)',
  'hsl(200,70%,50%)',
  'hsl(120,60%,40%)',
]

interface MixProduct {
  variant_id: string
  product_name: string
  category: string
  price: number
  throughput_per_unit: number
  inventory_quantity: number
  tcu: number
  units_sold: number
}

interface MixOptimizerProps {
  products: MixProduct[]
}

export function ProductMixOptimizer({ products }: MixOptimizerProps) {
  const analysis = useMemo(() => {
    const validProducts = products.filter((p) => p.tcu > 0 && p.units_sold > 0)
    if (validProducts.length === 0) return null

    const totalUnits = validProducts.reduce((sum, p) => sum + p.units_sold, 0)
    const totalTCU = validProducts.reduce((sum, p) => sum + p.tcu, 0)

    const detailed = validProducts
      .map((p) => {
        const recommended_pct = p.tcu / totalTCU
        const recommended_units = Math.round(recommended_pct * totalUnits)
        const current_throughput = p.units_sold * p.throughput_per_unit
        const recommended_throughput = recommended_units * p.throughput_per_unit
        return {
          ...p,
          current_pct: p.units_sold / totalUnits,
          recommended_pct,
          recommended_units,
          current_throughput,
          recommended_throughput,
          delta: recommended_throughput - current_throughput,
        }
      })
      .sort((a, b) => b.tcu - a.tcu)

    const totalCurrentT = detailed.reduce((s, d) => s + d.current_throughput, 0)
    const totalRecommendedT = detailed.reduce((s, d) => s + d.recommended_throughput, 0)
    const improvement = totalRecommendedT - totalCurrentT

    const top10 = detailed.slice(0, 10)

    const currentPieData = top10.map((d) => ({
      name: d.product_name.length > 20 ? d.product_name.slice(0, 20) + '...' : d.product_name,
      value: d.units_sold,
    }))

    const recommendedPieData = top10.map((d) => ({
      name: d.product_name.length > 20 ? d.product_name.slice(0, 20) + '...' : d.product_name,
      value: d.recommended_units,
    }))

    return {
      detailed,
      top10,
      currentPieData,
      recommendedPieData,
      totalCurrentT,
      totalRecommendedT,
      improvement,
      improvementPct: totalCurrentT > 0 ? (improvement / totalCurrentT) * 100 : 0,
    }
  }, [products])

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No products with positive T/CU and sales data available for mix optimization.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className={analysis.improvement > 0 ? 'border-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="text-base">Optimization Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Current Throughput</p>
              <p className="text-xl font-bold">{formatCurrency(analysis.totalCurrentT)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recommended Throughput</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(analysis.totalRecommendedT)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Improvement</p>
              <p className={`text-xl font-bold ${analysis.improvement > 0 ? 'text-primary' : 'text-destructive'}`}>
                {analysis.improvement > 0 ? '+' : ''}{formatCurrency(analysis.improvement)} ({analysis.improvementPct.toFixed(1)}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Mix (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.currentPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analysis.currentPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} units`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Mix (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.recommendedPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analysis.recommendedPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} units`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Mix Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">T/CU</TableHead>
                  <TableHead className="text-right">Current Units</TableHead>
                  <TableHead className="text-right">Recommended Units</TableHead>
                  <TableHead className="text-right">Current T</TableHead>
                  <TableHead className="text-right">Recommended T</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.detailed.slice(0, 20).map((row) => (
                  <TableRow key={row.variant_id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{row.product_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.tcu)}</TableCell>
                    <TableCell className="text-right">{row.units_sold}</TableCell>
                    <TableCell className="text-right">{row.recommended_units}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.current_throughput)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.recommended_throughput)}</TableCell>
                    <TableCell className={`text-right font-medium ${row.delta > 0 ? 'text-primary' : row.delta < 0 ? 'text-destructive' : ''}`}>
                      {row.delta > 0 ? '+' : ''}{formatCurrency(row.delta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
