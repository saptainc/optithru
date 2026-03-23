'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Mail, RefreshCw, Clock } from 'lucide-react'
import Link from 'next/link'

const DEMO_SCENARIOS = [
  {
    id: 'hero-product',
    title: "Your Hero Product Isn't Most Profitable",
    description:
      'The best-selling Kumkumadi Oil has lower T/CU than the Moisturizer — when you account for constraint consumption, the rankings invert.',
    insight: 'T/CU rankings reveal hidden profitability',
    icon: TrendingUp,
    link: '/dashboard/rankings',
    color: 'text-green-600',
  },
  {
    id: 'capital-traps',
    title: 'Bottom 10 SKUs Destroy Capital',
    description:
      '10 low-velocity SKUs have IDD/TDD ratios above 50 — they tie up $40K+ in capital while generating minimal throughput.',
    insight: 'Capital trap analysis identifies waste',
    icon: AlertTriangle,
    link: '/dashboard/products?tab=capital-traps',
    color: 'text-red-600',
  },
  {
    id: 'email-vs-meta',
    title: 'Email is 12-40x Better Than Meta Ads',
    description:
      'Email marketing generates $16.80 of throughput per dollar spent vs. $0.79 for Meta — a 21x difference in T/CU.',
    insight: 'Channel T/CU exposes misallocated spend',
    icon: Mail,
    link: '/dashboard/channels',
    color: 'text-blue-600',
  },
  {
    id: 'subscription',
    title: '10% Subscription Transforms Economics',
    description:
      'Converting just 10% of one-time buyers to subscribers at 15% discount creates an 8.7x LTV multiplier.',
    insight: 'Subscriptions compound throughput over time',
    icon: RefreshCw,
    link: '/dashboard/simulate',
    color: 'text-purple-600',
  },
  {
    id: 'lead-time',
    title: 'Shorter Lead Time Frees 35% Buffer Cash',
    description:
      'Reducing supplier lead time from 14 to 9 days reduces buffer requirements by 35%, freeing ~$8K in working capital.',
    insight: 'Buffer management unlocks trapped capital',
    icon: Clock,
    link: '/dashboard/buffers',
    color: 'text-amber-600',
  },
]

interface DemoScenariosProps {
  organizationId: string
  savedSimulations: Array<Record<string, unknown>>
}

export function DemoScenarios({ organizationId, savedSimulations }: DemoScenariosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DEMO_SCENARIOS.map((scenario) => (
        <Card key={scenario.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <scenario.icon className={`h-5 w-5 ${scenario.color}`} />
              <CardTitle className="text-base">{scenario.title}</CardTitle>
            </div>
            <CardDescription className="mt-2">{scenario.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end gap-3">
            <Badge variant="secondary" className="w-fit">
              {scenario.insight}
            </Badge>
            <Link href={scenario.link}>
              <Button variant="outline" className="w-full">
                View Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
