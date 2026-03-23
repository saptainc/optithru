'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface Product {
  variant_id?: string
  product_id?: string
  product_name: string
  category: string
  image_url: string | null
  price: number
  cogs: number
  throughput_per_unit: number
  throughput_margin_pct: number
  inventory_quantity: number
  inventory_investment: number
  organization_id: string
}

interface TCUScatterChartProps {
  products: Product[]
}

interface ChartDatum {
  name: string
  price: number
  throughput: number
  inventory: number
  margin: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartDatum }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-medium">{d.name}</p>
      <p>Price: {formatCurrency(d.price)}</p>
      <p>Throughput/unit: {formatCurrency(d.throughput)}</p>
      <p>Margin: {d.margin.toFixed(1)}%</p>
      <p>Inventory: {d.inventory} units</p>
    </div>
  )
}

export function TCUScatterChart({ products }: TCUScatterChartProps) {
  const data: ChartDatum[] = products
    .filter((p) => p.price > 0 && p.throughput_per_unit > 0)
    .map((p) => ({
      name: p.product_name,
      price: p.price,
      throughput: p.throughput_per_unit,
      inventory: Math.max(p.inventory_quantity || 1, 1),
      margin: p.throughput_margin_pct,
    }))

  if (data.length === 0) {
    return null
  }

  const maxInventory = Math.max(...data.map((d) => d.inventory))
  const minInventory = Math.min(...data.map((d) => d.inventory))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price vs. Throughput</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bubble size represents inventory quantity. Larger dots = more stock on hand.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="price"
                name="Price"
                tickFormatter={(v: number) => `$${v}`}
                label={{ value: 'Price ($)', position: 'insideBottom', offset: -10 }}
                className="text-xs"
              />
              <YAxis
                type="number"
                dataKey="throughput"
                name="Throughput/unit"
                tickFormatter={(v: number) => `$${v}`}
                label={{
                  value: 'Throughput / Unit ($)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                }}
                className="text-xs"
              />
              <ZAxis
                type="number"
                dataKey="inventory"
                range={[40, 400]}
                domain={[minInventory, maxInventory]}
                name="Inventory"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={data}
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
