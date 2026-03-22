import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Organization configuration, constraint definitions, and operating expense setup.
          </p>
        </div>
      </div>
    </div>
  )
}
