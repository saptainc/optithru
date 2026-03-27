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
    <div className="bg-card border border-border rounded-[0.5em] p-4 fizzy-shadow transition-[filter] duration-100 hover:brightness-[0.98]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div className={`text-[1.5rem] font-black tracking-tight leading-tight ${
        trend === 'up' ? 'text-[oklch(0.55_0.162_147)]' :
        trend === 'down' ? 'text-[oklch(0.59_0.19_38)]' :
        'text-foreground'
      }`}>
        {value}
      </div>
      {description && (
        <p className="text-[0.75rem] text-muted-foreground mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
