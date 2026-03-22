import { createClient } from '@/lib/supabase/client'

async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
    ...options?.headers,
  }

  const response = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getThroughputSummary() {
  return apiClient('/throughput-summary')
}

export async function getProductRankings(constraintType: string) {
  return apiClient(`/product-rankings?constraint_type=${constraintType}`)
}

export async function runWhatIf(params: Record<string, unknown>) {
  return apiClient('/what-if', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getBufferStatus() {
  return apiClient('/buffer-status')
}
