'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email', meta_ads: 'Meta Ads', google_ads: 'Google Ads',
  organic_social: 'Organic Social', direct: 'Direct / DTC', referral: 'Referral',
  affiliate: 'Affiliate', amazon: 'Amazon', wholesale: 'Wholesale',
  DTC: 'Direct / DTC', Amazon: 'Amazon', Wholesale: 'Wholesale',
  Email: 'Email',
}

interface ChannelThroughput {
  channel: string
  throughput: number
}

export function ChannelThroughputChart({ channels }: { channels: ChannelThroughput[] }) {
  const maxT = Math.max(...channels.map(c => c.throughput), 1)

  // Fizzy-compatible brand colors (no red/yellow/green per TOC rule)
  const barColors = [
    'oklch(0.57 0.19 260)',   // blue
    'oklch(0.60 0.15 292)',   // violet
    'oklch(0.66 0.12 90)',    // amber/gold
    'oklch(0.55 0.10 210)',   // teal
    'oklch(0.50 0.12 320)',   // purple
    'oklch(0.62 0.08 50)',    // warm neutral
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Channel Throughput ($T)</CardTitle>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <p className="text-[0.85rem] text-muted-foreground text-center py-8">
            No channel data available
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map((ch, i) => (
              <div key={ch.channel} className="flex items-center gap-3">
                <span className="text-[0.85rem] w-28 truncate shrink-0">
                  {CHANNEL_LABELS[ch.channel] || ch.channel}
                </span>
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded-[0.2em] overflow-hidden">
                    <div
                      className="h-full rounded-[0.2em] transition-all"
                      style={{
                        width: `${(ch.throughput / maxT) * 100}%`,
                        backgroundColor: barColors[i % barColors.length],
                      }}
                    />
                  </div>
                </div>
                <span className="text-[0.85rem] font-mono font-semibold w-20 text-right">
                  {formatCurrency(ch.throughput)}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[0.7rem] text-muted-foreground mt-3">
          Total Throughput ($T) generated per channel — not revenue, not order count
        </p>
      </CardContent>
    </Card>
  )
}
