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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight">OptiThru</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2.5 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-28 px-6 gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-medium mb-8 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5 fill-current" />
            100% of Shankara&apos;s profits fund humanitarian causes
          </div>
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Stop optimizing revenue.
            <br />
            <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
              Start maximizing throughput.
            </span>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The first profitability platform built on Theory of Constraints. See which
            products, channels, and decisions actually generate money — not just sales.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:shadow-amber-600/30 hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 glass-card text-foreground px-8 py-3.5 rounded-xl text-lg font-semibold hover:-translate-y-0.5 transition-all"
            >
              <Eye className="w-5 h-5" />
              See the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
            Traditional accounting hides the truth
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto text-lg">
            Most e-commerce brands optimize metrics that don&apos;t correlate with profit.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: 'Revenue illusion',
                desc: 'High-revenue products often consume the most constrained resources. You ship more but earn less.',
                color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
              },
              {
                icon: Package,
                title: 'Hidden capital traps',
                desc: 'Slow-moving inventory locks up cash. Traditional reports show it as an asset — TOC shows it as a trap.',
                color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
              },
              {
                icon: Megaphone,
                title: 'Misallocated spend',
                desc: 'Marketing budgets flow to the loudest channel, not the one that generates the most throughput per dollar.',
                color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="glass-card rounded-2xl p-7 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center mb-5`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution: Side-by-side comparison */}
      <section className="py-24 px-6 gradient-warm">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-14">
            See what others miss
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="glass-card rounded-2xl p-8">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                Traditional P&amp;L View
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2.5 border-b border-border/50">
                  <span>Revenue</span>
                  <span className="font-mono font-medium">$245,000</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border/50">
                  <span>COGS</span>
                  <span className="font-mono text-red-600 dark:text-red-400">-$147,000</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border/50">
                  <span>Gross Margin</span>
                  <span className="font-mono font-medium">$98,000 (40%)</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border/50">
                  <span>Operating Expenses</span>
                  <span className="font-mono text-red-600 dark:text-red-400">-$72,000</span>
                </div>
                <div className="flex justify-between py-2.5 font-semibold">
                  <span>Net Income</span>
                  <span className="font-mono">$26,000</span>
                </div>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Looks healthy. But which products should you push?
              </p>
            </div>
            {/* Throughput */}
            <div className="rounded-2xl p-8 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-2 border-amber-500/30 shadow-lg shadow-amber-600/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-5">
                  Throughput Accounting View
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2.5 border-b border-amber-200/50 dark:border-amber-800/30">
                    <span>Revenue</span>
                    <span className="font-mono font-medium">$245,000</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-amber-200/50 dark:border-amber-800/30">
                    <span>Truly Variable Costs</span>
                    <span className="font-mono text-red-600 dark:text-red-400">-$89,000</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-amber-200/50 dark:border-amber-800/30">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Throughput (T)</span>
                    <span className="font-mono font-semibold text-amber-800 dark:text-amber-300">$156,000</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-amber-200/50 dark:border-amber-800/30">
                    <span>Operating Expense (OE)</span>
                    <span className="font-mono text-red-600 dark:text-red-400">-$72,000</span>
                  </div>
                  <div className="flex justify-between py-2.5 font-semibold">
                    <span>Net Profit (T - OE)</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">$84,000</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-amber-700 dark:text-amber-400 font-medium">
                    <span>Productivity (T/OE)</span>
                    <span className="font-mono">2.17x</span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-amber-600 dark:text-amber-500">
                  Now rank every product by T/CU and focus on the constraint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need to run on throughput
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto text-lg">
            Purpose-built for e-commerce brands that want to maximize profit, not just revenue.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="group glass-card rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 gradient-warm">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <blockquote className="font-heading text-xl md:text-2xl font-medium leading-relaxed text-foreground">
                &ldquo;When we shifted from gross-margin rankings to T/CU rankings, we
                discovered our top-selling serum was actually our least profitable product
                per constraint unit.&rdquo;
              </blockquote>
              <div className="mt-6 text-muted-foreground">
                <span className="font-semibold text-foreground">Shankara Naturals</span>
                {' '}&mdash; Premium Ayurvedic Skincare
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
                <Heart className="w-5 h-5 fill-current" />
                <span className="text-sm font-medium">
                  Every throughput improvement increases humanitarian impact.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-muted-foreground mb-14 text-lg">
            Start free for 14 days. No credit card required.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                className={`rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-500/40 shadow-xl shadow-amber-600/10 relative'
                    : 'glass-card'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="font-heading text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-md shadow-amber-600/20'
                      : 'border border-border text-foreground hover:bg-accent'
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
      <footer className="border-t border-border bg-[oklch(0.15_0.015_55)] text-[oklch(0.6_0.02_65)] py-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">OptiThru</span>
            </div>
            <p className="text-sm leading-relaxed">
              Profitability intelligence for e-commerce, built on Theory of Constraints.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
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
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs">
          <span>&copy; {new Date().getFullYear()} Systematrix. All rights reserved.</span>
          <span className="mt-2 sm:mt-0">Built by Systematrix</span>
        </div>
      </footer>
    </div>
  )
}
