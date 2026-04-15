import type { LaunchStrategy } from "../types.js";

export const launchStrategy: LaunchStrategy = {
  brand: {
    storeName: "typsh.it",
    primaryDomain: "typsh.it",
    supportEmail: "support@typsh.it",
    logoStatus: "replace-immediately",
    vibe: [
      "clean/minimal",
      "modern tech",
      "TikTok-trendy",
      "premium gadget",
    ],
    homepageFocus: "problem-solving products with home + tech secondary",
    tagline: "Useful Finds That Actually Make Life Easier",
    palette: {
      background: "#0F1115",
      surface: "#161A22",
      primaryText: "#F7F8FA",
      secondaryText: "#A9B1BC",
      accent: "#3B82F6",
      border: "#252B36",
    },
  },
  market: {
    launchRegion: "United States only",
    currency: "USD",
    businessCountry: "United States",
    shippingPolicy: "Free US shipping built into retail price",
    returnWindow: "30-day damaged/defective support flow",
    returnAddress: "3220 Trickum Rd, Marietta, GA 30066",
  },
  payments: {
    shopifyPayments: true,
    paypal: true,
    stripeLater: true,
  },
  productStrategy: {
    launchProducts: [
      "Handheld Clothes Steamer",
      "Magnetic Screen Door",
      "Silicone Drain Protector",
      "Wireless Charging Station",
      "Ring Light",
    ],
    phaseTwoProducts: ["Portable Blender"],
    merchandisingAngle:
      "problem-solving gadgets that demo well in short-form content while staying premium and low-friction for support",
    marginApproach:
      "favor compact, perceived-value products with healthy markup, strong bundles, and shipping baked into price",
    supplierPriority: ["Zendrop", "Spocket", "CJ Dropshipping"],
  },
  apps: [
    "reviews app",
    "order tracking app",
    "upsell or bundle app",
    "email popup",
    "SMS capture",
    "abandoned cart email flow",
    "browse abandonment flow",
    "review request flow",
  ],
  theme: {
    direction:
      "fast, minimal, premium gadget storefront with strong whitespace, bold product cards, and low-JS sections",
    launchPrinciples: [
      "keep JavaScript minimal and non-blocking",
      "use responsive images and lazy-load below-the-fold media",
      "prioritize product, collection, and homepage speed on mobile",
      "treat reviews, tracking, and bundles as progressive enhancements",
    ],
    seoAeoPrinciples: [
      "people-first answer-first product copy",
      "clear Who/How/Why trust signals",
      "JSON-LD structured data where theme supports it",
      "internal linking across homepage, collections, FAQs, and policies",
      "Search Console and rich result validation before launch",
    ],
  },
  cleanup: {
    retireProductHandles: ["unisex-t-shirt", "unisex-t-shirt-1"],
  },
  nextActions: [
    "retire legacy t-shirt products from storefront visibility",
    "replace logo immediately with a new typsh.it wordmark",
    "configure homepage sections around best sellers, trust strip, category blocks, hero product, and FAQ preview",
    "wire primary navigation: Home, Shop, Best Sellers, Track Order, FAQ, Contact",
    "wire footer navigation: About, Contact, FAQ, Shipping Policy, Return & Refund Policy, Privacy Policy, Terms of Service, Track Order",
    "install launch app stack for reviews, tracking, bundles, email popup, SMS, and retention flows",
    "submit sitemap to Search Console and validate structured data",
  ],
};

export function getLaunchStrategy() {
  return launchStrategy;
}