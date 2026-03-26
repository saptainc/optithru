'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, Package, ShoppingCart, Megaphone,
  BarChart3, FlaskConical, Upload, Settings,
  LogOut, Menu, X, Target, TrendingUp, ArrowLeftRight, DollarSign, Presentation,
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
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
            <TrendingUp className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-heading text-lg font-semibold text-sidebar-foreground tracking-tight">
            OptiThru
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200
                ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                isActive ? 'text-amber-400' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
              }`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        <WhatsNewBadge />
        <FeedbackButton />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-[13px]"
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r border-sidebar-border bg-sidebar">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-background/80 backdrop-blur-sm border shadow-sm cursor-pointer"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-72 bg-sidebar shadow-2xl z-50 transition-transform">
            <NavContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
