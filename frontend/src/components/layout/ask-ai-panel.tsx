'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Sparkles } from 'lucide-react'

export function AskAIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-background border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Ask AI</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-sm text-muted-foreground">
          Ask questions about your throughput data, constraints, or get recommendations.
        </p>
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button size="sm" disabled={!query.trim()} className="cursor-pointer">
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
