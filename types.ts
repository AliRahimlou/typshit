export type PublicationStatus = "ACTIVE" | "DRAFT";

export type FAQEntry = {
  q: string;
  a: string;
};

export type LaunchProductSeed = {
  title: string;
  handle: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  bullets: string[];
  collections: string[];
  tags?: string[];
  faq?: FAQEntry[];
  status?: PublicationStatus;
};

export type LaunchCollectionSeed = {
  title: string;
  handle: string;
  summary: string;
  productHandles: string[];
};

export type LaunchPageKind =
  | "faq"
  | "shipping"
  | "returns"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "track-order"
  | "content";

export type LaunchPageSeed = {
  title: string;
  handle: string;
  kind: LaunchPageKind;
  summary: string;
  bodyHtml?: string;
};

export type LaunchBundleSeed = {
  title: string;
  handle: string;
  summary: string;
  productHandles: string[];
  angle: string;
  savingsMessage: string;
  ctaLabel: string;
};

export type LaunchMetaobjectSeed = {
  type: string;
  handle: string;
  fields: Array<{
    key: string;
    value: string;
  }>;
  optional?: boolean;
};

export type LaunchCatalogSeed = {
  key: string;
  storeName: string;
  vendor: string;
  brandTone: string;
  primaryMarket: string;
  defaultProductStatus: PublicationStatus;
  products: LaunchProductSeed[];
  bundles: LaunchBundleSeed[];
  collections: LaunchCollectionSeed[];
  pages: LaunchPageSeed[];
  metaobjects: LaunchMetaobjectSeed[];
};

export type ProductPayload = {
  title: string;
  handle: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  price: string;
  compareAtPrice?: string;
  status: PublicationStatus;
  seoTitle: string;
  seoDescription: string;
  faq: FAQEntry[];
  collections: string[];
};

export type CollectionPayload = {
  title: string;
  handle: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  productHandles: string[];
};

export type PagePayload = {
  title: string;
  handle: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
};

export type LaunchCatalogAssets = {
  products: ProductPayload[];
  collections: CollectionPayload[];
  pages: PagePayload[];
  metaobjects: LaunchMetaobjectSeed[];
};

export type ShopifyProductRecord = {
  id: string;
  title: string;
  handle: string;
  status: string;
  onlineStoreUrl?: string | null;
};

export type ShopifyCollectionRecord = {
  id: string;
  title: string;
  handle: string;
};

export type ShopifyPageRecord = {
  id: string;
  title: string;
  handle: string;
  isPublished: boolean;
};

export type ShopifyMetaobjectRecord = {
  id: string;
  handle: string;
  type: string;
};

export type WorkflowWarning = {
  step: string;
  message: string;
};

export type LaunchCatalogWorkflowResult = {
  assets: LaunchCatalogAssets;
  products: ShopifyProductRecord[];
  collections: Array<
    ShopifyCollectionRecord & {
      addProductsJobId: string | null;
      published: boolean;
    }
  >;
  pages: ShopifyPageRecord[];
  metaobjects: Array<
    | ShopifyMetaobjectRecord
    | {
        handle: string;
        type: string;
        skipped: true;
      }
  >;
  warnings: WorkflowWarning[];
};

export type AgentToolResult = {
  tool: string;
  result: unknown;
};

export type LaunchStrategy = {
  brand: {
    storeName: string;
    primaryDomain: string;
    supportEmail: string;
    logoStatus: "replace-immediately" | "keep-temporarily";
    vibe: string[];
    homepageFocus: string;
    tagline: string;
    palette: {
      background: string;
      surface: string;
      primaryText: string;
      secondaryText: string;
      accent: string;
      border: string;
    };
  };
  market: {
    launchRegion: string;
    currency: string;
    businessCountry: string;
    shippingPolicy: string;
    returnWindow: string;
    returnAddress: string;
  };
  payments: {
    shopifyPayments: boolean;
    paypal: boolean;
    stripeLater: boolean;
  };
  productStrategy: {
    launchProducts: string[];
    phaseTwoProducts: string[];
    merchandisingAngle: string;
    marginApproach: string;
    supplierPriority: string[];
  };
  apps: string[];
  theme: {
    direction: string;
    launchPrinciples: string[];
    seoAeoPrinciples: string[];
  };
  cleanup: {
    retireProductHandles: string[];
  };
  nextActions: string[];
};

export type ThemeNavLink = {
  label: string;
  href: string;
};

export type ThemeTrustItem = {
  title: string;
  detail: string;
  icon: string;
};

export type ThemeFeaturedProductCard = {
  handle: string;
  title: string;
  category: string;
  summary: string;
  badge: string;
  ctaLabel: string;
};

export type ThemeCategoryCard = {
  title: string;
  handle: string;
  href: string;
  summary: string;
};

export type ThemeReviewSnippet = {
  quote: string;
  author: string;
  context: string;
};

export type ThemeHandoff = {
  brand: {
    storeName: string;
    tagline: string;
    palette: LaunchStrategy["brand"]["palette"];
  };
  logo: {
    wordmark: string;
    emphasis: string;
    direction: string;
    faviconDirection: string;
  };
  navigation: {
    header: ThemeNavLink[];
    footer: ThemeNavLink[];
  };
  homepage: {
    sectionOrder: string[];
    hero: {
      headline: string;
      subheadline: string;
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryCtaLabel: string;
      secondaryCtaHref: string;
      supportingPoints: string[];
    };
    trustStrip: ThemeTrustItem[];
    featuredProducts: ThemeFeaturedProductCard[];
    categoryCards: ThemeCategoryCard[];
    heroProduct: {
      handle: string;
      title: string;
      headline: string;
      body: string;
      bulletHighlights: string[];
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryCtaLabel: string;
      secondaryCtaHref: string;
    };
    reviewSnippets: ThemeReviewSnippet[];
    whyTypsh: {
      title: string;
      points: string[];
    };
    faqPreview: FAQEntry[];
    emailCapture: {
      headline: string;
      incentive: string;
      body: string;
      primaryCtaLabel: string;
      disclaimer: string;
    };
  };
  bundles: LaunchBundleSeed[];
  implementationNotes: string[];
};

export type AppStackRecommendation = {
  capability: string;
  recommendedApp: string;
  fallbackApp?: string;
  priority: "required-now" | "launch-week" | "phase-two";
  rationale: string;
  implementationNotes: string[];
};

export type RetentionFlowPlan = {
  name: string;
  channel: "email" | "sms" | "onsite" | "reviews";
  trigger: string;
  objective: string;
  contentNotes: string[];
  successMetric: string;
};

export type AppStackPlan = {
  summary: string;
  installOrder: string[];
  recommendations: AppStackRecommendation[];
  flows: RetentionFlowPlan[];
  qaChecklist: string[];
};

export type MetaobjectAdminAccessLevel =
  | "PRIVATE"
  | "MERCHANT_READ"
  | "MERCHANT_READ_WRITE"
  | "PUBLIC_READ"
  | "PUBLIC_READ_WRITE";

export type MetaobjectStorefrontAccessLevel = "NONE" | "PUBLIC_READ";

export type MetaobjectDefinitionFieldSpec = {
  key: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
};

export type MetaobjectDefinitionSpec = {
  type: string;
  name: string;
  description?: string;
  displayNameKey?: string;
  access?: {
    admin?: MetaobjectAdminAccessLevel;
    storefront?: MetaobjectStorefrontAccessLevel;
  };
  fieldDefinitions: MetaobjectDefinitionFieldSpec[];
};

export type ShopifyMetaobjectDefinitionRecord = {
  id: string;
  type: string;
  name: string;
  fieldDefinitions?: Array<{
    key: string;
  }>;
};

export type RetiredProductResult = {
  handle: string;
  found: boolean;
  retired: boolean;
  product?: ShopifyProductRecord;
};

export type SupplierPlatform = {
  name: string;
  website: string;
  strengths: string[];
  requiresAccountConnection: boolean;
  launchFit: string;
};

export type SupplierCandidateSpec = {
  productTitle: string;
  handle: string;
  preferredPlatforms: string[];
  searchTerms: string[];
  targetSellPrice: number;
  maxLandedCost: number;
  targetGrossMarginPercent: number;
  preferredShipFrom: string[];
  usShippingTargetDays: string;
  mustHave: string[];
  rejectIf: string[];
  notes: string;
};

export type SourcingPlan = {
  summary: string;
  platforms: SupplierPlatform[];
  products: SupplierCandidateSpec[];
  requiredManualConnections: string[];
};

export type LaunchReadinessCheck = {
  area: string;
  status: "ready" | "in-progress" | "blocked" | "manual";
  details: string;
};

export type ZendropToolRecord = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

export type ZendropOauthEvent = {
  stage: "idle" | "started" | "callback-received" | "token-saved" | "error";
  at: string;
  message: string;
};

export type ZendropConnectionStatus = {
  configured: boolean;
  url: string;
  hasAccessToken: boolean;
  hasClientId: boolean;
  tools: ZendropToolRecord[];
  initializeOk: boolean;
  listToolsOk: boolean;
  challengeDetected?: boolean;
  oauth: ZendropOauthEvent;
  error?: string;
};

export type ZendropProductMediaCacheEntry = {
  handle: string;
  title?: string;
  storeProductId?: string;
  productId?: number;
  importListItemId?: number;
  productName?: string;
  mediaAlt?: string;
  descriptionHtml?: string;
  seoDescription?: string;
  productType?: string;
  mediaUrls: string[];
  updatedAt: string;
};

export type ZendropProductMediaCache = {
  version: 1;
  updatedAt: string;
  entries: Record<string, ZendropProductMediaCacheEntry>;
};

export type ZendropSearchRequest = {
  query: string;
  market?: string;
  limit?: number;
};

export type ShopifyEnrichProductInput = {
  handle: string;
  title?: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  price?: string;
  compareAtPrice?: string;
  collectionHandles?: string[];
  mediaUrls?: string[];
  mediaAlt?: string;
  publish?: boolean;
};

export type ShopifyEnrichProductResult = {
  product: ShopifyProductRecord;
  collectionHandles: string[];
  published: boolean;
};
