'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function WhitelabelSettings({ organizationId }: { organizationId: string }) {
  const [brandName, setBrandName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6')
  const [logoUrl, setLogoUrl] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [hidePoweredBy, setHidePoweredBy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isScalePlan, setIsScalePlan] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const supabase = createClient()

      // Check plan
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', organizationId)
        .single()

      setIsScalePlan(org?.plan === 'scale')

      // Load existing config
      const { data: config } = await supabase
        .from('whitelabel_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (config) {
        setBrandName(config.brand_name || '')
        setPrimaryColor(config.primary_color || '#6366f1')
        setSecondaryColor(config.secondary_color || '#8b5cf6')
        setLogoUrl(config.logo_url || '')
        setCustomDomain(config.custom_domain || '')
        setHidePoweredBy(config.hide_powered_by || false)
      }
      setLoaded(true)
    }
    if (organizationId) {
      loadConfig()
    }
  }, [organizationId])

  async function saveConfig() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('whitelabel_config')
        .upsert({
          organization_id: organizationId,
          brand_name: brandName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
          custom_domain: customDomain,
          hide_powered_by: hidePoweredBy,
        }, { onConflict: 'organization_id' })

      if (error) throw error
      toast.success('White-label settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  if (!isScalePlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>White-Label Branding</CardTitle>
          <CardDescription>Customize the look and feel of your Throughput OS instance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <p className="text-lg font-medium">Scale Plan Required</p>
            <p className="text-sm text-muted-foreground">
              White-label branding is available on the Scale plan. Upgrade to customize
              your brand name, colors, logo, and domain.
            </p>
            <a href="/dashboard/settings?tab=billing">
              <Button variant="outline">View Plans</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>White-Label Branding</CardTitle>
        <CardDescription>Customize the look and feel of your Throughput OS instance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Brand Name</Label>
          <Input
            id="brand-name"
            placeholder="Your Brand Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-9 rounded border cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary-color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#8b5cf6"
              />
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-9 w-9 rounded border cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url">Logo URL</Label>
          <Input
            id="logo-url"
            placeholder="https://your-brand.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-domain">Custom Domain</Label>
          <Input
            id="custom-domain"
            placeholder="analytics.your-brand.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="hide-powered-by">Hide &quot;Powered by Throughput OS&quot;</Label>
            <p className="text-xs text-muted-foreground">Remove branding from the footer</p>
          </div>
          <Switch
            id="hide-powered-by"
            checked={hidePoweredBy}
            onCheckedChange={setHidePoweredBy}
          />
        </div>

        <Button onClick={saveConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
