'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ExternalLink, Link2, CheckCircle2 } from 'lucide-react'

interface MarketplaceConfig {
  id: string
  name: string
  description: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
  badge: string
  syncEndpoint: string
  docsHint: string
}

const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Sync products and orders from Amazon Seller Central via SP-API',
    fields: [
      { key: 'seller_id', label: 'Seller ID', placeholder: 'A1B2C3D4E5F6G7' },
      { key: 'access_token', label: 'SP-API Access Token', placeholder: 'Enter your access token', type: 'password' },
      { key: 'marketplace_id', label: 'Marketplace ID', placeholder: 'ATVPDKIKX0DER (US)' },
    ],
    badge: 'US · FBA & FBM',
    syncEndpoint: '/api/v1/amazon/sync',
    docsHint: 'Amazon Seller Central → Apps & Services → Develop Apps',
  },
  {
    id: 'walmart',
    name: 'Walmart Marketplace',
    description: 'Connect Walmart Seller Center to import catalog and order data',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'Your Walmart API client ID' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'Your Walmart API client secret', type: 'password' },
    ],
    badge: 'US · 3P Seller',
    syncEndpoint: '/api/v1/walmart/sync',
    docsHint: 'Walmart Seller Center → Settings → API Keys',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    description: 'Sync handmade and artisan product listings and orders',
    fields: [
      { key: 'shop_id', label: 'Shop ID', placeholder: 'YourEtsyShopName' },
      { key: 'api_key', label: 'API Key (Keystring)', placeholder: 'Enter your Etsy API keystring', type: 'password' },
    ],
    badge: 'US · Handmade',
    syncEndpoint: '/api/v1/etsy/sync',
    docsHint: 'Etsy → Shop Manager → Settings → Options → API Keys',
  },
  {
    id: 'ebay',
    name: 'eBay',
    description: 'Import eBay listings, orders, and seller analytics',
    fields: [
      { key: 'auth_token', label: 'OAuth Token', placeholder: 'Your eBay OAuth user token', type: 'password' },
    ],
    badge: 'US · Auction & BIN',
    syncEndpoint: '/api/v1/ebay/sync',
    docsHint: 'eBay Developer Program → Application Keys → User Tokens',
  },
  {
    id: 'target-plus',
    name: 'Target Plus',
    description: 'Connect Target+ marketplace for order and catalog sync',
    fields: [
      { key: 'partner_id', label: 'Partner ID', placeholder: 'Your Target Plus partner ID' },
      { key: 'api_key', label: 'API Key', placeholder: 'Enter your API key', type: 'password' },
    ],
    badge: 'US · Invite Only',
    syncEndpoint: '/api/v1/target/sync',
    docsHint: 'Target Partners Online → API Credentials',
  },
  {
    id: 'faire',
    name: 'Faire',
    description: 'Sync wholesale orders from Faire marketplace',
    fields: [
      { key: 'brand_id', label: 'Brand ID', placeholder: 'Your Faire brand identifier' },
      { key: 'api_token', label: 'API Token', placeholder: 'Enter your Faire API token', type: 'password' },
    ],
    badge: 'US · Wholesale',
    syncEndpoint: '/api/v1/faire/sync',
    docsHint: 'Faire → Brand Portal → Integrations',
  },
]

export function MarketplaceConnections({ organizationId }: { organizationId: string }) {
  const [activeMarketplace, setActiveMarketplace] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({})
  const [syncing, setSyncing] = useState<string | null>(null)

  function updateField(marketplaceId: string, fieldKey: string, value: string) {
    setFieldValues((prev) => ({
      ...prev,
      [marketplaceId]: { ...prev[marketplaceId], [fieldKey]: value },
    }))
  }

  async function syncMarketplace(marketplace: MarketplaceConfig) {
    const values = fieldValues[marketplace.id] || {}
    const missingFields = marketplace.fields.filter((f) => !values[f.key]?.trim())
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map((f) => f.label).join(', ')}`)
      return
    }
    setSyncing(marketplace.id)
    try {
      const res = await fetch(marketplace.syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, org_id: organizationId }),
      })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      toast.success(`${marketplace.name} sync complete: ${data.products?.count || 0} products, ${data.orders?.count || 0} orders`)
    } catch {
      toast.error(`${marketplace.name} sync failed — check your credentials`)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Connections</CardTitle>
        <CardDescription>
          Connect US e-commerce marketplaces to sync products, orders, and throughput data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MARKETPLACES.map((mp) => {
            const isExpanded = activeMarketplace === mp.id
            const isSyncing = syncing === mp.id
            const values = fieldValues[mp.id] || {}
            const allFieldsFilled = mp.fields.every((f) => values[f.key]?.trim())

            return (
              <div
                key={mp.id}
                className={`border rounded-[0.5em] p-4 transition-all duration-100 ${
                  isExpanded ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-[0.95rem] font-bold">{mp.name}</h3>
                    <p className="text-[0.75rem] text-muted-foreground mt-0.5">{mp.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[0.65rem] shrink-0 ml-2">{mp.badge}</Badge>
                </div>

                {!isExpanded ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-1.5"
                    onClick={() => setActiveMarketplace(mp.id)}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Connect
                  </Button>
                ) : (
                  <div className="mt-3 space-y-3">
                    {mp.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label htmlFor={`${mp.id}-${field.key}`} className="text-[0.8rem]">
                          {field.label}
                        </Label>
                        <Input
                          id={`${mp.id}-${field.key}`}
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={values[field.key] || ''}
                          onChange={(e) => updateField(mp.id, field.key, e.target.value)}
                          className="h-8 text-[0.85rem]"
                        />
                      </div>
                    ))}
                    <p className="text-[0.7rem] text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {mp.docsHint}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => syncMarketplace(mp)}
                        disabled={isSyncing || !allFieldsFilled}
                        className="flex-1 gap-1.5"
                      >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveMarketplace(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
