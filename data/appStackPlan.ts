import type { AppStackPlan } from "../types.js";

export const appStackPlan: AppStackPlan = {
  summary:
    "Use a lean launch stack that covers trust, retention, and conversion without bloating the theme: one strong reviews app, one tracking app, one bundle layer, and one lifecycle platform that can own popup capture, email, and SMS.",
  installOrder: [
    "Judge.me for reviews",
    "Parcel Panel for order tracking",
    "Klaviyo for popup capture, email, and SMS",
    "Shopify Bundles or Bundler for bundle offers",
    "Search & Discovery only if the active theme needs related-product control",
  ],
  recommendations: [
    {
      capability: "Reviews",
      recommendedApp: "Judge.me",
      fallbackApp: "Loox",
      priority: "required-now",
      rationale:
        "Judge.me covers review widgets, review request automation, and photo/video social proof without forcing a heavyweight rebuild of the theme.",
      implementationNotes: [
        "Enable star ratings on product cards and product pages.",
        "Turn on review request emails after fulfillment, not immediately after purchase.",
        "Keep the homepage review block text-led at first, then replace with live review widgets once volume exists.",
      ],
    },
    {
      capability: "Order tracking",
      recommendedApp: "Parcel Panel",
      fallbackApp: "AfterShip Tracking",
      priority: "required-now",
      rationale:
        "A dedicated tracking portal reduces support load and lets the existing Track Order page point to a branded experience quickly.",
      implementationNotes: [
        "Connect the tracking page to the app's hosted portal or embedded lookup.",
        "Align the page styling with the dark typsh.it palette.",
        "Make support escalation visible on the tracking page for delayed shipments.",
      ],
    },
    {
      capability: "Bundles and upsell",
      recommendedApp: "Shopify Bundles",
      fallbackApp: "Bundler Product Bundles",
      priority: "required-now",
      rationale:
        "Start with simple fixed bundles for the three launch bundle concepts before layering in more aggressive upsell tooling.",
      implementationNotes: [
        "Create Home Refresh, Desk Setup, and Everyday Fixes bundles first.",
        "Feature bundle offers on relevant product pages and in cart messaging.",
        "Do not clutter the product page with too many upsell boxes; one bundle module is enough for launch.",
      ],
    },
    {
      capability: "Email popup and lifecycle email",
      recommendedApp: "Klaviyo",
      fallbackApp: "Shopify Forms + Shopify Email",
      priority: "required-now",
      rationale:
        "Klaviyo can own popup capture, segmentation, welcome email, abandoned cart, browse abandonment, and post-purchase messaging from one place.",
      implementationNotes: [
        "Use a simple popup with the 10% first-order incentive.",
        "Capture email on the first step and test SMS capture only as a second step after conversion proves out.",
        "Tag subscribers by collection interest when possible: home-fixes, tech-essentials, creator-setup.",
      ],
    },
    {
      capability: "SMS capture",
      recommendedApp: "Klaviyo SMS",
      fallbackApp: "Postscript",
      priority: "launch-week",
      rationale:
        "SMS should support lifecycle retention and campaign testing, but it should not slow the first checkout experience with aggressive opt-in prompts.",
      implementationNotes: [
        "Use compliant consent copy and defer the ask until after email capture or post-purchase.",
        "Keep launch SMS focused on restocks, bundles, and best-seller pushes rather than daily campaigns.",
      ],
    },
    {
      capability: "Search and related-product control",
      recommendedApp: "Shopify Search & Discovery",
      priority: "launch-week",
      rationale:
        "Useful for manual related-product tuning and better filter logic if the active theme does not already support clean merchandising blocks.",
      implementationNotes: [
        "Use it to reinforce the three bundle pairings and the collection pathways already defined in the launch catalog.",
      ],
    },
  ],
  flows: [
    {
      name: "Welcome flow",
      channel: "email",
      trigger: "New signup from popup, footer form, or checkout opt-in",
      objective: "Convert first-time subscribers into first-time buyers quickly.",
      contentNotes: [
        "Email 1: brand promise and 10% incentive.",
        "Email 2: best sellers and problem-solving angle.",
        "Email 3: bundle spotlight with Desk Setup and Home Refresh concepts.",
      ],
      successMetric: "Welcome flow revenue per recipient and first-order conversion rate.",
    },
    {
      name: "Abandoned checkout",
      channel: "email",
      trigger: "Customer reaches checkout and leaves without purchasing",
      objective: "Recover highest-intent sessions without over-discounting.",
      contentNotes: [
        "Lead with the product problem/solution and free US shipping reminder.",
        "Reserve discounts for the final touch only if needed.",
      ],
      successMetric: "Recovered checkout revenue.",
    },
    {
      name: "Abandoned cart",
      channel: "email",
      trigger: "Customer adds to cart but does not start checkout",
      objective: "Bring shoppers back before intent cools off.",
      contentNotes: [
        "Use the product image, a one-line benefit statement, and one supporting trust detail.",
        "Test a bundle reminder when the cart item has a natural pairing.",
      ],
      successMetric: "Cart recovery conversion rate.",
    },
    {
      name: "Browse abandonment",
      channel: "email",
      trigger: "Known subscriber views product or collection pages without adding to cart",
      objective: "Recover softer intent with helpful merchandising instead of urgency-only tactics.",
      contentNotes: [
        "Show the exact product viewed and one related pairing.",
        "Use creator-setup vs home-fixes segmentation when possible.",
      ],
      successMetric: "Browse recovery click-through and assisted conversions.",
    },
    {
      name: "Post-purchase follow-up",
      channel: "email",
      trigger: "Order fulfilled",
      objective: "Increase repeat purchase likelihood and reduce support friction.",
      contentNotes: [
        "Send a useful post-purchase note with tracking expectations and support reminders.",
        "Follow later with a complementary product or bundle suggestion.",
      ],
      successMetric: "Repeat purchase rate within 30 to 45 days.",
    },
    {
      name: "Review request",
      channel: "reviews",
      trigger: "Delivery plus a short waiting window",
      objective: "Collect early proof and media without sounding spammy.",
      contentNotes: [
        "Ask what problem the product solved and whether setup met expectations.",
        "Encourage photo submissions for the most visual products: steamer, ring light, charging station.",
      ],
      successMetric: "Review submission rate and photo review rate.",
    },
  ],
  qaChecklist: [
    "All popup forms respect mobile viewport space and do not block immediate browsing.",
    "Review widgets do not break product page layout or slow LCP materially.",
    "Tracking page works from the live Track Order navigation link.",
    "Bundle offers are visible on the correct launch product pages.",
    "Welcome, abandoned checkout, abandoned cart, browse abandonment, post-purchase, and review request flows are active and tested.",
    "Email and SMS consent language matches compliance requirements before launch campaigns begin.",
  ],
};

export function getAppStackPlan() {
  return appStackPlan;
}