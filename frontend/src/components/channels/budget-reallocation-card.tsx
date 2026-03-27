'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface ChannelData {
  channel: string
  total_spend: number
  total_revenue: number
  estimated_throughput: number
  tcu: number
  conversions: number
  cpa: number
  roas: number
}

interface BudgetReallocationCardProps {
  channels: ChannelData[]
}

function formatChannelName(channel: string): string {
  return channel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function BudgetReallocationCard({ channels }: BudgetReallocationCardProps) {
  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No channel data available. Import marketing spend to see insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalSpend = channels.reduce((sum, ch) => sum + ch.total_spend, 0)
  const totalThroughput = channels.reduce((sum, ch) => sum + ch.estimated_throughput, 0)
  const sorted = [...channels].sort((a, b) => b.tcu - a.tcu)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Budget Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Marketing Spend</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Est. Throughput</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalThroughput)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Overall T/CU</p>
          <p className="text-2xl font-semibold">
            {totalSpend > 0 ? (totalThroughput / totalSpend).toFixed(2) : '\u2014'}
          </p>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Recommendations</p>
          <ul className="space-y-3">
            {sorted.map((ch) => {
              const isTop = ch === best
              const isBottom = ch === worst && sorted.length > 1

              let message: string
              if (isTop) {
                message = `Best T/CU at ${ch.tcu.toFixed(2)} \u2014 consider increasing budget`
              } else if (isBottom) {
                message = `Lowest T/CU at ${ch.tcu.toFixed(2)} \u2014 consider reducing budget`
              } else if (ch.tcu >= 1) {
                message = `Strong T/CU at ${ch.tcu.toFixed(2)} \u2014 maintain or grow`
              } else if (ch.tcu >= 0.5) {
                message = `Moderate T/CU at ${ch.tcu.toFixed(2)} \u2014 optimize targeting`
              } else {
                message = `Low T/CU at ${ch.tcu.toFixed(2)} \u2014 review or reallocate`
              }

              const dotColor =
                ch.tcu >= 1
                  ? 'bg-primary'
                  : ch.tcu >= 0.5
                    ? 'bg-[oklch(0.60_0.15_292)]'
                    : 'bg-muted-foreground'

              return (
                <li key={ch.channel} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`}
                  />
                  <span className="text-sm">
                    <span className="font-medium">{formatChannelName(ch.channel)}:</span>{' '}
                    {message}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
