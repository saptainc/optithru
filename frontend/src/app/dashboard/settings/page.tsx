import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ShopifyConnect } from '@/components/settings/shopify-connect'
import { ThemeToggle } from '@/components/settings/theme-toggle'
import { TeamManagement } from '@/components/settings/team-management'
import { BillingSettings } from '@/components/settings/billing-settings'
import { WooCommerceConnect } from '@/components/settings/woocommerce-connect'
import { ApiKeysManager } from '@/components/settings/api-keys-manager'
import { MarketplaceConnections } from '@/components/settings/marketplace-connections'
import { WhitelabelSettings } from '@/components/settings/whitelabel-settings'
import { ReferralProgram } from '@/components/settings/referral-program'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single()

  const orgId = membership?.organization_id || ''

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Organization configuration and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="whitelabel">White-Label</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="referral">Referral Program</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShopifyConnect organizationId={orgId} />
            <ThemeToggle />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShopifyConnect organizationId={orgId} />
            <WooCommerceConnect organizationId={orgId} />
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysManager organizationId={orgId} />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <MarketplaceConnections organizationId={orgId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamManagement organizationId={orgId} />
        </TabsContent>

        <TabsContent value="whitelabel" className="mt-6">
          <WhitelabelSettings organizationId={orgId} />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingSettings organizationId={orgId} />
        </TabsContent>

        <TabsContent value="referral" className="mt-6">
          <ReferralProgram organizationId={orgId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
