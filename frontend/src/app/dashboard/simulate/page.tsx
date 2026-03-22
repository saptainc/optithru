import { FlaskConical } from 'lucide-react'

export default function SimulatePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">What-If Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Model scenarios: price changes, budget reallocation, SKU discontinuation, subscription adoption. See projected throughput impact.
          </p>
        </div>
      </div>
    </div>
  )
}
