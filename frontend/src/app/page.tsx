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
      <nav className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[0.3em] bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-black tracking-tight">OptiThru</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[0.85rem] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[0.85rem] font-semibold bg-primary text-primary-foreground px-4 py-2 fizzy-pill hover:brightness-90 transition-[filter] duration-100"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 fizzy-pill border border-border text-[0.85rem] font-medium text-muted-foreground mb-8">
            <Heart className="w-3.5 h-3.5 text-[oklch(0.59_0.19_38)]" />
            100% of Shankara&apos;s profits fund humanitarian causes
          </div>
          <h1 className="text-[2.5rem] md:text-[3.2rem] font-black tracking-tight leading-[1.15]">
            Stop optimizing revenue.
            <br />
            <span className="text-primary">
              Start maximizing throughput.
            </span>
          </h1>
          <p className="mt-6 text-[1.1rem] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The first profitability platform built on Theory of Constraints. See which
            products, channels, and decisions actually generate money — not just sales.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 fizzy-pill text-[1rem] font-semibold hover:brightness-90 transition-[filter] duration-100"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3 fizzy-pill text-[1rem] font-semibold hover:bg-accent transition-colors duration-100"
            >
              <Eye className="w-4 h-4" />
              See the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[1.8rem] font-black text-center mb-3 tracking-tight">
            Traditional accounting hides the truth
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Most e-commerce brands optimize metrics that don&apos;t correlate with profit.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: DollarSign,
                title: 'Revenue illusion',
                desc: 'High-revenue products often consume the most constrained resources. You ship more but earn less.',
                iconColor: 'text-[oklch(0.59_0.19_38)]',
              },
              {
                icon: Package,
                title: 'Hidden capital traps',
                desc: 'Slow-moving inventory locks up cash. Traditional reports show it as an asset — TOC shows it as a trap.',
                iconColor: 'text-[oklch(0.66_0.12_90)]',
              },
              {
                icon: Megaphone,
                title: 'Misallocated spend',
                desc: 'Marketing budgets flow to the loudest channel, not the one that generates the most throughput per dollar.',
                iconColor: 'text-primary',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-card border border-border rounded-[0.5em] p-6 fizzy-shadow"
              >
                <card.icon className={`w-5 h-5 ${card.iconColor} mb-4`} />
                <h3 className="font-bold text-[1rem] mb-1.5">{card.title}</h3>
                <p className="text-muted-foreground text-[0.85rem] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section className="py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[1.8rem] font-black text-center mb-12 tracking-tight">
            See what others miss
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Traditional */}
            <div className="bg-card border border-border rounded-[0.5em] p-7 fizzy-shadow">
              <div className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-wider mb-5">
                Traditional P&amp;L View
              </div>
              <div className="space-y-0 text-[0.85rem]">
                {[
                  { label: 'Revenue', value: '$245,000', neg: false },
                  { label: 'COGS', value: '-$147,000', neg: true },
                  { label: 'Gross Margin', value: '$98,000 (40%)', neg: false },
                  { label: 'Operating Expenses', value: '-$72,000', neg: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5 border-b border-border">
                    <span>{row.label}</span>
                    <span className={`font-mono font-medium ${row.neg ? 'text-destructive' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 font-bold">
                  <span>Net Income</span>
                  <span className="font-mono">$26,000</span>
                </div>
              </div>
              <p className="mt-4 text-[0.75rem] text-muted-foreground">
                Looks healthy. But which products should you push?
              </p>
            </div>
            {/* Throughput */}
            <div className="bg-[oklch(0.92_0.026_254)] dark:bg-[oklch(0.28_0.02_254)] border-2 border-primary/30 rounded-[0.5em] p-7">
              <div className="text-[0.75rem] font-bold text-primary uppercase tracking-wider mb-5">
                Throughput Accounting View
              </div>
              <div className="space-y-0 text-[0.85rem]">
                {[
                  { label: 'Revenue', value: '$245,000', neg: false, highlight: false },
                  { label: 'Truly Variable Costs', value: '-$89,000', neg: true, highlight: false },
                  { label: 'Throughput (T)', value: '$156,000', neg: false, highlight: true },
                  { label: 'Operating Expense (OE)', value: '-$72,000', neg: true, highlight: false },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5 border-b border-primary/15">
                    <span className={row.highlight ? 'font-bold text-primary' : ''}>{row.label}</span>
                    <span className={`font-mono font-medium ${row.neg ? 'text-destructive' : ''} ${row.highlight ? 'font-bold text-primary' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 font-bold">
                  <span>Net Profit (T - OE)</span>
                  <span className="font-mono text-[oklch(0.55_0.162_147)]">$84,000</span>
                </div>
                <div className="flex justify-between py-2.5 text-primary font-semibold">
                  <span>Productivity (T/OE)</span>
                  <span className="font-mono">2.17x</span>
                </div>
              </div>
              <p className="mt-4 text-[0.75rem] text-primary/70">
                Now rank every product by T/CU and focus on the constraint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[1.8rem] font-black text-center mb-3 tracking-tight">
            Everything you need to run on throughput
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Purpose-built for e-commerce brands that want to maximize profit, not just revenue.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, title: 'T/CU Rankings', desc: 'Rank every SKU by throughput per constraint unit. Know exactly which products to push.' },
              { icon: FlaskConical, title: 'What-If Simulator', desc: 'Model pricing changes, new products, or constraint shifts before committing real dollars.' },
              { icon: BarChart3, title: 'Buffer Management', desc: 'Dynamic safety stock based on demand, lead time, and variability. Red/yellow/green zones.' },
              { icon: Megaphone, title: 'Channel Analysis', desc: 'See which marketing channels generate the most throughput per dollar spent.' },
              { icon: AlertTriangle, title: 'Capital Traps', desc: 'Inventory Dollar Days (IDD) and Throughput Dollar Days (TDD) reveal hidden cash traps.' },
              { icon: FileText, title: 'PDF Reports', desc: 'One-click executive reports with TOC metrics, charts, and actionable recommendations.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-[0.5em] p-5 fizzy-shadow hover:brightness-[0.98] transition-[filter] duration-100"
              >
                <feature.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-bold text-[1rem] mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-[0.85rem] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="fizzy-panel p-10">
            <blockquote className="text-[1.1rem] md:text-[1.3rem] font-medium leading-relaxed text-foreground">
              &ldquo;When we shifted from gross-margin rankings to T/CU rankings, we
              discovered our top-selling serum was actually our least profitable product
              per constraint unit.&rdquo;
            </blockquote>
            <div className="mt-5 text-muted-foreground text-[0.85rem]">
              <span className="font-bold text-foreground">Shankara Naturals</span>
              {' '}&mdash; Premium Ayurvedic Skincare
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[oklch(0.59_0.19_38)]">
              <Heart className="w-4 h-4 fill-current" />
              <span className="text-[0.85rem] font-medium">
                Every throughput improvement increases humanitarian impact.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[1.8rem] font-black text-center mb-3 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Start free for 14 days. No credit card required.
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                name: 'Starter', price: '$99',
                desc: 'For brands getting started with TOC',
                features: ['Up to 100 SKUs', 'T/CU rankings', 'Buffer management', 'CSV import', 'Email support'],
                highlight: false,
              },
              {
                name: 'Growth', price: '$249',
                desc: 'For scaling brands that need deeper analysis',
                features: ['Up to 500 SKUs', 'Everything in Starter', 'What-If simulator', 'Channel analysis', 'Capital trap detection', 'Shopify auto-sync', 'PDF reports'],
                highlight: true,
              },
              {
                name: 'Scale', price: '$599',
                desc: 'For enterprises maximizing throughput',
                features: ['Unlimited SKUs', 'Everything in Growth', 'Multi-store support', 'Custom constraints', 'API access', 'Dedicated support', 'Team seats (up to 10)'],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[0.5em] p-7 relative ${
                  plan.highlight
                    ? 'bg-[oklch(0.92_0.026_254)] dark:bg-[oklch(0.28_0.02_254)] border-2 border-primary/40'
                    : 'bg-card border border-border fizzy-shadow'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[0.75rem] font-semibold px-3 py-1 fizzy-pill">
                    Most Popular
                  </div>
                )}
                <h3 className="text-[1rem] font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-[2.5rem] font-black tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-[0.85rem]">/mo</span>
                </div>
                <p className="mt-1 text-[0.85rem] text-muted-foreground">{plan.desc}</p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.85rem]">
                      <Check className="w-4 h-4 text-[oklch(0.55_0.162_147)] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-7 block text-center py-2.5 fizzy-pill font-semibold text-[0.85rem] transition-[filter] duration-100 ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:brightness-90'
                      : 'border border-border text-foreground hover:bg-accent'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background/60 py-14 px-6">
        <div className="max-w-[1100px] mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 rounded-[0.2em] bg-background/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-background" />
              </div>
              <span className="font-black text-background">OptiThru</span>
            </div>
            <p className="text-[0.85rem] leading-relaxed">
              Profitability intelligence for e-commerce, built on Theory of Constraints.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-background text-[0.85rem] mb-3">Product</h4>
            <ul className="space-y-2 text-[0.85rem]">
              <li><Link href="/demo" className="hover:text-background transition-colors">Demo</Link></li>
              <li><Link href="/signup" className="hover:text-background transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-background transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-background text-[0.85rem] mb-3">Resources</h4>
            <ul className="space-y-2 text-[0.85rem]">
              <li><span className="cursor-default">Documentation</span></li>
              <li><span className="cursor-default">API Reference</span></li>
              <li><span className="cursor-default">Blog</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-background text-[0.85rem] mb-3">Company</h4>
            <ul className="space-y-2 text-[0.85rem]">
              <li><span className="cursor-default">About</span></li>
              <li><span className="cursor-default">Privacy</span></li>
              <li><span className="cursor-default">Terms</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between text-[0.75rem]">
          <span>&copy; {new Date().getFullYear()} Systematrix. All rights reserved.</span>
          <span className="mt-2 sm:mt-0">Built by Systematrix</span>
        </div>
      </footer>
    </div>
  )
}
