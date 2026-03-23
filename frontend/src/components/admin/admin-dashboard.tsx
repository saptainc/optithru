'use client'

import { Building2, Users, CreditCard, DollarSign, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Organization {
  id: string
  name: string
  created_at: string
}

interface Subscription {
  id: string
  organization_id: string
  plan: string
  status: string
  current_period_end?: string
  monthly_price?: number
}

interface Member {
  organization_id: string
  user_id: string
  role: string
  created_at: string
}

interface AdminDashboardProps {
  organizations: Organization[]
  subscriptions: Subscription[]
  members: Member[]
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 49,
  growth: 149,
  enterprise: 499,
}

export function AdminDashboard({ organizations, subscriptions, members }: AdminDashboardProps) {
  const totalOrgs = organizations.length
  const activeSubs = subscriptions.filter((s) => s.status === 'active')
  const mrr = activeSubs.reduce((sum, s) => {
    const price = s.monthly_price ?? PLAN_PRICES[s.plan] ?? 0
    return sum + price
  }, 0)
  const totalUsers = new Set(members.map((m) => m.user_id)).size

  function getOrgPlan(orgId: string): string {
    const sub = subscriptions.find((s) => s.organization_id === orgId)
    return sub?.plan || 'free'
  }

  function getOrgStatus(orgId: string): string {
    const sub = subscriptions.find((s) => s.organization_id === orgId)
    return sub?.status || 'none'
  }

  function getOrgMemberCount(orgId: string): number {
    return members.filter((m) => m.organization_id === orgId).length
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrgs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No organizations found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => {
                    const plan = getOrgPlan(org.id)
                    const status = getOrgStatus(org.id)
                    return (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getOrgMemberCount(org.id)}</TableCell>
                        <TableCell>{formatDate(org.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-xl font-semibold">${mrr.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                <p className="text-xl font-semibold">${(mrr * 12).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Revenue per Org</p>
                <p className="text-xl font-semibold">
                  ${totalOrgs > 0 ? Math.round(mrr / totalOrgs).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
