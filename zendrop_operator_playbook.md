# Zendrop Operator Playbook

## Goal

Source the five live typsh.it launch products through Zendrop with US-friendly shipping, strong gross margin, clean media, and low support risk.

## Current Store State

- Launch products are already live in Shopify.
- Collections are published.
- Policy and support pages are published.
- Legacy T-shirt products are retired.

Zendrop should now be used to replace placeholder/manual product sourcing assumptions with real supplier-backed fulfillment.

## Product Targets

### 1. Handheld Clothes Steamer

- Search terms:
  - portable garment steamer
  - handheld clothes steamer
  - travel clothes steamer
- Sell price target: `$49`
- Max landed cost target: `$16`
- Margin floor: `67%`
- Preferred ship-from: US warehouse
- Reject if:
  - leak complaints
  - no US delivery estimate
  - cheap-looking media

### 2. Magnetic Screen Door

- Search terms:
  - magnetic screen door
  - hands free mesh screen door
  - magnetic door mesh
- Sell price target: `$34`
- Max landed cost target: `$10`
- Margin floor: `70%`
- Preferred ship-from: US warehouse
- Reject if:
  - weak magnet reviews
  - no size chart
  - low durability feedback

### 3. Silicone Drain Protector

- Search terms:
  - silicone drain protector
  - hair catcher drain cover
  - sink shower drain protector
- Sell price target: `$14`
- Max landed cost target: `$3`
- Margin floor: `78%`
- Preferred ship-from: US or proven fast line
- Reject if:
  - no dimensions
  - poor visual presentation
  - unclear material specs

### 4. Wireless Charging Station

- Search terms:
  - 3 in 1 wireless charging station
  - wireless charging dock
  - desk charging station
- Sell price target: `$44`
- Max landed cost target: `$14`
- Margin floor: `68%`
- Preferred ship-from: US warehouse
- Reject if:
  - vague compatibility details
  - overheating complaints
  - no wattage or cable info

### 5. Ring Light

- Search terms:
  - desktop ring light
  - selfie ring light with tripod
  - content creator ring light
- Sell price target: `$29`
- Max landed cost target: `$8`
- Margin floor: `72%`
- Preferred ship-from: US warehouse
- Reject if:
  - flimsy stand feedback
  - weak image quality
  - unclear power source

## Zendrop Decision Rules

Choose listings that satisfy all of the following:

- delivery promise that fits a US-only store
- media strong enough for ads and product pages
- specs clear enough to reduce refunds and support tickets
- landed cost that preserves target margin
- no obvious commodity-trash presentation

Avoid listings that:

- look mass-imported and generic
- have weak or missing dimensions/specs
- create compatibility ambiguity
- create battery/safety/support risk beyond the product category norm

## Import Rules

When importing into Shopify:

- keep the existing live product handles where possible
- keep the public product titles unless the imported title is better and still on-brand
- preserve the current retail prices unless a real cost change forces a revision
- keep free US shipping economics intact
- maintain current collection membership:
  - Best Sellers
  - Problem Solvers
  - Home Fixes
  - Tech Essentials
  - Creator Setup
  - New Arrivals

## Post-Import Checks

For each imported product, verify:

- product stayed `ACTIVE`
- shipping profile is correct
- variant pricing and compare-at pricing are still correct
- product page still has the correct title, handle, and media quality
- no old placeholder or duplicate listing was created

## Bundle Priorities

- Home Refresh Bundle:
  - handheld clothes steamer
  - silicone drain protector
- Desk Setup Bundle:
  - wireless charging station
  - ring light
- Everyday Fixes Bundle:
  - magnetic screen door
  - silicone drain protector

## After Zendrop Import

1. Run `GET /workflows/launch-readiness`
2. Manually check each product page on the live storefront
3. Install reviews, tracking, bundles, email popup, SMS capture, and abandonment flows
4. Replace the logo in the active theme
5. Rebuild homepage/navigation to match the launch strategy

## Backend References

- [launch_strategy_2026.md](launch_strategy_2026.md)
- [agent_launch_handoff.md](agent_launch_handoff.md)
- [data/sourcingPlan.ts](data/sourcingPlan.ts)
- `GET /workflows/sourcing-plan`
- `GET /workflows/launch-readiness`