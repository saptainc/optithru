'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState('')
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError(null)
    setDebug('Starting login...')

    try {
      const supabase = createClient()
      setDebug('Supabase client created, calling signInWithPassword...')

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setDebug('Auth error: ' + authError.message)
        setError(authError.message)
        setLoading(false)
      } else {
        setDebug('Login success! User: ' + data.user?.email + ' — Redirecting...')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (e: any) {
      setDebug('Exception: ' + e.message)
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="fizzy-panel p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-[0.3em] bg-primary flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-[1.5rem] font-black tracking-tight">OptiThru</h1>
          <p className="text-[0.85rem] text-muted-foreground mt-0.5">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[0.5em] bg-destructive/10 text-destructive text-[0.85rem]">{error}</div>
        )}

        {debug && (
          <div className="mb-4 p-3 rounded-[0.5em] bg-primary/10 text-primary text-[0.85rem] font-mono">{debug}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[0.85rem] font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-input rounded-[0.5em] text-[0.85rem] bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.85rem] font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-input rounded-[0.5em] text-[0.85rem] bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground fizzy-pill text-[0.85rem] font-semibold disabled:opacity-30 disabled:pointer-events-none hover:brightness-90 transition-[filter] duration-100 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <p className="text-[0.85rem] text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline underline-offset-4">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
