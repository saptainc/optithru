'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/format'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProductRow {
  variant_id: string
  product_id: string
  product_name: string
  variant_name: string
  category: string | null
  sku: string | null
  price: number
  cogs: number
  shipping_cost: number
  processing_cost: number
  total_tvc: number
  throughput_per_unit: number
  throughput_margin_pct: number
  inventory_quantity: number
  inventory_investment: number
  image_url: string | null
}

const categoryColors: Record<string, string> = {
  'Face Care': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Body Care': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Sets': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

type SortKey = 'product_name' | 'price' | 'cogs' | 'throughput_per_unit' | 'throughput_margin_pct' | 'inventory_quantity'

export function ProductTable({ initialData }: { initialData: ProductRow[] }) {
  const [products, setProducts] = useState<ProductRow[]>(initialData)
  const [sortKey, setSortKey] = useState<SortKey>('throughput_per_unit')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'cogs' | 'shipping_cost' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const supabase = createClient()

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function recalcRow(row: ProductRow, field: 'cogs' | 'shipping_cost', newVal: number): ProductRow {
    const cogs = field === 'cogs' ? newVal : row.cogs
    const shipping = field === 'shipping_cost' ? newVal : row.shipping_cost
    const processing = row.price * 0.029 + 0.30
    const tvc = cogs + shipping + processing
    const throughput = row.price - tvc
    const margin = row.price > 0 ? (throughput / row.price) * 100 : 0
    return {
      ...row,
      cogs,
      shipping_cost: shipping,
      processing_cost: Math.round(processing * 100) / 100,
      total_tvc: Math.round(tvc * 100) / 100,
      throughput_per_unit: Math.round(throughput * 100) / 100,
      throughput_margin_pct: Math.round(margin * 10) / 10,
      inventory_investment: Math.round(row.inventory_quantity * cogs * 100) / 100,
    }
  }

  async function handleSave(variantId: string, field: 'cogs' | 'shipping_cost') {
    const newVal = parseFloat(editValue)
    if (isNaN(newVal) || newVal < 0) {
      toast.error('Enter a valid positive number')
      setEditingCell(null)
      return
    }

    // Update Supabase
    const { error } = await supabase
      .from('product_variants')
      .update({ [field]: newVal })
      .eq('id', variantId)

    if (error) {
      toast.error(`Failed to save: ${error.message}`)
    } else {
      // Recalculate locally (no round-trip needed)
      setProducts(prev =>
        prev.map(p => p.variant_id === variantId ? recalcRow(p, field, newVal) : p)
      )
      toast.success(`${field === 'cogs' ? 'COGS' : 'Shipping'} updated`)
    }
    setEditingCell(null)
  }

  // Filter and sort
  const filtered = filterCategory === 'all'
    ? products
    : products.filter(p => p.category === filterCategory)

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const sortIcon = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-md text-sm ${filterCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
        >All ({products.length})</button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat!)}
            className={`px-3 py-1 rounded-md text-sm ${filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >{cat} ({products.filter(p => p.category === cat).length})</button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('product_name')}>
                Product{sortIcon('product_name')}
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price')}>
                Price{sortIcon('price')}
              </TableHead>
              <TableHead className="text-right">COGS</TableHead>
              <TableHead className="text-right">Shipping</TableHead>
              <TableHead className="text-right">Processing</TableHead>
              <TableHead className="text-right cursor-pointer font-bold" onClick={() => handleSort('throughput_per_unit')}>
                T/unit{sortIcon('throughput_per_unit')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('throughput_margin_pct')}>
                T margin{sortIcon('throughput_margin_pct')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('inventory_quantity')}>
                Stock{sortIcon('inventory_quantity')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.variant_id}>
                {/* Image */}
                <TableCell>
                  {row.image_url ? (
                    <img
                      src={row.image_url}
                      alt={row.product_name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />
                  )}
                </TableCell>

                {/* Product name */}
                <TableCell>
                  <Link href={`/dashboard/products/${row.variant_id}`} className="hover:underline text-primary">
                    <div className="font-medium text-sm">{row.product_name}</div>
                  </Link>
                  {row.sku && <div className="text-xs text-muted-foreground">{row.sku}</div>}
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Badge variant="secondary" className={categoryColors[row.category || ''] || ''}>
                    {row.category || 'Other'}
                  </Badge>
                </TableCell>

                {/* Price */}
                <TableCell className="text-right">{formatCurrency(row.price)}</TableCell>

                {/* COGS — editable */}
                <TableCell className="text-right">
                  {editingCell?.id === row.variant_id && editingCell.field === 'cogs' ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSave(row.variant_id, 'cogs')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(row.variant_id, 'cogs')}
                      className="w-20 h-7 text-right text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingCell({ id: row.variant_id, field: 'cogs' }); setEditValue(String(row.cogs)) }}
                      className="hover:bg-accent rounded px-2 py-0.5 cursor-pointer"
                      title="Click to edit COGS"
                    >
                      ${row.cogs.toFixed(2)}
                    </button>
                  )}
                </TableCell>

                {/* Shipping — editable */}
                <TableCell className="text-right">
                  {editingCell?.id === row.variant_id && editingCell.field === 'shipping_cost' ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSave(row.variant_id, 'shipping_cost')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(row.variant_id, 'shipping_cost')}
                      className="w-20 h-7 text-right text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingCell({ id: row.variant_id, field: 'shipping_cost' }); setEditValue(String(row.shipping_cost)) }}
                      className="hover:bg-accent rounded px-2 py-0.5 cursor-pointer"
                      title="Click to edit shipping"
                    >
                      ${row.shipping_cost.toFixed(2)}
                    </button>
                  )}
                </TableCell>

                {/* Processing — read only */}
                <TableCell className="text-right text-muted-foreground">
                  ${row.processing_cost.toFixed(2)}
                </TableCell>

                {/* Throughput per unit — key metric */}
                <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                  ${row.throughput_per_unit.toFixed(2)}
                </TableCell>

                {/* Throughput margin % */}
                <TableCell className="text-right">
                  {formatPercent(row.throughput_margin_pct)}
                </TableCell>

                {/* Stock */}
                <TableCell className="text-right">{row.inventory_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
