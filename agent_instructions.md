# AGENT_INSTRUCTIONS.md

## Objective
Build and launch **typsh.it** as a **clean, minimal, premium gadget Shopify store** focused on **problem-solving products** for the **US market** with **free shipping**, **Shopify Payments + PayPal**, and **strong SEO + AEO** from day one.

Do **not** build a random general store.  
Do **not** make theme-file editing a dependency for v1.  
Start by automating **catalog, collections, pages, structured content, SEO, and store configuration**.

---

## Store Identity
- **Store name:** typsh.it
- **Primary domain:** typsh.it
- **Support email:** support@typsh.it
- **Market:** United States only at launch
- **Currency:** USD
- **Business country:** United States
- **Return address:** 3220 Trickum Rd, Marietta, GA 30066

---

## Brand Direction
### Positioning
**Useful Finds That Actually Make Life Easier**

### Style Keywords
- clean
- minimal
- modern tech
- premium gadget
- TikTok-trendy but not spammy

### Homepage Feel
- problem-solving products
- home + tech secondary
- premium DTC look
- not cluttered
- not AliExpress-looking

### Recommended Tagline
**Useful Finds That Actually Make Life Easier**

---

## Locked Business Decisions
### Payments
- Shopify Payments: enabled
- PayPal: connect now

### Shipping
- Free US shipping
- Build shipping into retail price

### Returns
- 30-day damaged/defective support flow
- support handled via support@typsh.it

### Access
- Shopify collaborator access is being used
- Do not rely on manual theme access for v1 automation

---

## Product Strategy
### Launch Products
1. Handheld Clothes Steamer
2. Magnetic Screen Door
3. Silicone Drain Protector
4. Wireless Charging Station
5. Ring Light

### Phase 2 Product
6. Portable Blender

### Product Logic
The first five are preferred because they are:
- visually demo-friendly
- lower support risk than some battery-heavy gadgets
- strong for short-form ad creative
- aligned with a problem-solving store identity

Portable blender is a later test, not a day-one anchor.

---

## Collections to Create
- Best Sellers
- Problem Solvers
- Home Fixes
- Tech Essentials
- Creator Setup
- New Arrivals

---

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

---

## Homepage Structure
1. Hero
2. Trust strip
3. Featured products
4. Shop by category
5. Hero product section
6. Reviews/social proof
7. Why typsh.it
8. FAQ preview
9. Email capture
10. Footer

### Homepage Hero Copy
**Headline:** Useful Finds That Actually Make Life Easier  
**Subheadline:** Modern products for home, tech, and everyday convenience — curated to solve real problems fast.  
**CTA 1:** Shop Best Sellers  
**CTA 2:** See New Arrivals

### Trust Strip Items
- Free US Shipping
- Secure Checkout
- Responsive Support
- Curated Products Only

---

## Product Positioning
### Handheld Clothes Steamer
Wrinkle-free outfits in minutes without dragging out the iron.

### Magnetic Screen Door
Let fresh air in and keep bugs out without tools or permanent hassle.

### Silicone Drain Protector
Stop clogs before they start with a simple low-maintenance fix.

### Wireless Charging Station
Clean up your desk or nightstand with one compact charging hub.

### Ring Light
Better lighting for content, calls, and everyday desk setups.

---

## Bundle Ideas
- **Home Refresh Bundle:** steamer + drain protector
- **Desk Setup Bundle:** wireless charging station + ring light
- **Everyday Fixes Bundle:** magnetic screen door + drain protector

---

## Product Page Requirements
Every product page must include:
- SEO-friendly title
- benefit-first intro
- short answer-first copy
- benefit bullets
- features/specs
- shipping snippet
- returns/support snippet
- FAQ accordion
- reviews block
- cross-sell or bundle module
- alt text for all imagery

---

## SEO Requirements
This is non-negotiable.

Agent must implement:
- unique meta titles
- unique meta descriptions
- optimized product handles
- optimized collection copy
- internal linking
- homepage FAQ
- product FAQs
- image alt text
- strong semantic headings
- sitemap submission readiness
- Search Console readiness
- structured content wherever possible
- concise answer-first product copy for AEO and AI discoverability

---

## AEO Requirements
Optimize content so AI systems can answer:
- what the product is
- who it is for
- what problem it solves
- what’s included
- shipping expectations
- return expectations
- why it’s better than common alternatives

Use:
- FAQ blocks
- short direct answers
- clean feature bullets
- problem/solution phrasing
- trust details directly on page

---

## Visual System
### Logo
Replace immediately.

### Logo Direction
- wordmark: `typsh.it`
- clean sans-serif
- modern spacing
- optional emphasis on `.it`

### Color Palette
- Background: `#0F1115`
- Surface: `#161A22`
- Primary text: `#F7F8FA`
- Secondary text: `#A9B1BC`
- Accent: `#3B82F6`
- Border: `#252B36`

### Design Direction
- premium gadget brand
- whitespace
- sharp icons
- mobile-first
- fast and minimal
- strong product cards
- avoid clutter

---

## App Stack Requirements
Install and configure:
- reviews app
- order tracking app
- bundles or upsell app
- email popup app
- SMS capture app
- abandoned cart and checkout flows
- browse abandonment
- review request flow

---

## Supplier Strategy
### Preferred Suppliers
- Zendrop
- Spocket
- CJ Dropshipping

### Testing Only
- DSers / AliExpress for validation, not core long-term experience

---

## Technical Implementation Constraints
### Current Backend Inputs
The agent already has:
- the blueprint
- the `agent_server` scaffold

### Shopify API Strategy
Use the Shopify Admin GraphQL API first.
Prioritize automation for:
- product creation
- collection creation
- page creation
- metaobject creation or upsert
- publication or publishing

### Theme Editing Constraint
Do not make v1 depend on theme file writes.
Treat theme editing as phase 2.

### V1 Automation Goals
Automate:
- launch catalog creation
- collections
- pages
- SEO metadata
- FAQs and structured content
- merchandising content
- publishing flow
- basic store content generation

---

## Pages to Create
- About
- Contact
- FAQ
- Shipping Policy
- Return & Refund Policy
- Privacy Policy
- Terms of Service
- Track Order

---

## Recommended Implementation Order
### Phase 1: Backend and Content Ops
1. Validate environment and Shopify connection
2. Create collections
3. Create policy and support pages
4. Create launch products in draft
5. Add SEO fields and descriptions
6. Create FAQ/metaobject content
7. Publish collections, products, and pages
8. Verify Online Store publication status

### Phase 2: Storefront Population
1. Set navigation structure
2. Add homepage copy blocks
3. Add trust strips and merchandising sections
4. Add bundles and related products
5. Install app stack
6. Configure email and SMS capture

### Phase 3: Polish and Launch
1. Add logo and favicon
2. QA mobile and desktop
3. QA SEO fields
4. QA policy links and support links
5. QA checkout and payments
6. Soft launch

---

## Suggested Internal Commands
Implement tasks like:
- `bootstrap_store`
- `create_launch_collections`
- `create_launch_products`
- `create_policy_pages`
- `create_faq_metaobjects`
- `publish_launch_content`
- `configure_navigation_plan`
- `generate_homepage_copy`
- `generate_product_copy`
- `prepare_launch_checklist`

---

## Environment Variables
Minimum:
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
- `SHOPIFY_API_VERSION`
- `OPENAI_API_KEY`

Recommended defaults:
- `DEFAULT_VENDOR=typsh.it`
- `DEFAULT_MARKET=US`
- `DEFAULT_CURRENCY=USD`
- `SUPPORT_EMAIL=support@typsh.it`
- `RETURN_ADDRESS=3220 Trickum Rd, Marietta, GA 30066`

---

## Rules for the Agent
- Prefer clean, premium copy over hype
- Do not use scammy urgency language
- Do not create junk collections
- Do not overstuff keywords
- Do not publish sloppy AI text
- Keep product count tight at launch
- Default to US-only assumptions unless explicitly changed
- Default to free shipping messaging
- Default to typsh.it brand voice
- Do not use the collaborator PIN in logs, prompts, or stored config
- Treat theme editing as optional phase 2, not a blocker

---

## First Deliverables
1. Final collection objects
2. Final product content objects
3. Final page content objects
4. SEO metadata set
5. FAQ/metaobject set
6. Publish plan
7. Launch QA checklist

---

## Brand Voice Seed
“typsh.it curates useful finds that solve real everyday problems across home and tech. The brand should feel modern, clean, efficient, and trustworthy. Copy should be direct, benefit-led, and easy for both shoppers and AI systems to understand. Avoid hype, clutter, and generic dropshipping language.”
