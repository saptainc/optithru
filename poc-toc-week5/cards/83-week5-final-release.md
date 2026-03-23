# Card #83: Week 5 end-to-end verification, second customer onboarding, and v1.1.0 release

**Fizzy URL**: https://fizzy.sapta.com/1/cards/83  
**Time Estimate**: 4 hours

---

## Goal
Final gate: verify all 12 Week 5 features work together in production, onboard a second paying customer, tag v1.1.0.

## Final Build Verification
```bash
cd ~/throughput-os/frontend && npx next build    # zero errors
cd ~/throughput-os/backend && uv run pytest -v   # all pass, coverage >= 85%
# Zero P0/P1 Sentry errors in last 48h
```

## Production Feature Checklist
- [ ] Card 71 - Shankara feedback: top 3 items deployed
- [ ] Card 72 - AI Insights: Claude recommendations on Shankara dashboard
- [ ] Card 73 - Self-serve onboarding: >= 1 org completed without manual help
- [ ] Card 74 - PostHog: events captured in production; admin dashboard live; MRR visible
- [ ] Card 75 - Amazon/Meesho: >= 1 connector tested with real or staging data
- [ ] Card 76 - White-label: branding settings available to Scale plan orgs
- [ ] Card 77 - Changelog: /changelog live with 5 v1.1.x entries; sidebar badge working
- [ ] Card 78 - Anomaly detection: >= 1 anomaly detected and notified
- [ ] Card 79 - Production constraints: /dashboard/production accessible; T/CU calc correct
- [ ] Card 80 - Performance: Locust p95 < 500ms at 50 users; Redis caching active
- [ ] Card 81 - Learning Center: all 5 modules at /dashboard/learn; glossary tooltips live
- [ ] Card 82 - Referral: Shankara has referral code; launch email sent

## Second Customer Milestone
- [ ] 1 additional paying org onboarded (Growth or Scale plan)
- [ ] Used self-serve flow (not manual)
- [ ] Completed onboarding checklist
- [ ] Active subscription confirmed in Stripe

## Business Metrics Snapshot
| Metric | Target |
|--------|--------|
| MRR | $498 (2x Growth) |
| Active orgs | >= 2 |
| Weekly active users | >= 3 |
| AI insights generated | >= 10 |
| Anomalies detected | >= 1 |
| Self-serve onboardings | >= 1 |

## Git Release
```bash
cd ~/throughput-os
git add -A
git commit -m "feat: complete Week 5 - AI insights, multi-marketplace, self-serve onboarding, growth engine"
git tag v1.1.0
git push origin main --tags
```

## Week 6 Preview
Document and create a new Fizzy board for:
- Internationalization: Hindi UI, INR currency, IST timezone
- Annual pricing: 20% discount, Stripe annual interval
- Partner program: consulting firms resell, rev share
- WhatsApp Business API for critical anomaly alerts
- Shopify App Store listing for organic discovery

## Done When
- All 12 checklist items verified
- 2nd paying customer active
- v1.1.0 tagged and pushed
- MRR >= $498
- Week 6 board created with initial card titles
