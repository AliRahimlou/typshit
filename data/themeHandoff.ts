import { getLaunchCatalog } from "./launchCatalog.js";
import { getLaunchStrategy } from "./launchStrategy.js";
import type { ThemeHandoff } from "../types.js";

export function getThemeHandoff(): ThemeHandoff {
  const strategy = getLaunchStrategy();
  const catalog = getLaunchCatalog(undefined);
  const heroProduct = catalog.products.find((product) => product.handle === "handheld-clothes-steamer") ?? catalog.products[0];
  const featuredProducts = catalog.products.slice(0, 4);
  const faqPreview = [
    {
      q: "What kind of products does typsh.it carry?",
      a: "typsh.it focuses on practical home and tech finds that solve real everyday problems without feeling cluttered or gimmicky.",
    },
    {
      q: "Where do you ship?",
      a: "The launch store is focused on the United States, with free US shipping built into product pricing.",
    },
    {
      q: "How do returns and support work?",
      a: "If an order arrives damaged or defective, customers can contact support@typsh.it within 30 days for help.",
    },
  ];

  return {
    brand: {
      storeName: strategy.brand.storeName,
      tagline: strategy.brand.tagline,
      palette: strategy.brand.palette,
    },
    logo: {
      wordmark: "typsh.it",
      emphasis: "Keep the `.it` slightly brighter or tighter-tracked so the mark feels intentional instead of generic.",
      direction: "Use a clean geometric sans wordmark with slightly widened tracking, crisp terminals, and enough weight to hold up in a compact header.",
      faviconDirection: "Use a simple `t.` or `ty` monogram in the accent color on a near-black background.",
    },
    navigation: {
      header: [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/collections/all" },
        { label: "Best Sellers", href: "/collections/best-sellers" },
        { label: "Track Order", href: "/pages/track-order" },
        { label: "FAQ", href: "/pages/faq" },
        { label: "Contact", href: "/pages/contact" },
      ],
      footer: [
        { label: "About", href: "/pages/about" },
        { label: "Contact", href: "/pages/contact" },
        { label: "FAQ", href: "/pages/faq" },
        { label: "Shipping Policy", href: "/pages/shipping-policy" },
        { label: "Return & Refund Policy", href: "/pages/return-refund-policy" },
        { label: "Privacy Policy", href: "/pages/privacy-policy" },
        { label: "Terms of Service", href: "/pages/terms-of-service" },
        { label: "Track Order", href: "/pages/track-order" },
      ],
    },
    homepage: {
      sectionOrder: [
        "hero",
        "trust-strip",
        "featured-products",
        "shop-by-category",
        "hero-product",
        "social-proof",
        "why-typsh",
        "faq-preview",
        "email-capture",
      ],
      hero: {
        headline: "Useful Finds That Actually Make Life Easier",
        subheadline:
          "Modern products for home, tech, and everyday convenience curated to solve real problems fast, without the junk-drawer feel of a random general store.",
        primaryCtaLabel: "Shop Best Sellers",
        primaryCtaHref: "/collections/best-sellers",
        secondaryCtaLabel: "See New Arrivals",
        secondaryCtaHref: "/collections/new-arrivals",
        supportingPoints: [
          "Free US shipping built into every order",
          "Problem-solving products with clean merchandising",
          "Fast answers and responsive support",
        ],
      },
      trustStrip: [
        { title: "Free US Shipping", detail: "Pricing already includes shipping for launch orders.", icon: "truck" },
        { title: "Secure Checkout", detail: "Shopify checkout with trusted payment rails.", icon: "shield" },
        { title: "Responsive Support", detail: "Clear help from support@typsh.it when something goes wrong.", icon: "message" },
        { title: "Curated Products Only", detail: "Every item is selected for usefulness, not endless catalog sprawl.", icon: "spark" },
      ],
      featuredProducts: featuredProducts.map((product) => ({
        handle: product.handle,
        title: product.title,
        category: product.category,
        summary: product.faq?.[0]?.a ?? product.bullets[0],
        badge: product.compareAtPrice ? `Save $${product.compareAtPrice - product.price}` : "Problem Solver",
        ctaLabel: "Shop Now",
      })),
      categoryCards: [
        {
          title: "Home Fixes",
          handle: "home-fixes",
          href: "/collections/home-fixes",
          summary: "Low-friction upgrades for wrinkles, airflow, and everyday cleanup annoyances.",
        },
        {
          title: "Tech Essentials",
          handle: "tech-essentials",
          href: "/collections/tech-essentials",
          summary: "Clean desk and charging products that make daily routines feel less messy.",
        },
        {
          title: "Creator Setup",
          handle: "creator-setup",
          href: "/collections/creator-setup",
          summary: "Straightforward gear for better lighting, cleaner setups, and faster content capture.",
        },
        {
          title: "Problem Solvers",
          handle: "problem-solvers",
          href: "/collections/problem-solvers",
          summary: "The full launch assortment of practical products selected to solve real frustrations quickly.",
        },
      ],
      heroProduct: {
        handle: heroProduct.handle,
        title: heroProduct.title,
        headline: "Our hero product: the fast way to look put together",
        body:
          "Feature the Handheld Clothes Steamer as the main merchandising anchor. It fits the brand best because the use case is obvious, the demo value is high, and the benefit is understood in seconds.",
        bulletHighlights: heroProduct.bullets,
        primaryCtaLabel: "Shop the Steamer",
        primaryCtaHref: `/products/${heroProduct.handle}`,
        secondaryCtaLabel: "View Home Refresh Bundle",
        secondaryCtaHref: "#bundles",
      },
      reviewSnippets: [
        {
          quote: "The store feels curated. I found what I needed fast and the product explained the benefit immediately.",
          author: "Launch shopper placeholder",
          context: "Use as a style reference for early testimonial blocks until a reviews app is live.",
        },
        {
          quote: "The desk setup products feel cleaner and more premium than the usual impulse-buy gadget stores.",
          author: "Early customer voice",
          context: "Use in a text-led social proof row with simple portrait placeholders or iconography.",
        },
        {
          quote: "Shipping and support details were easy to find, which made the purchase feel lower risk.",
          author: "Trust-focused shopper voice",
          context: "Good fit for a compact review card near the FAQ preview or trust strip.",
        },
      ],
      whyTypsh: {
        title: "Why typsh.it",
        points: [
          "We do not sell endless random gadgets just to pad the catalog.",
          "Every product is selected because the problem and payoff are easy to understand.",
          "The store favors clean answers, usable product pages, and lower-friction support.",
        ],
      },
      faqPreview,
      emailCapture: {
        headline: "Get 10% off your first order",
        incentive: "10% off",
        body: "Use a compact popup and footer capture module that frames the offer as access to useful finds, launch drops, and practical product picks.",
        primaryCtaLabel: "Unlock 10% Off",
        disclaimer: "Keep the form light: email first, then test SMS as a second step instead of asking for too much upfront.",
      },
    },
    bundles: catalog.bundles,
    implementationNotes: [
      "Keep the homepage above-the-fold focused on one clear headline, four trust points, and four product cards max on desktop.",
      "Favor image-first sections with concise copy blocks; this brand should feel premium and useful, not content-heavy or blog-like.",
      "Use the launch collections and bundle concepts as the primary homepage organization layer instead of adding more categories.",
      "Leave theme code flexible for future metaobject-powered sections, but ship with hard references to the current launch handles if that is faster.",
    ],
  };
}