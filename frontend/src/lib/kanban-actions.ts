import { createClient } from '@/lib/supabase/client'

export async function createTocAction(params: {
  title: string
  tocStep: string
  targetMetric: string
  linkedEntityType: string
  linkedEntityId: string
  linkedEntityName: string
  boardId?: string
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch('/api/v1/kanban/toc/actions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: params.boardId || 'default',
      title: params.title,
      toc_step: params.tocStep,
      target_metric: params.targetMetric,
      linked_entity_type: params.linkedEntityType,
      linked_entity_id: params.linkedEntityId,
      linked_entity_name: params.linkedEntityName,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create action: ${body}`)
  }

  return res.json()
}
