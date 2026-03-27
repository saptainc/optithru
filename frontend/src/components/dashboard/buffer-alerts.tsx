import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface BufferAlert {
  variant_id: string
  product_name: string
  current_zone: string
  inventory_quantity: number
  buffer_quantity: number
  avg_daily_usage: number
}

export function BufferAlerts({ buffers }: { buffers: BufferAlert[] }) {
  const threats = buffers.filter((b) => b.current_zone === 'red' || b.current_zone === 'yellow')
  const redCount = threats.filter((b) => b.current_zone === 'red').length
  const yellowCount = threats.filter((b) => b.current_zone === 'yellow').length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Buffer Alerts</CardTitle>
          <Link href="/dashboard/buffers" className="text-[0.75rem] text-primary hover:underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="flex gap-3 mt-1">
          {redCount > 0 && (
            <span className="flex items-center gap-1 text-[0.75rem] font-semibold text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {redCount} Red
            </span>
          )}
          {yellowCount > 0 && (
            <span className="flex items-center gap-1 text-[0.75rem] font-semibold text-yellow-600 dark:text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {yellowCount} Yellow
            </span>
          )}
          {threats.length === 0 && (
            <span className="text-[0.75rem] text-muted-foreground">All buffers in green zone</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {threats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[0.85rem]">No immediate stock threats</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threats.map((item) => {
              const fillPct = item.buffer_quantity > 0
                ? Math.round((item.inventory_quantity / item.buffer_quantity) * 100)
                : 0
              const daysLeft = item.avg_daily_usage > 0
                ? Math.round(item.inventory_quantity / item.avg_daily_usage)
                : null

              return (
                <div
                  key={item.variant_id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    item.current_zone === 'red' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.85rem] font-medium truncate">{item.product_name}</p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {item.inventory_quantity} / {item.buffer_quantity} target ({fillPct}%)
                      {daysLeft !== null && <> · ~{daysLeft}d supply</>}
                    </p>
                  </div>
                  <Badge
                    className={`text-[0.65rem] shrink-0 ${
                      item.current_zone === 'red'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    {item.current_zone === 'red' ? 'Expedite' : 'Monitor'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
