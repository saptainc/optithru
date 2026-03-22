'use client'

import type { User } from '@supabase/supabase-js'

export function Header({ user }: { user: User }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
      <h1 className="text-lg font-semibold">Throughput OS</h1>
      <span className="text-sm text-muted-foreground">{user.email}</span>
    </header>
  )
}
