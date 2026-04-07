'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProductionResources } from '@/components/production/production-resources'
import { KanbanEmbed } from '@/components/production/kanban-embed'

interface ProductionResource {
  id: string
  organization_id: string
  name: string
  capacity_per_week: number
  capacity_unit: string
  current_load: number | null
  is_constraint: boolean
  created_at: string
}

export function ProductionTabs({
  resources,
  organizationId,
}: {
  resources: ProductionResource[]
  organizationId: string
}) {
  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Strategic Kanban</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban">
        <KanbanEmbed />
      </TabsContent>
      <TabsContent value="resources">
        <ProductionResources initialResources={resources} organizationId={organizationId} />
      </TabsContent>
    </Tabs>
  )
}
