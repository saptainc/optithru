'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'

export interface PnLData {
  revenue: number
  tvc: number
  throughput: number
  operating_expense: number
  net_profit: number
  investment: number
  roi: number
  productivity: number
  investment_turns: number
}

function PnLRow({
  label,
  value,
  format = 'currency',
  bold = false,
  indent = false,
  separator = false,
  highlight = false,
  sublabel,
}: {
  label: string
  value: number
  format?: 'currency' | 'percent' | 'ratio'
  bold?: boolean
  indent?: boolean
  separator?: boolean
  highlight?: boolean
  sublabel?: string
}) {
  const formatted = format === 'currency'
    ? formatCurrency(value)
    : format === 'percent'
    ? formatPercent(value * 100)
    : value.toFixed(2) + 'x'

  const isNegative = value < 0

  return (
    <>
      {separator && (
        <tr>
          <td colSpan={2} className="border-t-2 border-dashed pt-2" />
        </tr>
      )}
      <tr className={highlight ? 'bg-green-50 dark:bg-green-950/20' : ''}>
        <td className={`py-2 ${indent ? 'pl-6' : ''} ${bold ? 'font-semibold' : 'text-muted-foreground'}`}>
          {label}
          {sublabel && (
            <span className="block text-xs text-muted-foreground font-normal">{sublabel}</span>
          )}
        </td>
        <td className={`py-2 text-right ${bold ? 'font-semibold text-lg' : ''} ${isNegative ? 'text-red-600 dark:text-red-400' : ''}`}>
          {formatted}
        </td>
      </tr>
    </>
  )
}

export function ThroughputPnL({ data }: { data: PnLData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Throughput Accounting P&L</CardTitle>
        <CardDescription>
          Theory of Constraints income statement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <tbody>
            <PnLRow label="Revenue" value={data.revenue} bold />
            <PnLRow label="Less: Truly Variable Costs (TVC)" value={data.tvc} indent />
            <PnLRow
              label="= Throughput (T)"
              value={data.throughput}
              bold
              highlight
              sublabel="Revenue - TVC"
            />
            <PnLRow label="Less: Operating Expenses (OE)" value={data.operating_expense} indent />
            <PnLRow
              label="= Net Profit (NP)"
              value={data.net_profit}
              bold
              highlight
              sublabel="T - OE"
            />

            <PnLRow
              label="Investment (I)"
              value={data.investment}
              separator
              sublabel="Inventory investment at cost"
            />
            <PnLRow
              label="ROI"
              value={data.roi}
              format="percent"
              bold
              sublabel="(T - OE) / I"
            />
            <PnLRow
              label="Productivity"
              value={data.productivity}
              format="ratio"
              bold
              sublabel={`T / OE (goal: > 1.0) ${data.productivity >= 1 ? ' -- Above breakeven' : ' -- Below breakeven'}`}
            />
            <PnLRow
              label="Investment Turns"
              value={data.investment_turns}
              format="ratio"
              bold
              sublabel="T / I (higher = less capital tied up)"
            />
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
