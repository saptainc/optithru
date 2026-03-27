'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { tcuColor } from '@/lib/design-tokens'

interface TCUProduct {
  product_name: string
  throughput_per_unit: number
  price: number
  tcu: number
}

export function TCUBarChart({ products }: { products: TCUProduct[] }) {
  const maxTCU = Math.max(...products.map(p => p.tcu), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">T/CU Product Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.slice(0, 10).map((p, i) => (
            <div key={`tcu-${i}`} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate">{p.product_name}</span>
                  <span className="text-xs font-medium" style={{ color: tcuColor(p.tcu) }}>
                    ${p.tcu.toFixed(2)}/CU
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(p.tcu / maxTCU) * 100}%`,
                      backgroundColor: tcuColor(p.tcu),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ranked by Throughput per Constraint Unit — focus on top-ranked items
        </p>
      </CardContent>
    </Card>
  )
}
