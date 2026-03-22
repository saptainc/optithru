export interface TargetField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
  alternateMatches?: string[]
}

export interface FieldMapping {
  csvColumn: string
  targetField: string | null
}

export const ENTITY_FIELDS: Record<string, TargetField[]> = {
  products: [
    { key: 'name', label: 'Product Name', type: 'string', required: true, alternateMatches: ['product_name', 'title', 'product'] },
    { key: 'category', label: 'Category', type: 'string', required: false, alternateMatches: ['type', 'product_type'] },
    { key: 'handle', label: 'Handle / Slug', type: 'string', required: false, alternateMatches: ['slug', 'url'] },
    { key: 'image_url', label: 'Image URL', type: 'string', required: false, alternateMatches: ['image', 'photo', 'picture'] },
  ],
  product_variants: [
    { key: 'product_name', label: 'Product Name', type: 'string', required: true, alternateMatches: ['product', 'parent_product'] },
    { key: 'name', label: 'Variant Name', type: 'string', required: true, alternateMatches: ['variant', 'variant_name', 'title'] },
    { key: 'sku', label: 'SKU', type: 'string', required: false, alternateMatches: ['item_number', 'part_number'] },
    { key: 'price', label: 'Price', type: 'number', required: true, alternateMatches: ['retail_price', 'selling_price', 'msrp'] },
    { key: 'cogs', label: 'COGS', type: 'number', required: true, alternateMatches: ['cost', 'cost_price', 'unit_cost', 'purchase_price'] },
    { key: 'shipping_cost', label: 'Shipping Cost', type: 'number', required: false, alternateMatches: ['shipping', 'freight'] },
    { key: 'inventory_quantity', label: 'Inventory Qty', type: 'number', required: false, alternateMatches: ['stock', 'qty', 'quantity', 'on_hand'] },
  ],
  orders: [
    { key: 'order_number', label: 'Order Number', type: 'string', required: true, alternateMatches: ['order_id', 'order_no', 'number'] },
    { key: 'customer_email', label: 'Customer Email', type: 'string', required: false, alternateMatches: ['email', 'customer'] },
    { key: 'channel', label: 'Channel', type: 'string', required: false, alternateMatches: ['source', 'sales_channel'] },
    { key: 'total', label: 'Total', type: 'number', required: true, alternateMatches: ['order_total', 'amount', 'grand_total'] },
    { key: 'order_date', label: 'Order Date', type: 'date', required: true, alternateMatches: ['date', 'created_at', 'placed_at'] },
  ],
  marketing_spend: [
    { key: 'channel', label: 'Channel', type: 'string', required: true, alternateMatches: ['source', 'platform', 'medium'] },
    { key: 'spend', label: 'Spend', type: 'number', required: true, alternateMatches: ['cost', 'amount', 'budget'] },
    { key: 'revenue_attributed', label: 'Revenue', type: 'number', required: false, alternateMatches: ['revenue', 'sales', 'attributed_revenue'] },
    { key: 'conversions', label: 'Conversions', type: 'number', required: false, alternateMatches: ['conv', 'purchases', 'orders'] },
    { key: 'clicks', label: 'Clicks', type: 'number', required: false },
    { key: 'impressions', label: 'Impressions', type: 'number', required: false },
    { key: 'period_start', label: 'Period Start', type: 'date', required: true, alternateMatches: ['start_date', 'from'] },
    { key: 'period_end', label: 'Period End', type: 'date', required: true, alternateMatches: ['end_date', 'to'] },
  ],
}

export function autoMapFields(csvHeaders: string[], entityType: string): FieldMapping[] {
  const targetFields = ENTITY_FIELDS[entityType] || []

  return csvHeaders.map(header => {
    const normalized = header.toLowerCase().replace(/[\s\-_]+/g, '_').trim()

    // Try exact match on key
    const exactMatch = targetFields.find(f => f.key === normalized)
    if (exactMatch) return { csvColumn: header, targetField: exactMatch.key }

    // Try alternate matches
    const altMatch = targetFields.find(f =>
      f.alternateMatches?.some(alt => alt === normalized)
    )
    if (altMatch) return { csvColumn: header, targetField: altMatch.key }

    // Try partial match
    const partialMatch = targetFields.find(f =>
      normalized.includes(f.key) || f.key.includes(normalized) ||
      f.alternateMatches?.some(alt => normalized.includes(alt) || alt.includes(normalized))
    )
    if (partialMatch) return { csvColumn: header, targetField: partialMatch.key }

    return { csvColumn: header, targetField: null }
  })
}
