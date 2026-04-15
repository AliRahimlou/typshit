# typsh.it Agent Launch Handoff

## Purpose

This repo is now the backend control plane for the typsh.it launch. Use it to:

- audit launch readiness
- read launch strategy and sourcing requirements
- create or rerun catalog/pages/collections
- retire bad legacy products
- execute tool-driven Shopify operations from the agent route

## Live Backend Endpoints

### Health

```bash
curl http://localhost:8080/health
```

### Launch strategy

```bash
curl http://localhost:8080/workflows/launch-strategy
```

### Supplier sourcing plan

```bash
curl http://localhost:8080/workflows/sourcing-plan
```

### Launch readiness audit

```bash
curl http://localhost:8080/workflows/launch-readiness
```

### Publish or rerun launch catalog

```bash
curl -X POST http://localhost:8080/workflows/create-launch-catalog \
  -H "Content-Type: application/json" \
  -d '{"catalogKey":"typsh-it-launch","publish":true}'
```

### Retire legacy products

```bash
curl -X POST http://localhost:8080/workflows/retire-products \
  -H "Content-Type: application/json" \
  -d '{"handles":["unisex-t-shirt","unisex-t-shirt-1"]}'
```

### Agent execution route

```bash
curl -X POST http://localhost:8080/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"goal":"Retire any leftover legacy apparel products and confirm launch readiness."}'
```

## What Is Already Done

- Launch products are in Shopify and active.
- Launch collections are published.
- Launch pages are published.
- Legacy T-shirt products are retired.
- Launch strategy is encoded in backend data.
- Sourcing requirements are encoded in backend data.

## What Still Requires Merchant Access Outside This Repo

These cannot be fully completed from this backend alone without logging into third-party platforms or Shopify admin interfaces:

- create Zendrop, Spocket, and/or CJdropshipping merchant accounts
- install supplier apps into Shopify
- browse and approve exact supplier listings
- configure fulfillment origins and shipping mapping
- install reviews, tracking, bundles, email popup, SMS, and retention apps
- replace logo in the active theme
- update homepage sections and navigation in the active theme
- connect PayPal if not already finalized in admin

## Supplier Selection Rules

Pull product requirements from:

- `GET /workflows/sourcing-plan`

For each launch product, the agent should enforce:

- US-friendly shipping target
- acceptable landed cost ceiling
- margin floor
- reject criteria for low-quality listings
- content assets strong enough for ads and PDPs

## Recommended Operator Sequence

1. Open `GET /workflows/launch-readiness`.
2. Connect one supplier platform first: Zendrop preferred, Spocket second, CJdropshipping third.
3. Source exact listings for the five existing launch products using the search terms and acceptance rules in `GET /workflows/sourcing-plan`.
4. Install the supplier app in Shopify and import vetted listings.
5. Verify pricing, shipping origin, fulfillment, and product media.
6. Install reviews, order tracking, bundles, email popup, SMS capture, and abandonment flows.
7. Replace logo and rebuild homepage/navigation in the active theme.
8. Re-run `GET /workflows/launch-readiness` and then validate storefront pages manually.

## Recommended Agent Goals

Use goals like:

- "Audit the store for launch blockers and summarize what is still manual."
- "Retire any legacy products that do not match the typsh.it launch strategy."
- "Create or rerun policy pages and collections for the typsh.it launch catalog."
- "Summarize the sourcing requirements for the five launch products."

## Non-Negotiables

- Keep typsh.it as the primary domain.
- US-only at launch.
- Free US shipping built into price.
- Strong SEO and AEO.
- People-first copy, not spammy copy.
- No dependence on theme-file automation for v1 launch operations.