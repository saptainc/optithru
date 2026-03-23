# POC-TOC Week 5 — Card Index

**Board**: https://fizzy.sapta.com/1/boards/03ft302j4gfqjg363xt4p22ct  
**Theme**: Growth Engine — AI, multi-marketplace, self-serve onboarding, scale  
**Version target**: v1.1.0  

## Execution Order

| Card | Title | Est. | File |
|------|-------|------|------|
| #71 | Verify v1.0 production stability and Shankara Week 1 feedback | 3h | cards/71-production-stability-feedback.md |
| #72 | Build Claude-powered AI Insights engine | 6h | cards/72-ai-insights-engine.md |
| #73 | Build self-serve onboarding with Shopify OAuth and email drip | 7h | cards/73-self-serve-onboarding-shopify-oauth.md |
| #74 | Add PostHog analytics, admin dashboard, and feature flags | 5h | cards/74-posthog-analytics-admin.md |
| #75 | Build Amazon India and Meesho connectors | 6h | cards/75-amazon-meesho-connectors.md |
| #76 | Build white-label branding with custom domain (Scale plan) | 5h | cards/76-white-label-custom-domain.md |
| #77 | Build in-app changelog and "What's New" notification | 3h | cards/77-changelog-whats-new.md |
| #78 | Build proactive anomaly detection and alerts | 5h | cards/78-anomaly-detection.md |
| #79 | Extend TOC model for manufacturing constraints | 5h | cards/79-manufacturing-constraints.md |
| #80 | Performance hardening: Redis, indexes, load testing | 5h | cards/80-performance-hardening.md |
| #81 | Build in-app TOC Learning Center and contextual glossary | 4h | cards/81-toc-learning-center.md |
| #82 | Build referral program with automated reward credits | 4h | cards/82-referral-program.md |
| #83 | Week 5 verification, 2nd customer onboarding, v1.1.0 release | 4h | cards/83-week5-final-release.md |

**Total: ~62 hours**

## New Supabase Migrations (Week 5)
| Migration | File | Card |
|-----------|------|------|
| 18 | 18-ai-insights.sql | #72 |
| 19 | 19-onboarding.sql | #73 |
| 20 | 20-whitelabel.sql | #76 |
| 21 | 21-changelog.sql | #77 |
| 22 | 22-anomalies.sql | #78 |
| 23 | 23-production.sql | #79 |
| 24 | 24-learning.sql | #81 |
| 25 | 25-referrals.sql | #82 |

## New Services (backend/app/services/)
- ai_insights.py — Claude API wrapper (Card #72)
- anomaly_detector.py — 5-rule anomaly engine (Card #78)
- amazon_sync.py — Amazon SP-API connector (Card #75)
- meesho_sync.py — Meesho CSV importer (Card #75)

## New Routes (backend/app/routers/)
- ai_insights.py — /insights/weekly, /insights/product/{id}, /insights/ask (Card #72)
- shopify_oauth.py — /shopify/install, /shopify/callback (Card #73)

## New Pages (frontend/src/app/)
- /onboarding — self-serve 4-step checklist (Card #73)
- /changelog — public release notes (Card #77)
- /dashboard/learn — TOC Learning Center (Card #81)
- /dashboard/production — production resource tracking (Card #79)
- /admin — internal dashboard (Card #74)

## Business Success Criteria
- MRR >= $498 (2 active Growth plan subscriptions)
- >= 1 new customer via self-serve (no manual help)
- >= 10 AI insights generated
- >= 1 anomaly detected and alerted
- v1.1.0 tagged on git
