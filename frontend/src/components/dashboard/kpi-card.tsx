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
    <div className="glass-card rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
          trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
          'bg-amber-100 dark:bg-amber-900/30'
        }`}>
          <Icon className={`h-4 w-4 ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-amber-600 dark:text-amber-400'
          }`} />
        </div>
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${
        trend === 'up' ? 'text-emerald-700 dark:text-emerald-400' :
        trend === 'down' ? 'text-red-700 dark:text-red-400' :
        'text-foreground'
      }`}>
        {value}
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
