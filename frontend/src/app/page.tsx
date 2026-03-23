import Link from 'next/link'
import {
  TrendingUp,
  FlaskConical,
  BarChart3,
  Megaphone,
  AlertTriangle,
  FileText,
  ArrowRight,
  Check,
  Heart,
  DollarSign,
  Package,
  Eye,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Nav */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Throughput OS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-stone-900 leading-tight">
            Stop optimizing revenue.
            <br />
            <span className="text-amber-700">Start maximizing throughput.</span>
          </h1>
          <p className="mt-6 text-xl text-stone-600 max-w-2xl mx-auto">
            The first profitability platform built on Theory of Constraints. See which
            products, channels, and decisions actually generate money — not just sales.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-700 transition shadow-lg shadow-amber-600/20"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border-2 border-stone-300 text-stone-700 px-8 py-3 rounded-lg text-lg font-semibold hover:border-stone-400 hover:bg-stone-100 transition"
            >
              <Eye className="w-5 h-5" />
              See the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Traditional accounting hides the truth
          </h2>
          <p className="text-center text-stone-500 mb-12 max-w-2xl mx-auto">
            Most e-commerce brands optimize metrics that don&apos;t correlate with profit.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: 'Revenue illusion',
                desc: 'High-revenue products often consume the most constrained resources. You ship more but earn less.',
              },
              {
                icon: Package,
                title: 'Hidden capital traps',
                desc: 'Slow-moving inventory locks up cash. Traditional reports show it as an asset — TOC shows it as a trap.',
              },
              {
                icon: Megaphone,
                title: 'Misallocated spend',
                desc: 'Marketing budgets flow to the loudest channel, not the one that generates the most throughput per dollar.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-stone-50 border border-stone-200 rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution: Side-by-side comparison */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            See what others miss
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="border border-stone-300 rounded-xl p-8 bg-white">
              <div className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">
                Traditional P&amp;L View
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span>Revenue</span>
                  <span className="font-mono">$245,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span>COGS</span>
                  <span className="font-mono text-red-600">-$147,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span>Gross Margin</span>
                  <span className="font-mono">$98,000 (40%)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span>Operating Expenses</span>
                  <span className="font-mono text-red-600">-$72,000</span>
                </div>
                <div className="flex justify-between py-2 font-semibold">
                  <span>Net Income</span>
                  <span className="font-mono">$26,000</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-stone-400">
                Looks healthy. But which products should you push?
              </p>
            </div>
            {/* Throughput */}
            <div className="border-2 border-amber-600 rounded-xl p-8 bg-amber-50/50">
              <div className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-4">
                Throughput Accounting View
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-amber-200/50">
                  <span>Revenue</span>
                  <span className="font-mono">$245,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200/50">
                  <span>Truly Variable Costs</span>
                  <span className="font-mono text-red-600">-$89,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200/50">
                  <span className="font-semibold text-amber-800">Throughput (T)</span>
                  <span className="font-mono font-semibold text-amber-800">$156,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200/50">
                  <span>Operating Expense (OE)</span>
                  <span className="font-mono text-red-600">-$72,000</span>
                </div>
                <div className="flex justify-between py-2 font-semibold">
                  <span>Net Profit (T - OE)</span>
                  <span className="font-mono text-green-700">$84,000</span>
                </div>
                <div className="flex justify-between py-2 text-amber-700 font-medium">
                  <span>Productivity (T/OE)</span>
                  <span className="font-mono">2.17x</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-amber-600">
                Now rank every product by T/CU and focus on the constraint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need to run on throughput
          </h2>
          <p className="text-center text-stone-500 mb-12 max-w-2xl mx-auto">
            Purpose-built for e-commerce brands that want to maximize profit, not just revenue.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'T/CU Rankings',
                desc: 'Rank every SKU by throughput per constraint unit. Know exactly which products to push.',
              },
              {
                icon: FlaskConical,
                title: 'What-If Simulator',
                desc: 'Model pricing changes, new products, or constraint shifts before committing real dollars.',
              },
              {
                icon: BarChart3,
                title: 'Buffer Management',
                desc: 'Dynamic safety stock based on demand, lead time, and variability. Red/yellow/green zones.',
              },
              {
                icon: Megaphone,
                title: 'Channel Analysis',
                desc: 'See which marketing channels generate the most throughput per dollar spent.',
              },
              {
                icon: AlertTriangle,
                title: 'Capital Traps',
                desc: 'Inventory Dollar Days (IDD) and Throughput Dollar Days (TDD) reveal hidden cash traps.',
              },
              {
                icon: FileText,
                title: 'PDF Reports',
                desc: 'One-click executive reports with TOC metrics, charts, and actionable recommendations.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-stone-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-sm">
            <blockquote className="text-xl md:text-2xl font-medium text-stone-800 leading-relaxed">
              &ldquo;When we shifted from gross-margin rankings to T/CU rankings, we
              discovered our top-selling serum was actually our least profitable product
              per constraint unit.&rdquo;
            </blockquote>
            <div className="mt-6 text-stone-500">
              <span className="font-semibold text-stone-700">Shankara Naturals</span>
              {' '}&mdash; Premium Ayurvedic Skincare
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-amber-700">
              <Heart className="w-5 h-5 fill-amber-600 text-amber-600" />
              <span className="text-sm font-medium">
                100% of Shankara&apos;s net profits fund humanitarian causes.
                Every throughput improvement increases humanitarian impact.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-stone-500 mb-12">
            Start free for 14 days. No credit card required.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$99',
                desc: 'For brands getting started with TOC',
                features: [
                  'Up to 100 SKUs',
                  'T/CU rankings',
                  'Buffer management',
                  'CSV import',
                  'Email support',
                ],
                cta: 'Start Free Trial',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$249',
                desc: 'For scaling brands that need deeper analysis',
                features: [
                  'Up to 500 SKUs',
                  'Everything in Starter',
                  'What-If simulator',
                  'Channel analysis',
                  'Capital trap detection',
                  'Shopify auto-sync',
                  'PDF reports',
                ],
                cta: 'Start Free Trial',
                highlight: true,
              },
              {
                name: 'Scale',
                price: '$599',
                desc: 'For enterprises maximizing throughput',
                features: [
                  'Unlimited SKUs',
                  'Everything in Growth',
                  'Multi-store support',
                  'Custom constraints',
                  'API access',
                  'Dedicated support',
                  'Team seats (up to 10)',
                ],
                cta: 'Start Free Trial',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 ${
                  plan.highlight
                    ? 'border-2 border-amber-600 bg-amber-50/50 shadow-lg shadow-amber-600/10 relative'
                    : 'border border-stone-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-stone-500 text-sm">/month</span>
                </div>
                <p className="mt-2 text-sm text-stone-500">{plan.desc}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-2.5 rounded-lg font-medium text-sm transition ${
                    plan.highlight
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-900 text-stone-400 py-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Throughput OS</span>
            </div>
            <p className="text-sm leading-relaxed">
              Profitability intelligence for e-commerce, built on Theory of Constraints.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/demo" className="hover:text-white transition">Demo</Link></li>
              <li><Link href="/signup" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">Documentation</span></li>
              <li><span className="cursor-default">API Reference</span></li>
              <li><span className="cursor-default">Blog</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">About</span></li>
              <li><span className="cursor-default">Privacy</span></li>
              <li><span className="cursor-default">Terms</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs">
          <span>&copy; {new Date().getFullYear()} Systematrix. All rights reserved.</span>
          <span className="mt-2 sm:mt-0">Built by Systematrix</span>
        </div>
      </footer>
    </div>
  )
}
