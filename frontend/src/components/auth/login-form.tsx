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
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">OptiThru</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm border border-red-200/50 dark:border-red-800/30">{error}</div>
        )}

        {debug && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-sm font-mono border border-blue-200/50 dark:border-blue-800/30">{debug}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:from-amber-700 hover:to-amber-800 transition-all shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-amber-700 dark:text-amber-400 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
