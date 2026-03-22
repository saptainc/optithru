'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
    <div className="w-full max-w-md mx-auto border rounded-lg p-6 bg-white shadow-sm">
      <h1 className="text-2xl font-semibold text-center mb-1">Throughput OS</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Sign in to your account</p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {debug && (
        <div className="mb-4 p-3 rounded bg-blue-50 text-blue-700 text-sm font-mono">{debug}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 underline">Sign up</Link>
      </p>
    </div>
  )
}
