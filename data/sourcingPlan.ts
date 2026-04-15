import type { SourcingPlan } from "../types.js";

export const sourcingPlan: SourcingPlan = {
  summary:
    "Use real supplier platforms for the existing five-product launch catalog, prioritize fast US shipping and margin room, and reject commodity listings that look generic or support-heavy.",
  platforms: [
    {
      name: "Zendrop",
      website: "https://www.zendrop.com/",
      strengths: [
        "product discovery and sourcing requests",
        "US warehousing and fulfillment options",
        "Shopify-oriented automation and fast-shipping positioning",
      ],
      requiresAccountConnection: true,
      launchFit:
        "best first pass for sourcing higher-margin, problem-solving gadgets with better fulfillment options",
    },
    {
      name: "Spocket",
      website: "https://www.spocket.co/",
      strengths: [
        "US and EU supplier positioning",
        "winning product discovery tools",
        "Shopify integration and product import automation",
      ],
      requiresAccountConnection: true,
      launchFit:
        "strong backup source when you want US-facing delivery promises and cleaner supplier management",
    },
    {
      name: "CJdropshipping",
      website: "https://www.cjdropshipping.com/",
      strengths: [
        "broad catalog and public product discovery",
        "sourcing service and store connection flow",
        "often useful for lower landed-cost gadget variants",
      ],
      requiresAccountConnection: true,
      launchFit:
        "good cost-down and catalog breadth option, but individual listings need tighter quality filtering",
    },
  ],
  products: [
    {
      productTitle: "Handheld Clothes Steamer",
      handle: "handheld-clothes-steamer",
      preferredPlatforms: ["Zendrop", "Spocket", "CJdropshipping"],
      searchTerms: [
        "portable garment steamer",
        "handheld clothes steamer",
        "travel clothes steamer",
      ],
      targetSellPrice: 49,
      maxLandedCost: 16,
      targetGrossMarginPercent: 67,
      preferredShipFrom: ["United States", "United States warehouse"],
      usShippingTargetDays: "3-8 business days",
      mustHave: [
        "usable product photos or video",
        "stable US fulfillment option",
        "clear tank capacity and power specs",
        "low refund-risk packaging and instructions",
      ],
      rejectIf: [
        "poor reviews or obvious leak complaints",
        "long battery claims for a non-battery product",
        "no shipping timeline for US orders",
      ],
      notes: "High demo value and strong wrinkle-removal angle; avoid low-quality plastic variants that look cheap on video.",
    },
    {
      productTitle: "Magnetic Screen Door",
      handle: "magnetic-screen-door",
      preferredPlatforms: ["Spocket", "Zendrop", "CJdropshipping"],
      searchTerms: [
        "magnetic screen door",
        "hands free mesh screen door",
        "magnetic door mesh",
      ],
      targetSellPrice: 34,
      maxLandedCost: 10,
      targetGrossMarginPercent: 70,
      preferredShipFrom: ["United States", "United States warehouse"],
      usShippingTargetDays: "3-8 business days",
      mustHave: [
        "multiple size variants",
        "clear install kit details",
        "video showing auto-close magnets working",
      ],
      rejectIf: [
        "no size documentation",
        "weak magnet complaints",
        "poor mesh durability reviews",
      ],
      notes: "Good margin and easy UGC angle; confirm size mapping before importing.",
    },
    {
      productTitle: "Silicone Drain Protector",
      handle: "silicone-drain-protector",
      preferredPlatforms: ["CJdropshipping", "Zendrop", "Spocket"],
      searchTerms: [
        "silicone drain protector",
        "hair catcher drain cover",
        "sink shower drain protector",
      ],
      targetSellPrice: 14,
      maxLandedCost: 3,
      targetGrossMarginPercent: 78,
      preferredShipFrom: ["United States", "China with proven fast line"],
      usShippingTargetDays: "4-10 business days",
      mustHave: [
        "clear dimension specs",
        "visual debris-catching demo",
        "simple pack size and low breakage risk",
      ],
      rejectIf: [
        "undersized variants without dimensions",
        "cheap imagery that reads generic marketplace",
        "no material information",
      ],
      notes: "Very margin-friendly. Best as a bundle and add-on product.",
    },
    {
      productTitle: "Wireless Charging Station",
      handle: "wireless-charging-station",
      preferredPlatforms: ["Zendrop", "Spocket", "CJdropshipping"],
      searchTerms: [
        "3 in 1 wireless charging station",
        "wireless charging dock",
        "desk charging station",
      ],
      targetSellPrice: 44,
      maxLandedCost: 14,
      targetGrossMarginPercent: 68,
      preferredShipFrom: ["United States", "United States warehouse"],
      usShippingTargetDays: "3-8 business days",
      mustHave: [
        "device compatibility details",
        "clean product photography",
        "clear wattage and cable inclusion info",
      ],
      rejectIf: [
        "unclear device support",
        "overheating complaints",
        "generic copy with no specs",
      ],
      notes: "Strong perceived value. Vet carefully for support risk and compatibility accuracy.",
    },
    {
      productTitle: "Ring Light",
      handle: "ring-light",
      preferredPlatforms: ["Zendrop", "CJdropshipping", "Spocket"],
      searchTerms: [
        "desktop ring light",
        "selfie ring light with tripod",
        "content creator ring light",
      ],
      targetSellPrice: 29,
      maxLandedCost: 8,
      targetGrossMarginPercent: 72,
      preferredShipFrom: ["United States", "United States warehouse"],
      usShippingTargetDays: "3-8 business days",
      mustHave: [
        "brightness modes and color temperature info",
        "video or image showing before and after lighting",
        "compact creator-friendly packaging",
      ],
      rejectIf: [
        "flimsy stand complaints",
        "unclear power source",
        "weak image quality",
      ],
      notes: "Easy ad creative and bundle candidate with wireless charging station.",
    },
  ],
  requiredManualConnections: [
    "Create merchant accounts in Zendrop, Spocket, and CJdropshipping",
    "Install the chosen supplier app in Shopify and grant required permissions",
    "Connect the supplier catalog/app to the live Shopify store",
    "Approve product variants, shipping origin, and fulfillment settings before import",
    "Test one full order path end to end before paid traffic",
  ],
};

export function getSourcingPlan() {
  return sourcingPlan;
}