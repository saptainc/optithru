import { Megaphone } from 'lucide-react'

export default function ChannelsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Marketing Channels</h1>
          <p className="text-sm text-muted-foreground">
            Throughput per constraint unit (T/CU) by marketing channel. Identify which channels generate the most throughput per dollar spent.
          </p>
        </div>
      </div>
    </div>
  )
}
