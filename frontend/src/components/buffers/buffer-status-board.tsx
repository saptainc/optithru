'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BufferItem {
  variant_id: string
  product_name: string
  category: string
  image_url: string | null
  inventory_quantity: number
  avg_daily_usage: number
  lead_time_days: number
  buffer_quantity: number
  green_zone_qty: number
  yellow_zone_qty: number
  red_zone_qty: number
  current_zone: string
}

interface BufferStatusBoardProps {
  buffers: BufferItem[]
}

function ZoneBadge({ zone }: { zone: string }) {
  switch (zone) {
    case 'red':
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Red Zone</Badge>
    case 'yellow':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Yellow Zone</Badge>
    case 'green':
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Green Zone</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

function BufferBar({ item }: { item: BufferItem }) {
  const total = item.buffer_quantity
  if (total === 0) return null

  const redPct = (item.red_zone_qty / total) * 100
  const yellowPct = (item.yellow_zone_qty / total) * 100
  const greenPct = (item.green_zone_qty / total) * 100

  // Current level as percentage of buffer
  const levelPct = Math.min((item.inventory_quantity / total) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="relative h-6 w-full rounded-md overflow-hidden flex">
        <div className="bg-red-500/30 h-full" style={{ width: `${redPct}%` }} />
        <div className="bg-yellow-500/30 h-full" style={{ width: `${yellowPct}%` }} />
        <div className="bg-green-500/30 h-full" style={{ width: `${greenPct}%` }} />
        {/* Current inventory level indicator */}
        <div
          className="absolute top-0 left-0 h-full rounded-md"
          style={{
            width: `${levelPct}%`,
            backgroundColor:
              item.current_zone === 'red'
                ? 'rgba(239, 68, 68, 0.7)'
                : item.current_zone === 'yellow'
                  ? 'rgba(234, 179, 8, 0.7)'
                  : 'rgba(34, 197, 94, 0.7)',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{item.red_zone_qty}</span>
        <span>{item.red_zone_qty + item.yellow_zone_qty}</span>
        <span>{total}</span>
      </div>
    </div>
  )
}

export function BufferStatusBoard({ buffers }: BufferStatusBoardProps) {
  const redCount = buffers.filter((b) => b.current_zone === 'red').length
  const yellowCount = buffers.filter((b) => b.current_zone === 'yellow').length
  const greenCount = buffers.filter((b) => b.current_zone === 'green').length

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Red Zone</p>
                <p className="text-3xl font-bold text-red-500">{redCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-red-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Urgent replenishment needed</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yellow Zone</p>
                <p className="text-3xl font-bold text-yellow-500">{yellowCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Plan replenishment soon</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Green Zone</p>
                <p className="text-3xl font-bold text-green-500">{greenCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Adequate stock levels</p>
          </CardContent>
        </Card>
      </div>

      {/* Buffer cards grid */}
      {buffers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No product data available. Import products and orders to see buffer status.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buffers.map((item) => (
            <Card key={item.variant_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {item.product_name}
                    </CardTitle>
                    {item.category && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    )}
                  </div>
                  <ZoneBadge zone={item.current_zone} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{item.inventory_quantity}</span>
                  <span className="text-sm text-muted-foreground">
                    / {item.buffer_quantity} target
                  </span>
                </div>

                <BufferBar item={item} />

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">ADU</p>
                    <p className="text-sm font-mono">{item.avg_daily_usage.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Time</p>
                    <p className="text-sm font-mono">{item.lead_time_days}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buffer</p>
                    <p className="text-sm font-mono">{item.buffer_quantity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {buffers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Buffer = ADU x Lead Time x 1.5 (variability factor). Zones divide the buffer into thirds.
          Red = replenish urgently, Yellow = plan replenishment, Green = adequate stock.
        </p>
      )}
    </div>
  )
}
