import type { LaunchCatalogSeed } from "../types.js";

export const DEFAULT_CATALOG_KEY = "typsh-it-launch";

export const launchCatalogs: Record<string, LaunchCatalogSeed> = {
  [DEFAULT_CATALOG_KEY]: {
    key: DEFAULT_CATALOG_KEY,
    storeName: "typsh.it",
    vendor: "typsh.it",
    brandTone:
      "clean, minimal, premium gadget, modern tech, concise, useful, answer-first",
    primaryMarket: "United States",
    defaultProductStatus: "DRAFT",
    products: [
      {
        title: "Handheld Clothes Steamer",
        handle: "handheld-clothes-steamer",
        price: 49,
        compareAtPrice: 69,
        category: "Garment Care",
        bullets: [
          "Smooths wrinkles quickly without pulling out a full ironing board",
          "Compact handheld format for fast touch-ups before work, travel, or events",
          "Simple water-fill design with a lightweight body for everyday use",
        ],
        collections: ["best-sellers", "problem-solvers", "home-fixes", "new-arrivals"],
        tags: ["launch", "garment-care", "home", "problem-solver"],
        faq: [
          {
            q: "What does this product solve?",
            a: "It helps remove wrinkles fast so clothes look cleaner without the setup and bulk of a traditional iron.",
          },
          {
            q: "Who is it for?",
            a: "It is a practical fit for busy households, travelers, students, and anyone who wants quick garment touch-ups.",
          },
        ],
      },
      {
        title: "Magnetic Screen Door",
        handle: "magnetic-screen-door",
        price: 34,
        compareAtPrice: 49,
        category: "Home Improvement",
        bullets: [
          "Lets fresh air in while helping keep bugs out",
          "Magnetic center closure makes hands-free entry easier when carrying groceries or moving between rooms",
          "Low-hassle setup designed for renters and everyday homes",
        ],
        collections: ["best-sellers", "problem-solvers", "home-fixes", "new-arrivals"],
        tags: ["launch", "home-fixes", "screen-door", "problem-solver"],
        faq: [
          {
            q: "What problem does it solve?",
            a: "It helps you enjoy airflow without leaving the doorway open to insects or dealing with constant opening and closing.",
          },
          {
            q: "Is it only for houses?",
            a: "No. It can also be useful for apartments, patios, garages, and other everyday entryways that benefit from quick pass-through access.",
          },
        ],
      },
      {
        title: "Silicone Drain Protector",
        handle: "silicone-drain-protector",
        price: 14,
        compareAtPrice: 19,
        category: "Kitchen & Bath",
        bullets: [
          "Catches hair and debris before they become messy clogs",
          "Low-maintenance design that is simple to place, remove, and rinse clean",
          "Everyday fix for sinks, tubs, and showers that need less cleanup drama",
        ],
        collections: ["best-sellers", "problem-solvers", "home-fixes", "new-arrivals"],
        tags: ["launch", "drain", "bathroom", "problem-solver"],
        faq: [
          {
            q: "What does it help prevent?",
            a: "It helps stop hair and debris from slipping into the drain and turning into larger clogs later.",
          },
        ],
      },
      {
        title: "Wireless Charging Station",
        handle: "wireless-charging-station",
        price: 44,
        compareAtPrice: 59,
        category: "Charging Accessories",
        bullets: [
          "Charges everyday devices from one compact spot to reduce cable clutter",
          "Cleaner setup for desks, nightstands, and shared spaces",
          "Designed for people who want a more organized daily charging routine",
        ],
        collections: ["best-sellers", "problem-solvers", "tech-essentials", "new-arrivals"],
        tags: ["launch", "charging", "desk", "tech-essentials"],
        faq: [
          {
            q: "Who is it best for?",
            a: "It is a strong fit for anyone tired of cable clutter on a desk or nightstand and wanting one tidy charging zone.",
          },
        ],
      },
      {
        title: "Ring Light",
        handle: "ring-light",
        price: 29,
        compareAtPrice: 39,
        category: "Content Creation",
        bullets: [
          "Improves lighting for content, calls, and desk setups without complex gear",
          "Quick way to get a brighter, cleaner look for videos and photos",
          "Useful for creators, remote work, tutorials, and everyday recording",
        ],
        collections: ["best-sellers", "problem-solvers", "creator-setup", "new-arrivals"],
        tags: ["launch", "creator", "lighting", "creator-setup"],
        faq: [
          {
            q: "What problem does it solve?",
            a: "It helps reduce flat, dim lighting so photos, videos, and calls look clearer and more polished.",
          },
        ],
      },
    ],
    collections: [
      {
        title: "Best Sellers",
        handle: "best-sellers",
        summary: "Top-performing problem-solving finds for home, tech, and everyday convenience.",
        productHandles: [
          "handheld-clothes-steamer",
          "magnetic-screen-door",
          "silicone-drain-protector",
          "wireless-charging-station",
          "ring-light",
        ],
      },
      {
        title: "Problem Solvers",
        handle: "problem-solvers",
        summary: "Useful finds that solve everyday frustrations fast without overcomplicating the fix.",
        productHandles: [
          "handheld-clothes-steamer",
          "magnetic-screen-door",
          "silicone-drain-protector",
          "wireless-charging-station",
          "ring-light",
        ],
      },
      {
        title: "Home Fixes",
        handle: "home-fixes",
        summary: "Simple upgrades for cleaner routines, better airflow, and fewer home annoyances.",
        productHandles: [
          "handheld-clothes-steamer",
          "magnetic-screen-door",
          "silicone-drain-protector",
        ],
      },
      {
        title: "Tech Essentials",
        handle: "tech-essentials",
        summary: "Clean, practical tech picks that make desks and daily charging setups easier to manage.",
        productHandles: [
          "wireless-charging-station",
          "ring-light",
        ],
      },
      {
        title: "Creator Setup",
        handle: "creator-setup",
        summary: "Straightforward gear for better lighting, cleaner setups, and easier everyday content creation.",
        productHandles: [
          "ring-light",
          "wireless-charging-station",
        ],
      },
      {
        title: "New Arrivals",
        handle: "new-arrivals",
        summary: "Freshly added useful finds for home, tech, and everyday convenience.",
        productHandles: [
          "handheld-clothes-steamer",
          "magnetic-screen-door",
          "silicone-drain-protector",
          "wireless-charging-station",
          "ring-light",
        ],
      },
    ],
    pages: [
      {
        title: "About",
        handle: "about",
        kind: "about",
        summary: "Explain typsh.it as a US-focused store for premium, problem-solving finds that make life easier.",
      },
      {
        title: "Contact",
        handle: "contact",
        kind: "contact",
        summary: "Share the support email, response expectations, and how customers should reach typsh.it for help.",
      },
      {
        title: "FAQ",
        handle: "faq",
        kind: "faq",
        summary: "Answer common questions about shipping, returns, order support, and what typsh.it sells.",
      },
      {
        title: "Shipping Policy",
        handle: "shipping-policy",
        kind: "shipping",
        summary: "Explain free US shipping, processing time, delivery expectations, and tracking in concise policy language.",
      },
      {
        title: "Return & Refund Policy",
        handle: "return-refund-policy",
        kind: "returns",
        summary: "Describe the 30-day damaged or defective support flow, refund timing, and support contact details.",
      },
      {
        title: "Privacy Policy",
        handle: "privacy-policy",
        kind: "privacy",
        summary: "Provide a straightforward privacy policy page suitable for a US-only launch store.",
      },
      {
        title: "Terms of Service",
        handle: "terms-of-service",
        kind: "terms",
        summary: "Provide concise store terms covering orders, payments, shipping, returns, and site usage.",
      },
      {
        title: "Track Order",
        handle: "track-order",
        kind: "track-order",
        summary: "Explain how customers can track orders and what to do if they need help locating shipment updates.",
      },
    ],
    metaobjects: [],
  },
};

export function getLaunchCatalog(key: string | undefined): LaunchCatalogSeed {
  const resolvedKey = key ?? DEFAULT_CATALOG_KEY;
  const catalog = launchCatalogs[resolvedKey];

  if (!catalog) {
    throw new Error(`Unknown launch catalog: ${resolvedKey}`);
  }

  return catalog;
}

export function listLaunchCatalogs() {
  return Object.values(launchCatalogs).map((catalog) => ({
    key: catalog.key,
    storeName: catalog.storeName,
    productCount: catalog.products.length,
    collectionCount: catalog.collections.length,
    pageCount: catalog.pages.length,
  }));
}
