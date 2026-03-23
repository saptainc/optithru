'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

export interface WaterfallData {
  revenue: number
  tvc: number
  throughput: number
  operating_expense: number
  net_profit: number
}

interface WaterfallBar {
  name: string
  value: number
  base: number
  fill: string
}

export function ThroughputWaterfall({ data }: { data: WaterfallData }) {
  const bars: WaterfallBar[] = [
    {
      name: 'Revenue',
      value: data.revenue,
      base: 0,
      fill: '#3b82f6', // blue
    },
    {
      name: 'TVC',
      value: data.tvc,
      base: data.revenue - data.tvc,
      fill: '#ef4444', // red
    },
    {
      name: 'Throughput',
      value: data.throughput,
      base: 0,
      fill: '#22c55e', // green
    },
    {
      name: 'OE',
      value: data.operating_expense,
      base: data.throughput - data.operating_expense,
      fill: '#f97316', // orange
    },
    {
      name: 'Net Profit',
      value: Math.max(0, data.net_profit),
      base: 0,
      fill: data.net_profit >= 0 ? '#16a34a' : '#dc2626', // dark green or red
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Throughput Waterfall</CardTitle>
        <CardDescription>
          Revenue minus TVC = Throughput, minus OE = Net Profit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelFormatter={(label: string) => label}
              />
              <ReferenceLine y={0} stroke="#888" />
              {/* Invisible base bar */}
              <Bar dataKey="base" stackId="waterfall" fill="transparent" />
              {/* Visible value bar */}
              <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
                {bars.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
