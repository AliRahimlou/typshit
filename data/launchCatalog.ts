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
          {
            q: "Why is it useful for quick touch-ups?",
            a: "It is built for fast refresh moments before work, travel, dinner, or events when dragging out a full ironing board feels excessive.",
          },
          {
            q: "Where does it fit best in a routine?",
            a: "It works well as a compact garment-care tool for bedrooms, laundry areas, dorms, and travel setups that need a faster wrinkle fix.",
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
          {
            q: "Is installation permanent?",
            a: "No. It is positioned as a lower-hassle screen-door option for households that want easier setup and less commitment than a traditional door change.",
          },
          {
            q: "Why is it a strong family product?",
            a: "The hands-free magnetic closure makes it easier to move through the doorway when carrying groceries, managing pets, or moving between indoor and outdoor spaces.",
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
          {
            q: "Where can it be used?",
            a: "It is a practical fit for sinks, tubs, and showers where light daily debris can build into annoying cleanup later.",
          },
          {
            q: "Is it hard to maintain?",
            a: "No. The appeal is that it is easy to lift, rinse, and put back without turning drain cleanup into a bigger project.",
          },
          {
            q: "Who is it best for?",
            a: "It works well for anyone who wants a simple low-ticket fix for hair and debris before a drain issue becomes more frustrating and more expensive.",
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
          {
            q: "What problem does it solve?",
            a: "It helps reduce cable mess and charger sprawl by giving everyday devices one compact place to live and recharge.",
          },
          {
            q: "Where does it fit best?",
            a: "It is best positioned for desks, nightstands, and shared household charging areas where visual clutter builds quickly.",
          },
          {
            q: "Why does it feel more premium than loose chargers?",
            a: "The value is not just power delivery. It also creates a cleaner, more intentional setup that looks better and feels easier to use every day.",
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
          {
            q: "Who is it for?",
            a: "It is a strong fit for creators, remote workers, students, and anyone who records content or joins calls in less-than-ideal lighting.",
          },
          {
            q: "When is it most useful?",
            a: "It is especially useful for desk setups, makeup shots, product demos, livestreams, and quick video recordings where room lighting is inconsistent.",
          },
          {
            q: "Why is it better than relying on overhead light?",
            a: "Overhead lighting can cast shadows and flatten detail, while a ring light gives a cleaner, more direct source that improves how faces and products look on camera.",
          },
        ],
      },
    ],
    bundles: [
      {
        title: "Home Refresh Bundle",
        handle: "home-refresh-bundle",
        summary:
          "Pair the Handheld Clothes Steamer with the Silicone Drain Protector for a cleaner, more put-together home routine that feels practical instead of random.",
        productHandles: ["handheld-clothes-steamer", "silicone-drain-protector"],
        angle:
          "Merchandise this as a fast-reset bundle for mornings, laundry touch-ups, and low-friction home maintenance.",
        savingsMessage: "Present it as a simple two-item upgrade for cleaner routines and higher-perceived value.",
        ctaLabel: "Shop Home Refresh",
      },
      {
        title: "Desk Setup Bundle",
        handle: "desk-setup-bundle",
        summary:
          "Combine the Wireless Charging Station and Ring Light for a cleaner desk, better lighting, and a more intentional creator or work-from-home setup.",
        productHandles: ["wireless-charging-station", "ring-light"],
        angle:
          "Use this bundle for content creators, remote workers, and anyone upgrading a cluttered desk or nightstand.",
        savingsMessage: "Position this as the clean setup bundle that makes a space look better and work better.",
        ctaLabel: "Shop Desk Setup",
      },
      {
        title: "Everyday Fixes Bundle",
        handle: "everyday-fixes-bundle",
        summary:
          "Match the Magnetic Screen Door with the Silicone Drain Protector to highlight two low-hassle products that remove small but recurring household frustrations.",
        productHandles: ["magnetic-screen-door", "silicone-drain-protector"],
        angle:
          "Frame it as a practical home-convenience bundle with obvious before-and-after value.",
        savingsMessage: "Use this when you want an easy add-on offer that still feels curated and useful.",
        ctaLabel: "Shop Everyday Fixes",
      },
    ],
    collections: [
      {
        title: "Best Sellers",
        handle: "best-sellers",
        summary:
          "Top-performing problem-solving finds for home, tech, and everyday convenience, curated to make the first impression of the brand feel strong and easy to shop.",
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
        summary:
          "Useful finds that solve everyday frustrations fast without overcomplicating the fix, making this the clearest expression of the typsh.it brand promise.",
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
        summary:
          "Simple upgrades for cleaner routines, better airflow, and fewer home annoyances, merchandised for households that want useful improvements without big installs.",
        productHandles: [
          "handheld-clothes-steamer",
          "magnetic-screen-door",
          "silicone-drain-protector",
        ],
      },
      {
        title: "Tech Essentials",
        handle: "tech-essentials",
        summary:
          "Clean, practical tech picks that make desks and daily charging setups easier to manage, with a focus on decluttering and better everyday use.",
        productHandles: [
          "wireless-charging-station",
          "ring-light",
        ],
      },
      {
        title: "Creator Setup",
        handle: "creator-setup",
        summary:
          "Straightforward gear for better lighting, cleaner setups, and easier everyday content creation, built for shoppers who want fast visual upgrades instead of bulky gear.",
        productHandles: [
          "ring-light",
          "wireless-charging-station",
        ],
      },
      {
        title: "New Arrivals",
        handle: "new-arrivals",
        summary:
          "Freshly added useful finds for home, tech, and everyday convenience, giving the homepage and navigation a clean place to send repeat shoppers and traffic from launches.",
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
    metaobjects: [
      {
        type: "$app:typsh_theme_homepage",
        handle: "launch-homepage",
        optional: true,
        fields: [
          { key: "hero_headline", value: "Useful Finds That Actually Make Life Easier" },
          {
            key: "hero_subheadline",
            value:
              "Modern products for home, tech, and everyday convenience curated to solve real problems fast.",
          },
          { key: "primary_cta_label", value: "Shop Best Sellers" },
          { key: "primary_cta_href", value: "/collections/best-sellers" },
          { key: "secondary_cta_label", value: "See New Arrivals" },
          { key: "secondary_cta_href", value: "/collections/new-arrivals" },
          {
            key: "featured_product_handles",
            value:
              '["handheld-clothes-steamer","magnetic-screen-door","wireless-charging-station","ring-light"]',
          },
          {
            key: "bundle_handles",
            value:
              '["home-refresh-bundle","desk-setup-bundle","everyday-fixes-bundle"]',
          },
        ],
      },
      {
        type: "$app:typsh_theme_bundle",
        handle: "home-refresh-bundle",
        optional: true,
        fields: [
          { key: "title", value: "Home Refresh Bundle" },
          {
            key: "summary",
            value:
              "A practical two-item upgrade for cleaner routines, faster touch-ups, and a tidier everyday home setup.",
          },
          {
            key: "product_handles",
            value: '["handheld-clothes-steamer","silicone-drain-protector"]',
          },
          { key: "cta_label", value: "Shop Home Refresh" },
        ],
      },
      {
        type: "$app:typsh_theme_bundle",
        handle: "desk-setup-bundle",
        optional: true,
        fields: [
          { key: "title", value: "Desk Setup Bundle" },
          {
            key: "summary",
            value:
              "A clean desk and lighting pairing for shoppers who want a setup that looks more intentional and works better every day.",
          },
          {
            key: "product_handles",
            value: '["wireless-charging-station","ring-light"]',
          },
          { key: "cta_label", value: "Shop Desk Setup" },
        ],
      },
      {
        type: "$app:typsh_theme_bundle",
        handle: "everyday-fixes-bundle",
        optional: true,
        fields: [
          { key: "title", value: "Everyday Fixes Bundle" },
          {
            key: "summary",
            value:
              "Two low-hassle home products merchandised together for easy before-and-after value.",
          },
          {
            key: "product_handles",
            value: '["magnetic-screen-door","silicone-drain-protector"]',
          },
          { key: "cta_label", value: "Shop Everyday Fixes" },
        ],
      },
      {
        type: "$app:typsh_theme_value_prop",
        handle: "free-us-shipping",
        optional: true,
        fields: [
          { key: "label", value: "Free US Shipping" },
          { key: "description", value: "Shipping is built into launch pricing for a cleaner checkout story." },
        ],
      },
      {
        type: "$app:typsh_theme_value_prop",
        handle: "secure-checkout",
        optional: true,
        fields: [
          { key: "label", value: "Secure Checkout" },
          { key: "description", value: "Use Shopify checkout and trusted payment rails as the core trust signal." },
        ],
      },
      {
        type: "$app:typsh_theme_value_prop",
        handle: "responsive-support",
        optional: true,
        fields: [
          { key: "label", value: "Responsive Support" },
          { key: "description", value: "Keep support visible and answer-first at support@typsh.it." },
        ],
      },
      {
        type: "$app:typsh_theme_value_prop",
        handle: "curated-products-only",
        optional: true,
        fields: [
          { key: "label", value: "Curated Products Only" },
          { key: "description", value: "Reinforce that typsh.it is edited and intentional, not a random catalog dump." },
        ],
      },
    ],
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
