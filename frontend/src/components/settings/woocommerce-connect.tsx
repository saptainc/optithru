'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Store, CheckCircle } from 'lucide-react'

interface WooCommerceConnectProps {
  organizationId: string
}

export function WooCommerceConnect({ organizationId }: WooCommerceConnectProps) {
  const [storeUrl, setStoreUrl] = useState('')
  const [consumerKey, setConsumerKey] = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)

  async function handleSync() {
    if (!storeUrl.trim() || !consumerKey.trim() || !consumerSecret.trim()) {
      toast.error('Please fill in all WooCommerce connection fields')
      return
    }

    setSyncing(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/v1/woocommerce/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_url: storeUrl.trim(),
          consumer_key: consumerKey.trim(),
          consumer_secret: consumerSecret.trim(),
          org_id: organizationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setLastResult(data.results)
      toast.success('WooCommerce sync completed successfully')
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
          <Store className="h-5 w-5" />
          WooCommerce Connection
        </CardTitle>
        <CardDescription>
          Connect your WooCommerce store to sync products and orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="woo-store-url">Store URL</Label>
          <Input
            id="woo-store-url"
            placeholder="https://your-store.com"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            disabled={syncing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="woo-consumer-key">Consumer Key</Label>
          <Input
            id="woo-consumer-key"
            placeholder="ck_xxxxxxxxxxxxxxxxxxxxx"
            value={consumerKey}
            onChange={(e) => setConsumerKey(e.target.value)}
            disabled={syncing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="woo-consumer-secret">Consumer Secret</Label>
          <Input
            id="woo-consumer-secret"
            type="password"
            placeholder="cs_xxxxxxxxxxxxxxxxxxxxx"
            value={consumerSecret}
            onChange={(e) => setConsumerSecret(e.target.value)}
            disabled={syncing}
          />
          <p className="text-xs text-muted-foreground">
            Generate from WooCommerce &gt; Settings &gt; Advanced &gt; REST API
          </p>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing || !storeUrl.trim() || !consumerKey.trim() || !consumerSecret.trim()}
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
