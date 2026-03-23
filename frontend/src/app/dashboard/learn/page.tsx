import { createClient } from '@/lib/supabase/server'
import { GraduationCap } from 'lucide-react'
import { LearningCenter } from '@/components/learn/learning-center'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch modules (may not exist in DB yet — use static fallback)
  const { data: modules } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  // Fetch progress
  const { data: progress } = await supabase
    .from('learning_progress')
    .select('module_slug, completed_at')
    .eq('user_id', user?.id || '')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">TOC Learning Center</h1>
          <p className="text-sm text-muted-foreground">
            Master Theory of Constraints with interactive lessons
          </p>
        </div>
      </div>
      <LearningCenter
        modules={modules || []}
        completedSlugs={(progress || []).map((p: { module_slug: string }) => p.module_slug)}
        userId={user?.id || ''}
      />
    </div>
  )
}
