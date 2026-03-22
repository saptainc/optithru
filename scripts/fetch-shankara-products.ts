import { createClient } from '@supabase/supabase-js'

const SHOPIFY_URL = 'https://shankara.com/products.json?limit=250'
const SUPABASE_URL = 'https://supabase.1in3in5.org'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzI1ODg0MTYsImV4cCI6MTkzMDI2ODQxNn0.HFtj81BFTFmn5LKgv0zQcG3PtNPySINLznRxFhA4zbc'
const ORG_ID = 'a0000000-0000-0000-0000-000000000001'

// Estimated COGS as percentage of price
function estimateCogs(price: number, tags: string[]): number {
  const tagStr = tags.join(' ').toLowerCase()
  // Premium ingredients (saffron, ghee) = 35% COGS
  if (tagStr.includes('saffron') || tagStr.includes('ghee') || tagStr.includes('kumkumadi')) {
    return Math.round(price * 0.35 * 100) / 100
  }
  // Standard products = 30% COGS
  return Math.round(price * 0.30 * 100) / 100
}

function estimateShipping(price: number): number {
  if (price >= 100) return 8.00
  if (price >= 50) return 6.00
  if (price >= 30) return 5.00
  return 4.00
}

function categorize(productType: string): string {
  const t = (productType || '').toLowerCase()
  if (t.includes('face') || t.includes('serum') || t.includes('cleanser') || t.includes('moistur')) return 'Face Care'
  if (t.includes('body') || t.includes('deodorant') || t.includes('muscle')) return 'Body Care'
  if (t.includes('set') || t.includes('bundle') || t.includes('collection') || t.includes('kit')) return 'Sets'
  return productType || 'Other'
}

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  product_type: string
  tags: string[]
  images: { src: string }[]
  variants: {
    id: number
    title: string
    sku: string
    price: string
    compare_at_price: string | null
    grams: number
    available: boolean
  }[]
}

async function main() {
  console.log('Fetching products from shankara.com...')

  // 1. Fetch Shopify products
  const res = await fetch(SHOPIFY_URL)
  if (!res.ok) throw new Error(`Shopify fetch failed: ${res.status}`)
  const { products } = await res.json() as { products: ShopifyProduct[] }
  console.log(`Found ${products.length} products`)

  // 2. Connect to Supabase (service role bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  let productCount = 0
  let variantCount = 0

  for (const product of products) {
    const imageUrl = product.images?.[0]?.src || null
    const category = categorize(product.product_type)
    const tags = Array.isArray(product.tags) ? product.tags : (product.tags as string || '').split(',').map((t: string) => t.trim())

    // 3. Upsert product
    const { data: dbProduct, error: prodError } = await supabase
      .from('products')
      .upsert({
        organization_id: ORG_ID,
        external_id: String(product.id),
        name: product.title,
        handle: product.handle,
        category: category,
        status: 'active',
        image_url: imageUrl,
      }, { onConflict: 'organization_id,external_id' })
      .select('id')
      .single()

    if (prodError) {
      console.error(`Error inserting product "${product.title}":`, prodError.message)
      continue
    }
    productCount++

    // 4. Upsert variants
    for (const variant of product.variants) {
      const price = parseFloat(variant.price)
      const cogs = estimateCogs(price, tags)
      const shipping = estimateShipping(price)

      const { error: varError } = await supabase
        .from('product_variants')
        .upsert({
          organization_id: ORG_ID,
          product_id: dbProduct.id,
          external_id: String(variant.id),
          sku: variant.sku || `SHOP-${variant.id}`,
          name: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
          price: price,
          compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          cogs: cogs,
          shipping_cost: shipping,
          weight_grams: variant.grams || null,
          inventory_quantity: variant.available ? Math.floor(Math.random() * 80) + 20 : 0,
          is_active: variant.available,
        }, { onConflict: 'organization_id,external_id' })

      if (varError) {
        console.error(`  Error inserting variant "${variant.title}":`, varError.message)
      } else {
        variantCount++
      }
    }
  }

  console.log(`\nDone! Imported ${productCount} products and ${variantCount} variants.`)

  // 5. Verify
  const { count: prodTotal } = await supabase.from('products').select('*', { count: 'exact', head: true })
  const { count: varTotal } = await supabase.from('product_variants').select('*', { count: 'exact', head: true })
  console.log(`Database now has ${prodTotal} products and ${varTotal} variants.`)
}

main().catch(console.error)
