'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { ArrowRight } from 'lucide-react'

interface ScenarioPanelProps {
  title: string
  before: { throughput: number; oe: number; netProfit: number; investment: number }
  after: { throughput: number; oe: number; netProfit: number; investment: number }
}

export function ScenarioPanel({ title, before, after }: ScenarioPanelProps) {
  const deltaT = after.throughput - before.throughput
  const deltaNP = after.netProfit - before.netProfit
  const deltaPct = before.throughput > 0 ? (deltaT / before.throughput) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">{formatCurrency(before.throughput)}</p>
            <p className="text-xs text-muted-foreground">NP: {formatCurrency(before.netProfit)}</p>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Projected</p>
            <p className="text-lg font-semibold">{formatCurrency(after.throughput)}</p>
            <p className="text-xs text-muted-foreground">NP: {formatCurrency(after.netProfit)}</p>
          </div>
        </div>
        <div className={`mt-4 p-3 rounded-lg text-center ${deltaT >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <p className={`text-2xl font-bold ${deltaT >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {deltaT >= 0 ? '+' : ''}{formatCurrency(deltaT)} ({deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
          </p>
          <p className="text-xs text-muted-foreground mt-1">Throughput Change ({'\u0394'}T)</p>
        </div>
      </CardContent>
    </Card>
  )
}
