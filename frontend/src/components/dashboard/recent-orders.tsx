import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/format'

interface Order {
  order_number: string
  order_date: string
  total: number
  channel: string
}

const channelColors: Record<string, string> = {
  dtc_website: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  amazon: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  wholesale_spa: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  email: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  affiliate: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.order_number}>
                <TableCell className="font-medium">{order.order_number}</TableCell>
                <TableCell>{formatDate(order.order_date)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={channelColors[order.channel] || ''}>
                    {order.channel.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
