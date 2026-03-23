'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'For small brands getting started with TOC',
    features: ['1 Shopify store', 'Up to 100 SKUs', 'Email support', 'Throughput dashboard', 'T/CU rankings'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 249,
    description: 'For growing brands optimizing profitability',
    features: ['3 stores', 'Unlimited SKUs', 'Priority support', 'API access', 'Buffer management', 'What-if simulator'],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 599,
    description: 'For enterprises with complex supply chains',
    features: ['Unlimited stores', 'White-label', 'API access', 'Dedicated CSM', 'Custom integrations', 'Advanced analytics'],
    popular: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(planId: string) {
    setLoading(planId)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      let orgId = ''
      if (session) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .limit(1)
          .single()
        orgId = membership?.organization_id || ''
      }

      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan: planId, org_id: orgId }),
      })

      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Throughput OS Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Apply Theory of Constraints to maximize profitability. Every plan includes
            the full TOC calculation engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? 'Redirecting...' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
