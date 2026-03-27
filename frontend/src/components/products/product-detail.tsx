'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, Package, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercent } from '@/lib/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

interface ProductDetailProps {
  product: Record<string, unknown>
  sales: Array<Record<string, unknown>>
  buffer: Record<string, unknown> | null
}

const categoryColors: Record<string, string> = {
  'Face Care': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Body Care': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Sets': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

function getBufferZone(current: number, target: number): { zone: string; color: string; badgeClass: string } {
  const ratio = current / target
  if (ratio <= 0.33) return { zone: 'Red', color: 'text-red-600', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  if (ratio <= 0.67) return { zone: 'Yellow', color: 'text-yellow-600', badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
  return { zone: 'Green', color: 'text-green-600', badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
}

export function ProductDetail({ product, sales, buffer }: ProductDetailProps) {
  const price = Number(product.price) || 0
  const cogs = Number(product.cogs) || 0
  const shippingCost = Number(product.shipping_cost) || 0
  const processingCost = Number(product.processing_cost) || 0
  const throughputPerUnit = Number(product.throughput_per_unit) || 0
  const marginPct = Number(product.throughput_margin_pct) || 0
  const inventoryQty = Number(product.inventory_quantity) || 0
  const category = (product.category as string) || 'Other'
  const productName = (product.product_name as string) || 'Unknown Product'
  const variantName = (product.variant_name as string) || ''

  // Throughput waterfall data
  const waterfallData = [
    { name: 'Price', value: price, fill: '#3b82f6' },
    { name: 'COGS', value: -cogs, fill: '#ef4444' },
    { name: 'Shipping', value: -shippingCost, fill: '#f97316' },
    { name: 'Processing', value: -processingCost, fill: '#a855f7' },
    { name: 'Throughput', value: throughputPerUnit, fill: '#22c55e' },
  ]

  // Sales velocity calculations
  const totalUnitsSold = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0)

  // Estimate months from sales data
  let monthsSpan = 1
  if (sales.length > 0) {
    const orderDates = sales
      .map(s => {
        const orders = s.orders as Record<string, unknown> | null
        return orders?.order_date as string | undefined
      })
      .filter(Boolean) as string[]
    if (orderDates.length >= 2) {
      const sorted = orderDates.sort()
      const earliest = new Date(sorted[0])
      const latest = new Date(sorted[sorted.length - 1])
      const diffMs = latest.getTime() - earliest.getTime()
      monthsSpan = Math.max(1, diffMs / (1000 * 60 * 60 * 24 * 30))
    }
  }
  const unitsPerMonth = totalUnitsSold / monthsSpan

  // Capital efficiency (IDD/TDD)
  const avgDaysInStock = Number(product.avg_days_in_stock) || 30
  const idd = inventoryQty * cogs * avgDaysInStock
  const tdd = throughputPerUnit * totalUnitsSold
  const iddTddRatio = tdd > 0 ? idd / tdd : Infinity

  // Buffer data
  const bufferTarget = buffer ? Number(buffer.buffer_target) || 0 : 0
  const bufferZone = bufferTarget > 0 ? getBufferZone(inventoryQty, bufferTarget) : null

  // Recommendations
  const recommendations: { text: string; type: 'warning' | 'success' | 'info' }[] = []
  if (marginPct < 30) {
    recommendations.push({ text: 'Consider renegotiating COGS with supplier. Throughput margin is below 30%.', type: 'warning' })
  }
  if (bufferTarget > 0 && inventoryQty > bufferTarget * 1.5) {
    recommendations.push({ text: 'Excess inventory detected. Consider promotional pricing to reduce stock.', type: 'warning' })
  }
  if (marginPct >= 60) {
    recommendations.push({ text: 'High-value product. Prioritize marketing allocation to maximize throughput.', type: 'success' })
  }
  if (iddTddRatio > 5 && isFinite(iddTddRatio)) {
    recommendations.push({ text: 'Capital trap detected (IDD/TDD > 5). Reduce order quantities or increase velocity.', type: 'warning' })
  }
  if (iddTddRatio <= 2 && isFinite(iddTddRatio)) {
    recommendations.push({ text: 'Capital efficiency is healthy. Maintain current inventory strategy.', type: 'success' })
  }
  if (recommendations.length === 0) {
    recommendations.push({ text: 'Product performance is within normal parameters. Continue monitoring.', type: 'info' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{productName}</h1>
            {variantName && variantName !== 'Default Title' && (
              <p className="text-sm text-muted-foreground">{variantName}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={categoryColors[category] || ''}>
                {category}
              </Badge>
              <span className="text-lg font-semibold text-primary">{formatCurrency(price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Throughput Waterfall + Sales Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Waterfall */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Throughput Waterfall
            </CardTitle>
            <CardDescription>
              Price breakdown to throughput per unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `$${Math.abs(v).toFixed(0)}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value: number) => [`$${Math.abs(value).toFixed(2)}`, '']} />
                  <ReferenceLine x={0} stroke="#666" />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total TVC:</span>
                <span className="font-medium">{formatCurrency(cogs + shippingCost + processingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Throughput margin:</span>
                <span className="font-medium text-primary">{formatPercent(marginPct)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Velocity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Sales Velocity
            </CardTitle>
            <CardDescription>
              Based on {sales.length} recent line items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Units Sold</p>
                <p className="text-2xl font-semibold">{totalUnitsSold.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Units / Month</p>
                <p className="text-2xl font-semibold">{unitsPerMonth.toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Throughput</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatCurrency(throughputPerUnit * totalUnitsSold)}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-xl font-semibold">{inventoryQty} units</p>
              <p className="text-xs text-muted-foreground">
                Inventory investment: {formatCurrency(inventoryQty * cogs)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buffer Status + Capital Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buffer Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Buffer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buffer && bufferTarget > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current inventory</span>
                  <span className="font-semibold">{inventoryQty} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Buffer target</span>
                  <span className="font-semibold">{bufferTarget} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Buffer penetration</span>
                  <span className="font-semibold">
                    {bufferTarget > 0 ? formatPercent((inventoryQty / bufferTarget) * 100) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Zone</span>
                  {bufferZone && (
                    <Badge className={bufferZone.badgeClass}>{bufferZone.zone}</Badge>
                  )}
                </div>
                {/* Simple buffer bar */}
                <div className="w-full h-6 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-red-500" style={{ width: '33.3%' }} />
                  <div className="h-full bg-yellow-500" style={{ width: '33.3%' }} />
                  <div className="h-full bg-green-500" style={{ width: '33.4%' }} />
                </div>
                <div className="relative h-4">
                  <div
                    className="absolute top-0 w-0.5 h-4 bg-foreground"
                    style={{ left: `${Math.min(100, (inventoryQty / bufferTarget) * 100)}%` }}
                  />
                  <span
                    className="absolute -top-0.5 text-[10px] font-medium"
                    style={{ left: `${Math.min(95, Math.max(0, (inventoryQty / bufferTarget) * 100 - 2))}%` }}
                  >
                    {inventoryQty}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No buffer target configured for this product. Set up buffer management to enable tracking.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Capital Efficiency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Capital Efficiency (IDD/TDD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Inventory Dollar-Days</p>
                  <p className="text-xl font-semibold">{formatCurrency(idd)}</p>
                  <p className="text-xs text-muted-foreground">
                    {inventoryQty} units x {formatCurrency(cogs)} x {avgDaysInStock.toFixed(0)} days
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Throughput Dollar-Days</p>
                  <p className="text-xl font-semibold text-primary">{formatCurrency(tdd)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(throughputPerUnit)} x {totalUnitsSold} units
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">IDD/TDD Ratio</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${
                    iddTddRatio > 5 ? 'text-destructive' :
                    iddTddRatio > 2 ? 'text-[oklch(0.60_0.15_292)]' : 'text-primary'
                  }`}>
                    {!isFinite(iddTddRatio) ? 'N/A' : iddTddRatio.toFixed(1)}
                  </span>
                  {isFinite(iddTddRatio) && (
                    <Badge variant={iddTddRatio > 5 ? 'destructive' : iddTddRatio > 2 ? 'secondary' : 'default'}>
                      {iddTddRatio > 5 ? 'Capital Trap' : iddTddRatio > 2 ? 'Watch' : 'Healthy'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
                  rec.type === 'warning'
                    ? 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                    : rec.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
                }`}
              >
                {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                {rec.type === 'success' && <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />}
                {rec.type === 'info' && <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
