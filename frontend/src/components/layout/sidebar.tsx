'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, ShoppingCart, Megaphone,
  BarChart3, FlaskConical, Upload, Settings,
  LogOut, Menu, X, Target, TrendingUp, DollarSign,
  Factory,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackButton } from '@/components/layout/feedback-button'
import { WhatsNewBadge } from '@/components/layout/whats-new-badge'

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> }
type NavGroup = { heading: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Throughput P&L', href: '/dashboard/financials', icon: DollarSign },
    ],
  },
  {
    heading: 'Sales & Market',
    items: [
      { label: 'Products by T/CU', href: '/dashboard/rankings', icon: TrendingUp },
      { label: 'Channel Performance', href: '/dashboard/channels', icon: Megaphone },
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
    ],
  },
  {
    heading: 'Operations & Flow',
    items: [
      { label: 'Constraint Center', href: '/dashboard/constraints', icon: Target },
      { label: 'Buffer Management', href: '/dashboard/buffers', icon: BarChart3 },
      { label: 'Production Kanban', href: '/dashboard/production', icon: Factory },
    ],
  },
  {
    heading: 'Strategy',
    items: [
      { label: 'Simulate', href: '/dashboard/simulate', icon: FlaskConical },
    ],
  },
]

const adminItems: NavItem[] = [
  { label: 'Integrations / Import', href: '/dashboard/import', icon: Upload },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function NavContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        onClick={onNavClick}
        className={`group flex items-center gap-2.5 rounded-[0.3em] px-2.5 py-[0.4em] text-[0.85rem] font-medium transition-colors duration-100
          ${active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
            : 'text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${
          active ? 'text-primary' : 'text-sidebar-foreground/45'
        }`} />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[0.3em] bg-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-[15px] font-black text-sidebar-foreground tracking-tight">
            OptiThru
          </span>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <div className="px-2.5 pb-1 text-[0.7rem] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              {group.heading}
            </div>
            <div className="space-y-px">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin + Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-px">
        {adminItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <div className="pt-2 space-y-px">
          <WhatsNewBadge />
          <FeedbackButton />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-sidebar-foreground/50 hover:text-sidebar-foreground text-[0.85rem]"
            onClick={() => {
              window.location.href = '/login'
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r border-sidebar-border bg-sidebar">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-[0.3em] bg-background border border-border fizzy-shadow cursor-pointer"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border fizzy-shadow z-50">
            <NavContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
