'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Copy, Share2, Users, UserPlus, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ReferralStats {
  total_sent: number
  signed_up: number
  converted: number
}

interface Props {
  organizationId: string
  userId: string
}

export function ReferralProgram({ organizationId, userId }: Props) {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [stats, setStats] = useState<ReferralStats>({ total_sent: 0, signed_up: 0, converted: 0 })
  const [loading, setLoading] = useState(true)
  const hasLoaded = useRef(false)

  const supabase = createClient()
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`
    : ''

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    loadReferralData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadReferralData() {
    setLoading(true)
    try {
      // Fetch existing referral code
      const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_org_id', organizationId)
        .limit(1)
        .single()

      if (existing?.referral_code) {
        setReferralCode(existing.referral_code)
      } else {
        // Generate a new code
        const code = `TOS-${organizationId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const { error } = await supabase
          .from('referrals')
          .insert({
            referrer_org_id: organizationId,
            referrer_user_id: userId,
            referral_code: code,
            status: 'active',
          })
        if (!error) {
          setReferralCode(code)
        }
      }

      // Get stats
      const { data: allReferrals } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_org_id', organizationId)

      if (allReferrals) {
        setStats({
          total_sent: allReferrals.length,
          signed_up: allReferrals.filter(r => r.status === 'signed_up' || r.status === 'converted').length,
          converted: allReferrals.filter(r => r.status === 'converted').length,
        })
      }
    } catch {
      // Silently handle — table may not exist yet
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Referral link copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy')
    })
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(
      `I'm using Throughput OS to optimize my e-commerce profitability with Theory of Constraints. It's helped me identify which products truly generate the most value. Try it out: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading referral program...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral code card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share Throughput OS with other e-commerce brands. Every referral helps fund humanitarian causes through Shankara.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareWhatsApp}>
              <Share2 className="h-4 w-4 mr-1" /> Share on WhatsApp
            </Button>
          </div>
          {referralCode && (
            <p className="text-xs text-muted-foreground">
              Referral code: <span className="font-mono font-medium">{referralCode}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
                <p className="text-sm text-muted-foreground">Referrals Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.signed_up}</p>
                <p className="text-sm text-muted-foreground">Signed Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <Badge variant="outline">1</Badge>
              <p className="font-medium">Share Your Link</p>
              <p className="text-muted-foreground">Send your referral link to other DTC brand owners.</p>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">2</Badge>
              <p className="font-medium">They Sign Up</p>
              <p className="text-muted-foreground">When they create an account using your link, you get credit.</p>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">3</Badge>
              <p className="font-medium">Both Benefit</p>
              <p className="text-muted-foreground">You both get extended trial access and priority support.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
