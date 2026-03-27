'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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

interface ChannelAnalysisProps {
  channels: ChannelData[]
}

function getTcuColor(tcu: number): string {
  if (tcu >= 1) return 'oklch(0.57 0.19 260)'  // primary blue
  if (tcu >= 0.5) return 'oklch(0.60 0.15 292)' // violet
  return 'oklch(0.55 0.02 260)'                  // muted ink
}

function getTcuBadge(tcu: number) {
  if (tcu >= 1) {
    return <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">High</Badge>
  }
  if (tcu >= 0.5) {
    return <Badge className="bg-[oklch(0.60_0.15_292)] hover:bg-[oklch(0.55_0.15_292)] text-white">Medium</Badge>
  }
  return <Badge variant="secondary" className="opacity-60">Low</Badge>
}

function formatChannelName(channel: string): string {
  return channel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ChannelAnalysis({ channels }: ChannelAnalysisProps) {
  const chartData = channels.map((ch) => ({
    channel: formatChannelName(ch.channel),
    tcu: ch.tcu,
    fill: getTcuColor(ch.tcu),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Channel T/CU Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {channels.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No marketing spend data found. Import marketing spend via CSV to see channel analysis.
          </p>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" label={{ value: 'T/CU', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="channel" width={90} tick={{ fontSize: 13 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(2), 'T/CU']}
                    contentStyle={{ fontSize: 13 }}
                  />
                  <Bar dataKey="tcu" radius={[0, 4, 4, 0]} maxBarSize={36}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Est. Throughput</TableHead>
                    <TableHead className="text-right">T/CU</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((ch) => (
                    <TableRow key={ch.channel}>
                      <TableCell className="font-medium">
                        {formatChannelName(ch.channel)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ch.total_spend)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ch.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ch.estimated_throughput)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {ch.tcu.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {ch.roas.toFixed(2)}x
                      </TableCell>
                      <TableCell className="text-right">
                        {ch.cpa > 0 ? formatCurrency(ch.cpa) : '\u2014'}
                      </TableCell>
                      <TableCell className="text-center">{getTcuBadge(ch.tcu)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              T/CU = Estimated Throughput / Marketing Spend. Higher values indicate more efficient
              channels. ROAS = Revenue / Spend.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
