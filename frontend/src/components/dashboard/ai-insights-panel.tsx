'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, RefreshCw, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Recommendation {
  action: string
  impact_inr: number
  reasoning: string
}

interface AIInsightsPanelProps {
  orgId: string
}

export function AIInsightsPanel({ orgId }: AIInsightsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/insights/weekly?org_id=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch insights')
      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch {
      setRecommendations([])
    }
  }, [orgId])

  useEffect(() => {
    setLoading(true)
    fetchInsights().finally(() => setLoading(false))
  }, [fetchInsights])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchInsights()
    setRefreshing(false)
  }

  async function handleAsk() {
    if (!question.trim()) return
    setAsking(true)
    setAnswer('')
    try {
      const res = await fetch('/api/v1/insights/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), org_id: orgId }),
      })
      if (!res.ok) throw new Error('Failed to get answer')
      const data = await res.json()
      setAnswer(data.answer || 'No answer returned.')
    } catch {
      setAnswer('Failed to get an answer. Please try again.')
    } finally {
      setAsking(false)
    }
  }

  function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle>AI Insights</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights available yet.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={`insight-${i}`}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{rec.action}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {formatINR(rec.impact_inr)}/mo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ask a Question */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Ask a Question</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Which products should I promote next month?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !asking) handleAsk()
              }}
            />
            <Button
              size="sm"
              onClick={handleAsk}
              disabled={asking || !question.trim()}
            >
              {asking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {answer && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
