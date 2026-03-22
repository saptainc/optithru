import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export function KPICard({ title, value, description, icon: Icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${
          trend === 'up' ? 'text-green-600 dark:text-green-400' :
          trend === 'down' ? 'text-red-600 dark:text-red-400' :
          ''
        }`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
