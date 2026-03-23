'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ShoppingCart, CheckCircle } from 'lucide-react'

interface ShopifyConnectProps {
  organizationId: string
}

export function ShopifyConnect({ organizationId }: ShopifyConnectProps) {
  const [shopDomain, setShopDomain] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncType, setSyncType] = useState<'all' | 'products' | 'orders'>('all')
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)

  async function handleSync() {
    if (!shopDomain.trim() || !accessToken.trim()) {
      toast.error('Please enter both shop domain and access token')
      return
    }

    setSyncing(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/v1/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: shopDomain.trim(),
          access_token: accessToken.trim(),
          org_id: organizationId,
          sync_type: syncType,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setLastResult(data.results)
      toast.success('Shopify sync completed successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      toast.error(message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Shopify Connection
        </CardTitle>
        <CardDescription>
          Connect your Shopify store to sync products and orders automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-domain">Shop Domain</Label>
          <Input
            id="shop-domain"
            placeholder="your-store.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            disabled={syncing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-token">Access Token</Label>
          <Input
            id="access-token"
            type="password"
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            disabled={syncing}
          />
          <p className="text-xs text-muted-foreground">
            Generate from Shopify Admin &gt; Settings &gt; Apps &gt; Develop apps
          </p>
        </div>

        <div className="space-y-2">
          <Label>Sync Type</Label>
          <div className="flex gap-2">
            {(['all', 'products', 'orders'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSyncType(type)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize ${
                  syncType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                disabled={syncing}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing || !shopDomain.trim() || !accessToken.trim()}
          className="w-full"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </Button>

        {lastResult && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              Sync Complete
            </div>
            {(lastResult.products as Record<string, unknown> | undefined) && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Badge variant="secondary">Products</Badge>
                {String((lastResult.products as Record<string, unknown>).products ?? 0)} products,{' '}
                {String((lastResult.products as Record<string, unknown>).variants ?? 0)} variants synced
              </div>
            )}
            {(lastResult.orders as Record<string, unknown> | undefined) && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Badge variant="secondary">Orders</Badge>
                {String((lastResult.orders as Record<string, unknown>).orders ?? 0)} orders,{' '}
                {String((lastResult.orders as Record<string, unknown>).synced ?? 0)} synced
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
