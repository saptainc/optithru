'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
}

export function BillingSettings({ organizationId }: { organizationId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!organizationId) {
        setLoading(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('organization_id', organizationId)
        .limit(1)
        .single()
      setSubscription(data)
      setLoading(false)
    }
    load()
  }, [organizationId])

  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free Trial'

  const statusColor = subscription?.status === 'active'
    ? 'bg-green-100 text-green-800'
    : subscription?.status === 'cancelled'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800'

  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Billing</CardTitle>
        </div>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <span className="font-semibold">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant="secondary" className={statusColor}>
                {subscription?.status || 'trial'}
              </Badge>
            </div>
            {nextBilling && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Billing</span>
                <span className="text-sm text-muted-foreground">{nextBilling}</span>
              </div>
            )}
            <div className="pt-2 flex gap-2">
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  {subscription ? 'Change Plan' : 'Upgrade Plan'}
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
