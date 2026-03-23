# Card #71: Verify v1.0 production stability and address Shankara Week 1 feedback

**Fizzy URL**: https://fizzy.sapta.com/1/cards/71  
**Time Estimate**: 3 hours

---

## Goal
Shankara has been live for one week. Collect feedback, fix issues, ensure production is stable before Week 5 features. This is the customer success gate.

## Step 1: Triage Sentry errors
Check https://sentry.io for errors triggered by Shankara's real usage. Fix all P0/P1 immediately.

## Step 2: Shankara feedback interview (30 min)
Schedule a call. Questions to cover:
- Which pages do they use daily vs. never?
- What data is confusing or missing?
- What would make this 10x more useful?
- Any errors or broken features encountered?
- Does the T/CU ranking match their intuition?

Log all feedback as comments on Fizzy card #71.

## Step 3: Fix top 3 feedback items
Priority: (a) blocks daily use, (b) data accuracy issues, (c) UX confusion.
Deploy fixes before proceeding to any other Week 5 cards.

## Step 4: Add Feedback button to dashboard
Sidebar footer "Send Feedback" link opens a modal with a textarea.
POST /api/v1/feedback stores: {org_id, user_id, message, page_url, created_at}.
Also emails hello@throughput.ai via Resend.

## Step 5: Production health check
```bash
curl https://api.throughput.ai/health
# Expect: {"status": "ok"}

# In Supabase: check shopify_connections.last_synced_at < 24h ago
# Stripe dashboard: zero webhook failures
# Confirm weekly digest sent last Monday
cd ~/throughput-os/backend && uv run pytest -v
```

## Step 6: Git commit
```bash
git add -A && git commit -m "fix: week 5 production stability and Shankara feedback"
```

## Done When
- All Sentry P0/P1 errors resolved
- Top 3 Shankara feedback items deployed
- Feedback button live in production
- All 5 production health checks green
