'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Users, Mail, Clock, UserPlus, Loader2 } from 'lucide-react'

interface Member {
  user_id: string
  role: string
  created_at: string
  email?: string
}

interface Invite {
  id: string
  email: string
  role: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'owner': return 'default' as const
    case 'admin': return 'secondary' as const
    default: return 'outline' as const
  }
}

export function TeamManagement({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [sending, setSending] = useState(false)

  const fetchData = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)

    const supabase = createClient()

    // Fetch members
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('user_id, role, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })

    if (memberData) {
      // Fetch user emails via auth admin (not available client-side)
      // We'll use a workaround: query profiles if they exist, otherwise show user_id
      setMembers(memberData)
    }

    // Fetch invites via API
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      try {
        const res = await fetch(`/api/v1/invites?org_id=${organizationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setInvites(data.invites || [])
        }
      } catch {
        // Invites table may not exist yet
      }
    }

    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setSending(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      toast.error('Not authenticated')
      setSending(false)
      return
    }

    try {
      const res = await fetch('/api/v1/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          org_id: organizationId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Invite sent to ${inviteEmail}`)
        setInviteEmail('')
        setInviteRole('member')
        fetchData()
      } else {
        toast.error(data.detail || 'Failed to send invite')
      }
    } catch {
      toast.error('Network error sending invite')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at)

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </CardTitle>
          <CardDescription>Send an invite link to add someone to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={(v) => { if (v) setInviteRole(v) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {member.email ? member.email[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.email || member.user_id.slice(0, 8) + '...'}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={roleBadgeVariant(member.role)}>{member.role}</Badge>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No members found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invites ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pendingInvites.map((invite) => {
                const expired = new Date(invite.expires_at) < new Date()
                return (
                  <div key={invite.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadgeVariant(invite.role)}>{invite.role}</Badge>
                      {expired && <Badge variant="destructive">Expired</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
