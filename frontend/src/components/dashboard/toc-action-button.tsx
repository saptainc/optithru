'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createTocAction } from '@/lib/kanban-actions'
import { toast } from 'sonner'

interface Props {
  title: string
  tocStep: string
  targetMetric: string
  linkedEntityType: string
  linkedEntityId: string
  linkedEntityName: string
}

export function TocActionButton({
  title,
  tocStep,
  targetMetric,
  linkedEntityType,
  linkedEntityId,
  linkedEntityName,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await createTocAction({
        title,
        tocStep,
        targetMetric,
        linkedEntityType,
        linkedEntityId,
        linkedEntityName,
      })
      toast.success('Task created in kanban')
    } catch {
      toast.error('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="h-6 px-1.5 text-[0.65rem] text-primary"
    >
      <Plus className="h-3 w-3 mr-0.5" />
      {loading ? '...' : 'Action'}
    </Button>
  )
}
