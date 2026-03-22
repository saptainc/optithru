import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://supabase.1in3in5.org'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzI1ODg0MTYsImV4cCI6MTkzMDI2ODQxNn0.HFtj81BFTFmn5LKgv0zQcG3PtNPySINLznRxFhA4zbc'
const ORG_ID = 'a0000000-0000-0000-0000-000000000001'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Weighted channel distribution: 60% DTC, 15% Amazon, 15% Spa, 10% other
const CHANNELS = [
  'dtc_website', 'dtc_website', 'dtc_website', 'dtc_website', 'dtc_website', 'dtc_website',
  'amazon', 'amazon', 'amazon',
  'wholesale_spa', 'wholesale_spa', 'wholesale_spa',
  'email', 'affiliate',
] as const

function randomDate(daysBack: number): string {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
  return past.toISOString()
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function generateOrders() {
  console.log('Fetching product variants...')

  // 1. Get all variants with their prices and COGS
  const { data: variants, error: varErr } = await supabase
    .from('product_variants')
    .select('id, name, sku, price, cogs, product_id, products(name)')
    .eq('organization_id', ORG_ID)
    .eq('is_active', true)

  if (varErr || !variants?.length) {
    console.error('Failed to fetch variants:', varErr?.message || 'No variants found')
    console.log('Make sure you have run card #29 (Shopify import) first.')
    return
  }
  console.log(`Found ${variants.length} active variants`)

  // 2. Create weighted variant pool (bestsellers appear more often)
  const weightedPool: typeof variants = []
  for (const v of variants) {
    const productName = ((v as any).products?.name || v.name).toLowerCase()
    let weight = 1

    // Bestsellers get higher weight
    if (productName.includes('kumkumadi')) weight = 8
    else if (productName.includes('moisturiz')) weight = 5
    else if (productName.includes('cleanser') || productName.includes('cleanse')) weight = 5
    else if (productName.includes('deodorant')) weight = 4
    else if (productName.includes('body wash') || productName.includes('wash')) weight = 3
    else if (productName.includes('serum')) weight = 3
    else if (productName.includes('oil')) weight = 2
    else if (productName.includes('bundle') || productName.includes('collection') || productName.includes('set')) weight = 1

    for (let i = 0; i < weight; i++) {
      weightedPool.push(v)
    }
  }
  console.log(`Weighted pool: ${weightedPool.length} entries from ${variants.length} variants`)

  // 3. Generate 210 orders
  const ORDER_COUNT = 210
  console.log(`\nGenerating ${ORDER_COUNT} orders...`)

  let successCount = 0
  let errorCount = 0

  for (let i = 1; i <= ORDER_COUNT; i++) {
    const orderDate = randomDate(180) // last 6 months
    const channel = pick(CHANNELS)
    const orderNumber = `SH-${String(i).padStart(5, '0')}`

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        organization_id: ORG_ID,
        order_number: orderNumber,
        customer_email: `customer${i}@example.com`,
        channel: channel,
        order_date: orderDate,
        financial_status: 'paid',
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error(`  Order ${orderNumber} failed:`, orderErr?.message)
      errorCount++
      continue
    }

    // 1-3 line items per order
    const itemCount = 1 + Math.floor(Math.random() * 3)
    let orderSubtotal = 0

    for (let j = 0; j < itemCount; j++) {
      const variant = pick(weightedPool)
      const qty = 1 + Math.floor(Math.random() * 2) // 1 or 2 units
      const lineTotal = variant.price * qty
      orderSubtotal += lineTotal

      const { error: lineErr } = await supabase
        .from('order_line_items')
        .insert({
          organization_id: ORG_ID,
          order_id: order.id,
          product_variant_id: variant.id,
          product_name: (variant as any).products?.name || variant.name,
          variant_name: variant.name,
          sku: variant.sku,
          quantity: qty,
          unit_price: variant.price,
          total_price: lineTotal,
        })

      if (lineErr) {
        console.error(`  Line item failed:`, lineErr.message)
      }
    }

    // Update order totals
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        subtotal: orderSubtotal,
        total: orderSubtotal,
      })
      .eq('id', order.id)

    if (updateErr) {
      console.error(`  Order total update failed:`, updateErr.message)
    }

    successCount++
    if (i % 50 === 0) console.log(`  ...${i}/${ORDER_COUNT} orders created`)
  }

  console.log(`\nOrders done: ${successCount} created, ${errorCount} failed`)
}

async function generateMarketingSpend() {
  console.log('\nGenerating marketing spend data...')

  // 3 months of data, 6 channels per month
  const channels = [
    { channel: 'email',       spend: 500,  impressions: 15000, clicks: 2000, conversions: 120, revenue: 8400  },
    { channel: 'seo',         spend: 1000, impressions: 20000, clicks: 3000, conversions: 80,  revenue: 5600  },
    { channel: 'meta_ads',    spend: 4000, impressions: 50000, clicks: 800,  conversions: 45,  revenue: 3150  },
    { channel: 'google_ads',  spend: 3500, impressions: 30000, clicks: 600,  conversions: 35,  revenue: 2450  },
    { channel: 'affiliate',   spend: 1500, impressions: 8000,  clicks: 200,  conversions: 25,  revenue: 1750  },
    { channel: 'dtc_website', spend: 500,  impressions: 10000, clicks: 1500, conversions: 60,  revenue: 4200  },
  ]

  let insertCount = 0

  for (let m = 0; m < 3; m++) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0)

    const periodStart = monthStart.toISOString().split('T')[0]
    const periodEnd = monthEnd.toISOString().split('T')[0]

    for (const ch of channels) {
      // Add slight randomness (±15%) to make each month different
      const variance = 0.85 + Math.random() * 0.30

      const { error } = await supabase
        .from('marketing_spend')
        .insert({
          organization_id: ORG_ID,
          channel: ch.channel,
          period_start: periodStart,
          period_end: periodEnd,
          spend: Math.round(ch.spend * variance * 100) / 100,
          impressions: Math.round(ch.impressions * variance),
          clicks: Math.round(ch.clicks * variance),
          conversions: Math.round(ch.conversions * variance),
          revenue_attributed: Math.round(ch.revenue * variance * 100) / 100,
        })

      if (error) {
        console.error(`  Marketing ${ch.channel} ${periodStart} failed:`, error.message)
      } else {
        insertCount++
      }
    }
  }

  console.log(`Marketing spend done: ${insertCount} rows inserted (expected 18)`)
}

async function verify() {
  console.log('\n--- Verification ---')

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)

  const { count: lineCount } = await supabase
    .from('order_line_items')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)

  const { count: mktgCount } = await supabase
    .from('marketing_spend')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)

  console.log(`Orders:      ${orderCount} (expected ~210)`)
  console.log(`Line items:  ${lineCount} (expected ~350-500)`)
  console.log(`Mktg spend:  ${mktgCount} (expected 18)`)

  // Show channel distribution
  const { data: channelDist } = await supabase
    .from('orders')
    .select('channel')
    .eq('organization_id', ORG_ID)

  if (channelDist) {
    const counts: Record<string, number> = {}
    channelDist.forEach(o => { counts[o.channel] = (counts[o.channel] || 0) + 1 })
    console.log('\nChannel distribution:')
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ch, ct]) => console.log(`  ${ch}: ${ct} orders (${Math.round(ct / channelDist.length * 100)}%)`))
  }

  // Show top 5 products by order frequency
  const { data: topProducts } = await supabase
    .from('order_line_items')
    .select('product_name, quantity')
    .eq('organization_id', ORG_ID)

  if (topProducts) {
    const prodCounts: Record<string, number> = {}
    topProducts.forEach(li => { prodCounts[li.product_name] = (prodCounts[li.product_name] || 0) + li.quantity })
    console.log('\nTop 5 products by units sold:')
    Object.entries(prodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([name, qty]) => console.log(`  ${name}: ${qty} units`))
  }

  // Show marketing T/CU preview
  const { data: mktg } = await supabase
    .from('marketing_spend')
    .select('channel, spend, revenue_attributed')
    .eq('organization_id', ORG_ID)

  if (mktg) {
    const channelTotals: Record<string, { spend: number; revenue: number }> = {}
    mktg.forEach(m => {
      if (!channelTotals[m.channel]) channelTotals[m.channel] = { spend: 0, revenue: 0 }
      channelTotals[m.channel].spend += m.spend
      channelTotals[m.channel].revenue += m.revenue_attributed
    })
    console.log('\nMarketing T/CU preview (revenue per dollar of spend):')
    Object.entries(channelTotals)
      .map(([ch, t]) => ({ channel: ch, tcu: t.spend > 0 ? (t.revenue / t.spend).toFixed(2) : '0', ...t }))
      .sort((a, b) => parseFloat(b.tcu) - parseFloat(a.tcu))
      .forEach(({ channel, tcu, spend, revenue }) =>
        console.log(`  ${channel}: $${revenue.toFixed(0)} / $${spend.toFixed(0)} = ${tcu}x T/CU`))
  }
}

async function main() {
  await generateOrders()
  await generateMarketingSpend()
  await verify()
}

main().catch(console.error)
