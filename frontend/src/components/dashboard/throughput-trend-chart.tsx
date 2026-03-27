'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Snapshot {
  snapshot_date: string
  total_throughput: number
  net_profit: number
  total_inventory: number
  total_operating_expense: number
}

export function ThroughputTrendChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">30-Day Trend: $T vs $OE</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">No snapshot data yet. Capture your first snapshot to start tracking trends.</p>
        </CardContent>
      </Card>
    )
  }

  const data = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    throughput: Math.round(s.total_throughput),
    operatingExpense: Math.round(s.total_operating_expense),
  }))

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">30-Day Trend: Throughput ($T) vs Operating Expense ($OE)</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Area type="monotone" dataKey="throughput" name="Throughput ($T)" stroke="oklch(0.57 0.19 260)" fill="oklch(0.57 0.19 260)" fillOpacity={0.15} />
              <Area type="monotone" dataKey="operatingExpense" name="Operating Expense ($OE)" stroke="oklch(0.60 0.15 292)" fill="oklch(0.60 0.15 292)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[0.7rem] text-muted-foreground mt-2">
          Gap between $T and $OE = Net Profit. Growing gap = improving system performance.
        </p>
      </CardContent>
    </Card>
  )
}
