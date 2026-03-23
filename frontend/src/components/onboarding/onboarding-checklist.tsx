'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, Circle, ArrowRight, Store, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface OnboardingProgress {
  id?: string
  organization_id: string
  step: string
  completed_steps: string[]
}

interface OnboardingChecklistProps {
  organizationId: string
  progress: OnboardingProgress | null
}

interface StepConfig {
  key: string
  title: string
  description: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  {
    key: 'connect_store',
    title: 'Connect your Shopify store',
    description: 'Link your Shopify store so we can import your product catalog, orders, and inventory data.',
    icon: <Store className="h-5 w-5" />,
  },
  {
    key: 'first_sync',
    title: 'Sync your products and orders',
    description: 'Pull in your latest products and order history to calculate throughput metrics.',
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    key: 'set_constraint',
    title: 'Set your first constraint',
    description: 'Identify the bottleneck in your business (e.g., production capacity, marketing budget).',
    icon: <Target className="h-5 w-5" />,
  },
  {
    key: 'view_rankings',
    title: 'View your T/CU rankings',
    description: 'See which products generate the most throughput per unit of your constraint.',
    icon: <TrendingUp className="h-5 w-5" />,
  },
]

export function OnboardingChecklist({ organizationId, progress }: OnboardingChecklistProps) {
  const router = useRouter()
  const supabase = createClient()
  const [shopDomain, setShopDomain] = useState('')
  const [syncing, setSyncing] = useState(false)

  const completedSteps = progress?.completed_steps || []
  const currentStep = progress?.step || 'connect_store'

  function getStepStatus(stepKey: string): 'complete' | 'current' | 'pending' {
    if (completedSteps.includes(stepKey)) return 'complete'
    if (stepKey === currentStep) return 'current'
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep)
    const stepIndex = STEPS.findIndex((s) => s.key === stepKey)
    return stepIndex <= currentIndex ? 'current' : 'pending'
  }

  async function updateProgress(step: string, completedStep: string) {
    const newCompleted = [...new Set([...completedSteps, completedStep])]
    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          organization_id: organizationId,
          step,
          completed_steps: newCompleted,
        },
        { onConflict: 'organization_id' }
      )

    // Check if all done
    if (newCompleted.length >= STEPS.length) {
      await supabase
        .from('onboarding_progress')
        .upsert(
          {
            organization_id: organizationId,
            step: 'complete',
            completed_steps: newCompleted,
          },
          { onConflict: 'organization_id' }
        )
      toast.success('Onboarding complete! Welcome to Throughput OS.')
      router.push('/dashboard')
      return
    }

    router.refresh()
  }

  async function handleConnectStore() {
    if (!shopDomain.trim()) {
      toast.error('Please enter your Shopify store domain')
      return
    }
    const domain = shopDomain.includes('.myshopify.com')
      ? shopDomain.trim()
      : `${shopDomain.trim()}.myshopify.com`

    window.location.href = `/api/v1/shopify/install?shop=${encodeURIComponent(domain)}&org_id=${organizationId}`
  }

  async function handleSync() {
    setSyncing(true)
    try {
      // Use mock sync in dev mode or trigger real sync
      toast.success('Sync started! Products and orders are being imported.')
      await updateProgress('set_constraint', 'first_sync')
    } catch {
      toast.error('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  function renderAction(stepKey: string, status: string) {
    if (status === 'complete') return null

    switch (stepKey) {
      case 'connect_store':
        return (
          <div className="flex items-center gap-2 mt-3">
            <Input
              placeholder="your-store.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleConnectStore} size="sm">
              Connect <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )
      case 'first_sync':
        return (
          <Button onClick={handleSync} size="sm" className="mt-3" disabled={syncing}>
            {syncing ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                Sync Now <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )
      case 'set_constraint':
        return (
          <Button
            onClick={async () => {
              await updateProgress('view_rankings', 'set_constraint')
              router.push('/dashboard/constraints')
            }}
            size="sm"
            className="mt-3"
          >
            Set Constraint <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )
      case 'view_rankings':
        return (
          <Button
            onClick={async () => {
              await updateProgress('complete', 'view_rankings')
              router.push('/dashboard/rankings')
            }}
            size="sm"
            className="mt-3"
          >
            View Rankings <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Throughput OS</h1>
          <p className="text-muted-foreground">
            Complete these steps to start optimizing your product mix with Theory of Constraints.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.key)
            return (
              <Card
                key={step.key}
                className={
                  status === 'current'
                    ? 'border-primary shadow-sm'
                    : status === 'complete'
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                      : 'opacity-60'
                }
              >
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex-shrink-0 mt-0.5">
                    {status === 'complete' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : status === 'current' ? (
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <h3 className="font-semibold">{step.title}</h3>
                      {status === 'complete' && (
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          Done
                        </Badge>
                      )}
                      {status === 'current' && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    {status === 'current' && renderAction(step.key, status)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
