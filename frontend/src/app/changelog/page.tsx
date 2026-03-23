import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ChangelogPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Changelog</h1>
      <p className="text-muted-foreground mb-8">What&apos;s new in Throughput OS</p>
      <div className="space-y-6">
        {(entries || []).map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    entry.category === 'feature'
                      ? 'default'
                      : entry.category === 'fix'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {entry.category}
                </Badge>
                <Badge variant="outline">{entry.version}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{entry.summary}</p>
              {entry.content && <p className="text-sm mt-3">{entry.content}</p>}
            </CardContent>
          </Card>
        ))}
        {(!entries || entries.length === 0) && (
          <p className="text-muted-foreground text-center py-12">No changelog entries yet.</p>
        )}
      </div>
    </div>
  )
}
