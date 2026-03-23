'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'

interface SubscriptionCalcProps {
  products: Array<{
    variant_id: string
    product_name: string
    price: number
    throughput_per_unit: number
    throughput_margin_pct: number
  }>
}

export function SubscriptionCalculator({ products }: SubscriptionCalcProps) {
  const [conversionRate, setConversionRate] = useState(10)
  const [discount, setDiscount] = useState(15)
  const [avgDuration, setAvgDuration] = useState(12)
  const [orderInterval, setOrderInterval] = useState(30)

  const analysis = useMemo(() => {
    // Top 5 subscription candidates: highest throughput per unit with good margins
    const candidates = [...products]
      .filter((p) => p.throughput_per_unit > 0 && p.throughput_margin_pct > 0)
      .sort((a, b) => b.throughput_per_unit - a.throughput_per_unit)
      .slice(0, 5)

    const discountFraction = discount / 100
    const marginFraction = (p: (typeof candidates)[0]) => p.throughput_margin_pct / 100

    const results = candidates.map((p) => {
      const oneTimeLTV = p.price
      const subscriptionLTV =
        (p.price * (1 - discountFraction)) *
        (365 / orderInterval) *
        marginFraction(p) *
        (avgDuration / 12)
      const multiplier = oneTimeLTV > 0 ? subscriptionLTV / oneTimeLTV : 0

      return {
        ...p,
        oneTimeLTV,
        subscriptionLTV,
        multiplier,
        shortName: p.product_name.length > 25 ? p.product_name.slice(0, 25) + '...' : p.product_name,
      }
    })

    const avgMultiplier =
      results.length > 0
        ? results.reduce((s, r) => s + r.multiplier, 0) / results.length
        : 0

    const chartData = results.map((r) => ({
      name: r.shortName,
      'One-Time': Math.round(r.oneTimeLTV),
      Subscription: Math.round(r.subscriptionLTV),
    }))

    return { results, avgMultiplier, chartData }
  }, [products, conversionRate, discount, avgDuration, orderInterval])

  return (
    <div className="space-y-6">
      {/* Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Parameters</CardTitle>
          <CardDescription>Adjust parameters to model subscription impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">{conversionRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1%</span>
                <span>30%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subscription Discount</span>
                <span className="font-medium">{discount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg Duration</span>
                <span className="font-medium">{avgDuration} months</span>
              </div>
              <input
                type="range"
                min={3}
                max={24}
                value={avgDuration}
                onChange={(e) => setAvgDuration(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 mo</span>
                <span>24 mo</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Interval</span>
                <span className="font-medium">{orderInterval} days</span>
              </div>
              <input
                type="range"
                min={14}
                max={90}
                value={orderInterval}
                onChange={(e) => setOrderInterval(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>14 days</span>
                <span>90 days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-base">Subscription Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Average LTV Multiplier</p>
            <p className="text-4xl font-bold text-purple-600">{analysis.avgMultiplier.toFixed(1)}x</p>
            <p className="text-sm text-muted-foreground mt-1">
              Subscriptions create a {analysis.avgMultiplier.toFixed(1)}x LTV multiplier vs one-time purchases
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      {analysis.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">One-Time vs Subscription LTV (Top 5 Candidates)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="One-Time" fill="hsl(217,91%,60%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Subscription" fill="hsl(262,83%,58%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Subscription Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">T/Unit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">One-Time LTV</TableHead>
                <TableHead className="text-right">Subscription LTV</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.results.map((r) => (
                <TableRow key={r.variant_id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{r.product_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.throughput_per_unit)}</TableCell>
                  <TableCell className="text-right">{r.throughput_margin_pct.toFixed(0)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.oneTimeLTV)}</TableCell>
                  <TableCell className="text-right text-purple-600 font-medium">{formatCurrency(r.subscriptionLTV)}</TableCell>
                  <TableCell className="text-right font-bold">{r.multiplier.toFixed(1)}x</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
