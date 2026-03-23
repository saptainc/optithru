import { createClient } from '@/lib/supabase/client'

export async function applyWhitelabelTheme(orgId: string) {
  const supabase = createClient()
  const { data: config } = await supabase
    .from('whitelabel_config')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  if (config?.primary_color) {
    document.documentElement.style.setProperty('--primary', config.primary_color)
  }
  if (config?.secondary_color) {
    document.documentElement.style.setProperty('--secondary', config.secondary_color)
  }
  if (config?.brand_name) {
    document.title = config.brand_name
  }
}
