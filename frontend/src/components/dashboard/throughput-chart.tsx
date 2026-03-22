'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ThroughputChartProps {
  data: {
    name: string
    throughput: number
    margin: number
  }[]
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  const avgThroughput = data.reduce((sum, d) => sum + d.throughput, 0) / data.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top products by throughput per unit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Throughput/unit']}
              />
              <Bar dataKey="throughput" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.throughput >= avgThroughput
                      ? 'hsl(142, 71%, 45%)'
                      : 'hsl(38, 92%, 50%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Green = above average T/unit · Amber = below average T/unit
        </p>
      </CardContent>
    </Card>
  )
}
