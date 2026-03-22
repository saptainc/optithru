import { ShoppingCart } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Order history and channel performance analysis.
          </p>
        </div>
      </div>
    </div>
  )
}

