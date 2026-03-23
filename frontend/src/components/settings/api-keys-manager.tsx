'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Key, Copy, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ApiKeysManagerProps {
  organizationId: string
}

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  created_at: string
}

export function ApiKeysManager({ organizationId }: ApiKeysManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, last_used_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    setKeys(data || [])
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    if (organizationId) {
      fetchKeys()
    }
  }, [organizationId, fetchKeys])

  async function handleCreate() {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), org_id: organizationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create API key')
      }

      const data = await response.json()
      setGeneratedKey(data.key)
      setNewKeyName('')
      toast.success('API key created successfully')
      await fetchKeys()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create key'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(keyId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)

    if (error) {
      toast.error('Failed to revoke key')
    } else {
      toast.success('API key revoked')
      await fetchKeys()
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Manage API keys for programmatic access to your Throughput OS data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedKey && (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Save this key now — it will not be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white dark:bg-black p-2 rounded font-mono break-all">
                {generatedKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGeneratedKey(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {!showCreate ? (
          <Button
            variant="outline"
            onClick={() => setShowCreate(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate New Key
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production Dashboard"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Key'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false)
                  setNewKeyName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No API keys yet. Generate one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {keys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{apiKey.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <code>{apiKey.key_prefix}...</code>
                    <span>
                      Created{' '}
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </span>
                    {apiKey.last_used_at && (
                      <span>
                        Last used{' '}
                        {new Date(apiKey.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(apiKey.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
