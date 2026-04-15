# typsh.it App Stack Implementation Plan

## Goal

Install a lean launch stack that improves trust, conversion, and retention without turning the storefront into an over-appified mess.

This plan is aligned to the structured output from `GET /workflows/app-stack-plan`.

## Recommended Launch Stack

### Reviews

- Primary: Judge.me
- Fallback: Loox

Why:

- Adds product-page trust quickly
- Supports review request automation
- Can grow into photo and video proof without a full rebuild

Launch setup:

- Enable star ratings on product cards and product pages
- Turn on review request emails after fulfillment
- Keep homepage reviews text-led until actual review volume exists

### Order Tracking

- Primary: Parcel Panel
- Fallback: AfterShip Tracking

Why:

- Reduces support load
- Gives the Track Order page a clean operational purpose
- Makes shipping expectations easier to manage publicly

Launch setup:

- Connect the live Track Order page to the branded tracking experience
- Keep support escalation visible from the tracking experience
- Match colors to the dark typsh.it palette where possible

### Bundles / Upsell

- Primary: Shopify Bundles
- Fallback: Bundler Product Bundles

Why:

- Lets the store merchandise the three launch bundles without introducing noisy upsell UX
- Keeps the bundle layer simple and operationally safe at launch

First bundles to create:

- Home Refresh Bundle
- Desk Setup Bundle
- Everyday Fixes Bundle

### Email Popup And Lifecycle Email

- Primary: Klaviyo
- Fallback: Shopify Forms + Shopify Email

Why:

- One system can own popup capture, welcome flow, abandoned cart, browse abandonment, and post-purchase email
- Easier segmentation around home-fixes vs tech-essentials interest over time

Launch setup:

- Popup offer: Get 10% off your first order
- Ask for email first
- Delay SMS collection until a second step or a later flow

### SMS Capture

- Primary: Klaviyo SMS
- Fallback: Postscript

Why:

- Keeps lifecycle messaging in the same platform if Klaviyo is already installed
- Supports restocks, best-seller pushes, and light campaign testing later

Launch setup:

- Keep the SMS ask compliant and secondary
- Do not use aggressive mobile popups before the site is stable

## Install Order

1. Judge.me
2. Parcel Panel
3. Klaviyo
4. Shopify Bundles or Bundler
5. Search & Discovery if the theme needs manual related-product control

## Core Retention Flows

### Welcome Flow

Trigger:

- New popup or form signup

Goal:

- Convert first-time subscribers into first-time buyers

Suggested sequence:

- Email 1: brand promise and 10% incentive
- Email 2: best sellers and problem-solving angle
- Email 3: bundle spotlight with Desk Setup and Home Refresh

### Abandoned Checkout

Trigger:

- Customer starts checkout but does not purchase

Goal:

- Recover highest-intent sessions

Direction:

- Lead with the core benefit and free US shipping reminder
- Use discounting carefully and only late in the sequence if needed

### Abandoned Cart

Trigger:

- Customer adds to cart but does not begin checkout

Goal:

- Bring back shoppers before intent cools off

Direction:

- Show the exact product left behind
- Add one trust detail and one clean CTA
- Test a relevant bundle mention where it makes sense

### Browse Abandonment

Trigger:

- Known subscriber views product or collection pages without adding to cart

Goal:

- Recover softer intent through helpful merchandising

Direction:

- Show the viewed product and one related pairing
- Segment by collection interest when possible

### Post-Purchase Follow-Up

Trigger:

- Fulfillment or delivery window

Goal:

- Increase repeat purchase and lower support friction

Direction:

- Send useful next-step information first
- Follow with a related product or bundle suggestion later

### Review Request

Trigger:

- Delivery plus a short wait window

Goal:

- Collect early proof and media

Direction:

- Ask what problem the product solved
- Encourage photos for the most visual products: steamer, ring light, charging station

## QA Checklist

- Popup forms do not damage the mobile browsing experience
- Review widgets do not break layout or slow the product page materially
- The Track Order nav item routes to a functional tracking experience
- Bundle offers appear on the correct launch products
- All lifecycle flows are live and tested with internal addresses first
- Consent language is compliant before any SMS campaigns begin

## Operating Principle

At launch, fewer integrated systems done well is better than a stack of half-configured apps. The store only needs enough tooling to establish trust, capture leads, recover carts, and request reviews without degrading the experience.