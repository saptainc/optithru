'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle2, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ContentSection {
  heading: string
  body: string
}

interface Module {
  slug: string
  title: string
  description: string
  duration_minutes: number
  content_type: string
  content: { sections: ContentSection[] }
}

const STATIC_MODULES: Module[] = [
  {
    slug: 'what-is-throughput-accounting',
    title: 'What is Throughput Accounting?',
    description: 'Learn why T (Throughput) matters more than Revenue, and how T/I/OE replaces the traditional P&L.',
    duration_minutes: 5,
    content_type: 'article',
    content: {
      sections: [
        { heading: 'The Revenue Illusion', body: 'Traditional accounting optimizes Revenue and Gross Margin. But revenue tells you nothing about how efficiently you use your scarcest resource. Throughput Accounting flips the lens: T = Revenue - Truly Variable Costs (COGS, shipping, payment processing). Everything else is Operating Expense.' },
        { heading: 'T, I, and OE', body: 'Throughput (T): Money coming in minus what goes directly out per sale. Investment (I): Money stuck inside the system (inventory). Operating Expense (OE): Money you spend to turn I into T. Net Profit = T - OE. The goal: maximize T while minimizing I and OE.' },
        { heading: 'Why This Changes Rankings', body: 'A $100 product with $60 COGS has $40 throughput. A $30 product with $5 COGS has $25 throughput. Traditional accounting says the $100 product is better. But if the $30 product uses 3x less of your constraint? Its T/CU is much higher — it creates more value per unit of your bottleneck.' },
      ]
    }
  },
  {
    slug: 'constraint-concept',
    title: 'The Constraint Concept',
    description: 'Every system has one bottleneck. Find it, exploit it, and everything improves.',
    duration_minutes: 4,
    content_type: 'article',
    content: {
      sections: [
        { heading: 'What is a Constraint?', body: 'A constraint is the single resource that limits your system\'s throughput. For DTC brands, it\'s usually: marketing budget (you can\'t afford to advertise everything), production capacity (you can\'t make enough), or inventory capital (you can\'t stock everything).' },
        { heading: 'The 5 Focusing Steps', body: '1. IDENTIFY the constraint. 2. EXPLOIT it (get maximum throughput from it). 3. SUBORDINATE everything else to the constraint. 4. ELEVATE the constraint (invest to increase its capacity). 5. Repeat — don\'t let inertia become the new constraint.' },
      ]
    }
  },
  {
    slug: 'reading-tcu-rankings',
    title: 'Reading Your T/CU Rankings',
    description: 'How to interpret the T/CU rankings page and make allocation decisions.',
    duration_minutes: 3,
    content_type: 'article',
    content: {
      sections: [
        { heading: 'What T/CU Means', body: 'T/CU = Throughput per Constraint Unit. It answers: "For every unit of my scarce resource I spend on this product, how much throughput do I get back?" Higher T/CU = better use of your constraint.' },
        { heading: 'How to Use Rankings', body: 'Prioritize marketing, inventory, and production for products at the TOP of your T/CU rankings. Products at the bottom may still sell, but they consume your constraint less efficiently. Consider discontinuing products with very low T/CU AND high inventory (capital traps).' },
      ]
    }
  },
  {
    slug: 'first-what-if',
    title: 'Your First What-If Scenario',
    description: 'Walk through creating a price change scenario in the simulator.',
    duration_minutes: 6,
    content_type: 'article',
    content: {
      sections: [
        { heading: 'Open the Simulator', body: 'Navigate to the Simulate page. You\'ll see 6 tabs: Price Change, Budget Reallocation, SKU Discontinuation, Constraint Change, Product Mix, and Subscriptions.' },
        { heading: 'Try a Price Increase', body: 'On the Price Change tab, drag the slider to +10%. Watch the delta-T (throughput change) update in real-time. A 10% price increase on a product with 60% throughput margin adds 16.7% to throughput per unit. But will customers still buy at the higher price? That\'s the judgment call — the tool shows the math.' },
      ]
    }
  },
  {
    slug: 'buffer-management',
    title: 'Understanding Buffer Management',
    description: 'Green, Yellow, and Red zones — protecting your constraint from variability.',
    duration_minutes: 4,
    content_type: 'article',
    content: {
      sections: [
        { heading: 'Why Buffers?', body: 'Variability is the enemy of throughput. Supplier delays, demand spikes, and quality issues all threaten your constraint. Buffers protect against this variability — they\'re a time/quantity cushion.' },
        { heading: 'The Three Zones', body: 'Green zone (top third): comfortable. No action needed. Yellow zone (middle third): monitor closely. Consider expediting replenishment. Red zone (bottom third): URGENT. You\'re at risk of stockout, which means lost throughput. Act immediately.' },
      ]
    }
  },
]

interface Props {
  modules: Module[]
  completedSlugs: string[]
  userId: string
}

export function LearningCenter({ modules, completedSlugs, userId }: Props) {
  const displayModules = modules.length > 0 ? modules : STATIC_MODULES
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedSlugs))
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [markingComplete, setMarkingComplete] = useState<string | null>(null)

  const supabase = createClient()
  const progressPct = displayModules.length > 0
    ? Math.round((completed.size / displayModules.length) * 100)
    : 0

  async function markComplete(slug: string) {
    if (!userId) {
      toast.error('You must be logged in to track progress')
      return
    }
    setMarkingComplete(slug)
    try {
      const { error } = await supabase
        .from('learning_progress')
        .upsert({ user_id: userId, module_slug: slug, completed_at: new Date().toISOString() }, { onConflict: 'user_id,module_slug' })
      if (error) throw error
      setCompleted(prev => new Set([...prev, slug]))
      toast.success('Module completed!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save progress'
      toast.error(message)
    } finally {
      setMarkingComplete(null)
    }
  }

  async function markIncomplete(slug: string) {
    if (!userId) return
    setMarkingComplete(slug)
    try {
      const { error } = await supabase
        .from('learning_progress')
        .delete()
        .eq('user_id', userId)
        .eq('module_slug', slug)
      if (error) throw error
      setCompleted(prev => {
        const next = new Set(prev)
        next.delete(slug)
        return next
      })
      toast.success('Progress reset')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset progress'
      toast.error(message)
    } finally {
      setMarkingComplete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completed.size} of {displayModules.length} modules completed
            </span>
            <span className="text-sm text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayModules.map((mod) => {
          const isCompleted = completed.has(mod.slug)
          const isExpanded = expandedSlug === mod.slug

          return (
            <Card
              key={mod.slug}
              className={`transition-all ${isCompleted ? 'border-green-300 bg-green-50/30 dark:bg-green-950/10' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <CardTitle className="text-base">{mod.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {mod.duration_minutes}m
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Expand/collapse button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setExpandedSlug(isExpanded ? null : mod.slug)}
                >
                  {isExpanded ? (
                    <><ChevronUp className="h-4 w-4 mr-1" /> Hide Content</>
                  ) : (
                    <><ChevronDown className="h-4 w-4 mr-1" /> Read Lesson</>
                  )}
                </Button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="space-y-4 pt-2 border-t">
                    {mod.content.sections.map((section, idx) => (
                      <div key={idx} className="space-y-1">
                        <h3 className="font-semibold text-sm">{section.heading}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                      </div>
                    ))}
                    <div className="pt-2">
                      {isCompleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markIncomplete(mod.slug)}
                          disabled={markingComplete === mod.slug}
                        >
                          {markingComplete === mod.slug ? 'Saving...' : 'Mark Incomplete'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => markComplete(mod.slug)}
                          disabled={markingComplete === mod.slug}
                        >
                          {markingComplete === mod.slug ? 'Saving...' : 'Mark as Complete'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
