# typsh.it Homepage And Theme Handoff

## Goal

Implement a homepage and navigation system that makes typsh.it feel like a clean, premium problem-solving product brand rather than a generic gadget store.

This handoff is aligned to the live launch catalog and the structured data returned by `GET /workflows/theme-handoff`.

## Brand Direction

- Store name: `typsh.it`
- Tagline: `Useful Finds That Actually Make Life Easier`
- Visual direction: premium gadget, minimal whitespace, sharp contrast, clear hierarchy
- Launch market: United States only
- Core promise: useful products, clean merchandising, fast answers, low-friction trust

## Logo Spec

### Wordmark

- Use the wordmark `typsh.it`
- Base direction: clean geometric sans
- Tracking: slightly widened, not luxury-fashion exaggerated
- Weight: medium to semi-bold
- Use the `.it` as the subtle point of emphasis through tighter tracking, accent color, or slightly higher contrast

### Favicon

- Use a simple `t.` or `ty` monogram
- Near-black background
- Accent-color foreground
- Avoid complex gradients or thin strokes

## Color System

- Background: `#0F1115`
- Surface: `#161A22`
- Primary text: `#F7F8FA`
- Secondary text: `#A9B1BC`
- Accent: `#3B82F6`
- Border: `#252B36`

## Navigation

### Header

- Home
- Shop
- Best Sellers
- Track Order
- FAQ
- Contact

### Footer

- About
- Contact
- FAQ
- Shipping Policy
- Return & Refund Policy
- Privacy Policy
- Terms of Service
- Track Order

## Homepage Section Order

1. Hero
2. Trust strip
3. Featured products
4. Shop by category
5. Hero product section
6. Social proof
7. Why typsh.it
8. FAQ preview
9. Email capture
10. Footer

## Hero

### Headline

Useful Finds That Actually Make Life Easier

### Subheadline

Modern products for home, tech, and everyday convenience curated to solve real problems fast, without the junk-drawer feel of a random general store.

### CTAs

- Primary: Shop Best Sellers
- Secondary: See New Arrivals

### Supporting points

- Free US shipping built into every order
- Problem-solving products with clean merchandising
- Fast answers and responsive support

### Implementation notes

- Keep the hero copy compact
- Use one strong product or lifestyle visual, not a slider
- Put both CTAs above the fold on desktop and mobile

## Trust Strip

Use four simple trust items with small icons and short descriptive lines.

- Free US Shipping: Pricing already includes shipping for launch orders.
- Secure Checkout: Shopify checkout with trusted payment rails.
- Responsive Support: Clear help from support@typsh.it when something goes wrong.
- Curated Products Only: Every item is selected for usefulness, not endless catalog sprawl.

## Featured Products

Show four cards max above the fold on desktop.

### Featured set

- Handheld Clothes Steamer
- Magnetic Screen Door
- Wireless Charging Station
- Ring Light

### Card rules

- Use real synced Zendrop imagery
- Show one benefit-first line, not a long paragraph
- Allow a small badge like `Problem Solver` or `Save $20`
- CTA label: `Shop Now`

## Shop By Category

Use four category cards:

- Home Fixes
- Tech Essentials
- Creator Setup
- Problem Solvers

Each card should feel like a merchandising lane, not a filter menu.

## Hero Product Section

### Product

Handheld Clothes Steamer

### Angle

Feature this as the main merchandising anchor because the use case is obvious, the demo value is high, and the payoff is understood in seconds.

### Content direction

- Headline: Our hero product: the fast way to look put together
- Use three bullet highlights from the current product seed
- Primary CTA: Shop the Steamer
- Secondary CTA: View Home Refresh Bundle

## Social Proof

Use text-led proof blocks first, then connect live reviews later.

Suggested voice:

- The store feels curated. I found what I needed fast and the product explained the benefit immediately.
- The desk setup products feel cleaner and more premium than the usual impulse-buy gadget stores.
- Shipping and support details were easy to find, which made the purchase feel lower risk.

## Why typsh.it

Three-point content block:

- We do not sell endless random gadgets just to pad the catalog.
- Every product is selected because the problem and payoff are easy to understand.
- The store favors clean answers, usable product pages, and lower-friction support.

## FAQ Preview

Use three pre-purchase answers on the homepage:

- What kind of products does typsh.it carry?
- Where do you ship?
- How do returns and support work?

Keep the answers short and answer-first.

## Email Capture

### Offer

Get 10% off your first order

### Direction

- Use a compact popup and footer capture module
- Ask for email first
- Delay SMS capture to a later step instead of stacking fields in the first popup
- Frame the offer around useful finds and launch drops, not hype language

## Bundle Merchandising

Use these three bundles as the first bundle layer:

- Home Refresh Bundle
- Desk Setup Bundle
- Everyday Fixes Bundle

These should appear in homepage merchandising and on relevant product pages.

## Theme Data Inputs

For structured implementation data, use:

- `GET /workflows/theme-handoff`
- `GET /workflows/app-stack-plan`

For future dynamic theme sections, the launch catalog now also contains optional metaobject seeds for:

- homepage configuration
- bundle cards
- trust items

## Recommended Metaobject Definitions

If the next theme build wants merchant-editable homepage sections without hardcoding all content, create these Shopify metaobject definitions first:

### `$app:typsh_theme_homepage`

Suggested fields:

- `hero_headline`
- `hero_subheadline`
- `primary_cta_label`
- `primary_cta_href`
- `secondary_cta_label`
- `secondary_cta_href`
- `featured_product_handles`
- `bundle_handles`

### `$app:typsh_theme_bundle`

Suggested fields:

- `title`
- `summary`
- `product_handles`
- `cta_label`

### `$app:typsh_theme_value_prop`

Suggested fields:

- `label`
- `description`

The repo already seeds optional metaobjects for those types during `POST /workflows/sync-launch-storefront`, but Shopify will skip them until the definitions exist in the store.

## Non-Negotiables

- Do not use a slideshow hero
- Do not show more than four featured products above the fold
- Do not make the homepage feel like a random marketplace
- Do not bury trust details below the fold
- Do not overcomplicate the navigation at launch