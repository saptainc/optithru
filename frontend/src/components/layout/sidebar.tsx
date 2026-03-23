'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, Package, ShoppingCart, Megaphone,
  BarChart3, FlaskConical, Upload, Settings,
  LogOut, Menu, Target, TrendingUp, ArrowLeftRight, DollarSign, Presentation,
  Factory, GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackButton } from '@/components/layout/feedback-button'
import { WhatsNewBadge } from '@/components/layout/whats-new-badge'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'T/CU Rankings', href: '/dashboard/rankings', icon: TrendingUp },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Channels', href: '/dashboard/channels', icon: Megaphone },
  { label: 'Buffers', href: '/dashboard/buffers', icon: BarChart3 },
  { label: 'Constraints', href: '/dashboard/constraints', icon: Target },
  { label: 'Production', href: '/dashboard/production', icon: Factory },
  { label: 'Compare', href: '/dashboard/compare', icon: ArrowLeftRight },
  { label: 'Financials', href: '/dashboard/financials', icon: DollarSign },
  { label: 'Simulate', href: '/dashboard/simulate', icon: FlaskConical },
  { label: 'Demo', href: '/dashboard/demo', icon: Presentation },
  { label: 'Learn', href: '/dashboard/learn', icon: GraduationCap },
  { label: 'Import', href: '/dashboard/import', icon: Upload },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function NavContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Throughput OS</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t space-y-1">
        <WhatsNewBadge />
        <FeedbackButton />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => {
            window.location.href = '/login'
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-background">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-background border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-64 bg-background border-r z-50">
            <NavContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
