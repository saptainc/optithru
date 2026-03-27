import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import Link from 'next/link'

interface Constraint {
  id: string
  name: string
  type: string
  capacity: number
  is_active: boolean
}

const TYPE_LABELS: Record<string, string> = {
  production_capacity: 'Production Capacity',
  marketing_budget: 'Marketing Budget',
  inventory_capital: 'Inventory Capital',
  labor_hours: 'Labor Hours',
  shelf_space: 'Shelf Space',
}

export function ConstraintStatus({ constraint }: { constraint: Constraint | null }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Constraint</CardTitle>
          <Link href="/dashboard/constraints" className="text-[0.75rem] text-primary hover:underline underline-offset-4">
            Manage
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!constraint ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[0.85rem] text-center">No active constraint defined</p>
            <Link
              href="/dashboard/constraints"
              className="mt-2 text-[0.75rem] text-primary hover:underline underline-offset-4"
            >
              Identify your bottleneck
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Constraint name & type */}
            <div>
              <p className="text-[1.1rem] font-black tracking-tight">{constraint.name}</p>
              <p className="text-[0.75rem] text-muted-foreground mt-0.5">
                {TYPE_LABELS[constraint.type] || constraint.type}
              </p>
            </div>

            {/* Utilization gauge */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wide">
                  Capacity
                </span>
                <span className="text-[1.5rem] font-black tracking-tight">
                  {constraint.capacity.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: '85%' }}
                />
              </div>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                Estimated ~85% utilized — every minute on this resource is throughput
              </p>
            </div>

            {/* TOC guidance */}
            <div className="bg-muted/50 rounded-[0.3em] p-3">
              <p className="text-[0.75rem] font-semibold mb-1">TOC Focus</p>
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                Exploit: maximize throughput on this resource. Subordinate: align all other
                decisions to protect constraint output.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
