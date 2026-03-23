'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function MarketplaceConnections({ organizationId }: { organizationId: string }) {
  const [sellerId, setSellerId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [amazonSyncing, setAmazonSyncing] = useState(false)
  const [meeshoImporting, setMeeshoImporting] = useState(false)
  const [meeshoFile, setMeeshoFile] = useState<File | null>(null)
  const [meeshoResult, setMeeshoResult] = useState<{ orders: number } | null>(null)

  async function syncAmazon() {
    if (!sellerId || !accessToken) {
      toast.error('Please enter Seller ID and Access Token')
      return
    }
    setAmazonSyncing(true)
    try {
      const res = await fetch('/api/v1/amazon/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId,
          access_token: accessToken,
          org_id: organizationId,
        }),
      })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      toast.success(`Amazon sync complete: ${data.products?.products || 0} products, ${data.orders?.orders || 0} orders`)
    } catch {
      toast.error('Amazon sync failed')
    } finally {
      setAmazonSyncing(false)
    }
  }

  async function importMeesho() {
    if (!meeshoFile) {
      toast.error('Please select a CSV file')
      return
    }
    setMeeshoImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', meeshoFile)
      const res = await fetch(`/api/v1/meesho/import?org_id=${organizationId}`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()
      setMeeshoResult(data.results)
      toast.success(`Meesho import complete: ${data.results?.orders || 0} orders`)
    } catch {
      toast.error('Meesho import failed')
    } finally {
      setMeeshoImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Connections</CardTitle>
        <CardDescription>Connect Amazon India and Meesho to sync orders and catalog</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="amazon">
          <TabsList>
            <TabsTrigger value="amazon">Amazon India</TabsTrigger>
            <TabsTrigger value="meesho">Meesho</TabsTrigger>
          </TabsList>

          <TabsContent value="amazon" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="seller-id">Seller ID</Label>
              <Input
                id="seller-id"
                placeholder="A1B2C3D4E5F6G7"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-token">SP-API Access Token</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="Enter your access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={syncAmazon} disabled={amazonSyncing}>
                {amazonSyncing ? 'Syncing...' : 'Sync Amazon'}
              </Button>
              <Badge variant="outline">Marketplace: India (A21TJRUUN4KGV)</Badge>
            </div>
          </TabsContent>

          <TabsContent value="meesho" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="meesho-csv">Meesho Order Report CSV</Label>
              <Input
                id="meesho-csv"
                type="file"
                accept=".csv"
                onChange={(e) => setMeeshoFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Export from Meesho Seller Hub &rarr; Orders &rarr; Download Report
              </p>
            </div>
            <Button onClick={importMeesho} disabled={meeshoImporting || !meeshoFile}>
              {meeshoImporting ? 'Importing...' : 'Import Orders'}
            </Button>
            {meeshoResult && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Import Results</p>
                <p className="text-muted-foreground">{meeshoResult.orders} orders imported</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
