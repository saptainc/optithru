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
        <CardHeader><CardTitle className="text-base">30-Day Throughput Trend</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">No snapshot data yet. Capture your first snapshot to start tracking trends.</p>
        </CardContent>
      </Card>
    )
  }

  const data = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    throughput: Math.round(s.total_throughput),
    netProfit: Math.round(s.net_profit),
  }))

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">30-Day Throughput Trend</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Area type="monotone" dataKey="throughput" name="Throughput" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.15} />
              <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
