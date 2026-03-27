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
  // Brand-palette bar color: use primary blue, fade intensity by rank
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Products by T/CU</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.92 0.005 260)" />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'T/CU']}
              />
              <Bar dataKey="throughput" radius={[0, 3, 3, 0]}>
                {data.map((_entry, index) => (
                  <Cell
                    key={index}
                    fill={`oklch(${0.57 + index * 0.015} 0.19 260)`}
                    opacity={1 - index * 0.06}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[0.7rem] text-muted-foreground mt-2">
          Ranked by Throughput per Constraint Unit — focus on the top of this list
        </p>
      </CardContent>
    </Card>
  )
}
