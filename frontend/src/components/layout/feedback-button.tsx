'use client'

import { useState } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to send feedback')
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .limit(1)
        .single()

      const orgId = membership?.organization_id || ''

      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          user_id: user.id,
          message: message.trim(),
          page_url: window.location.pathname,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit feedback')

      toast.success('Feedback sent! Thank you.')
      setMessage('')
      setOpen(false)
    } catch {
      toast.error('Failed to send feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          />
        }
      >
        <MessageSquare className="h-4 w-4" />
        Send Feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Throughput OS. Share bugs, feature requests, or general feedback.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="What's on your mind?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
