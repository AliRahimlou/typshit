import { config } from "./config.js";
import type {
  CollectionPayload,
  LaunchMetaobjectSeed,
  MetaobjectDefinitionSpec,
  PagePayload,
  ProductPayload,
  RetiredProductResult,
  ShopifyEnrichProductInput,
  ShopifyMetaobjectDefinitionRecord,
  ShopifyEnrichProductResult,
  ShopifyCollectionRecord,
  ShopifyMetaobjectRecord,
  ShopifyPageRecord,
  ShopifyProductRecord,
} from "./types.js";

const shopifyGraphqlUrl = `https://${config.shopifyStoreDomain}/admin/api/${config.shopifyApiVersion}/graphql.json`;
const shopifyTokenUrl = `https://${config.shopifyStoreDomain}/admin/oauth/access_token`;

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

type ShopifyUserError = {
  field?: string[];
  message: string;
  code?: string;
};

type ProductCreateResponse = {
  productCreate: {
    product:
      | (ShopifyProductRecord & {
          variants: {
            nodes: Array<{
              id: string;
            }>;
          };
        })
      | null;
    userErrors: ShopifyUserError[];
  };
};

type ProductVariantsBulkUpdateResponse = {
  productVariantsBulkUpdate: {
    productVariants: Array<{
      id: string;
      price: string;
      compareAtPrice?: string | null;
    }>;
    userErrors: ShopifyUserError[];
  };
};

type ProductUpdateResponse = {
  productUpdate: {
    product: ShopifyProductRecord | null;
    userErrors: ShopifyUserError[];
  };
};

type ShopifyProductWithDefaultVariant = ShopifyProductRecord & {
  variants: {
    nodes: Array<{
      id: string;
      price: string;
      compareAtPrice?: string | null;
    }>;
  };
};

type ShopifyProductMediaNode = {
  mediaContentType?: string;
  image?: {
    url: string;
    altText?: string | null;
  } | null;
};

type ShopifyProductWithMedia = ShopifyProductRecord & {
  media: {
    nodes: ShopifyProductMediaNode[];
  };
};

type ShopifyCollectionWithProductMembership = ShopifyCollectionRecord & {
  availablePublicationsCount?: {
    count: number;
  };
  products?: {
    nodes: Array<{
      id: string;
    }>;
  };
};

type ProductSetResponse = {
  productSet: {
    product: ShopifyProductRecord | null;
    userErrors: ShopifyUserError[];
  };
};

type CollectionUpdateResponse = {
  collectionUpdate: {
    collection: ShopifyCollectionRecord | null;
    userErrors: ShopifyUserError[];
  };
};

type PageUpdateResponse = {
  pageUpdate: {
    page: ShopifyPageRecord | null;
    userErrors: ShopifyUserError[];
  };
};

type MetaobjectDefinitionCreateResponse = {
  metaobjectDefinitionCreate: {
    metaobjectDefinition: ShopifyMetaobjectDefinitionRecord | null;
    userErrors: ShopifyUserError[];
  };
};

type MetaobjectDefinitionUpdateResponse = {
  metaobjectDefinitionUpdate: {
    metaobjectDefinition: ShopifyMetaobjectDefinitionRecord | null;
    userErrors: ShopifyUserError[];
  };
};

const QUERIES = {
  productCreate: `#graphql
    mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          handle
          status
          onlineStoreUrl
          variants(first: 1) {
            nodes {
              id
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  productVariantsBulkUpdate: `#graphql
    mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          compareAtPrice
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  productUpdate: `#graphql
    mutation ProductUpdate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          title
          handle
          status
          onlineStoreUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  productSet: `#graphql
    mutation ProductSet(
      $input: ProductSetInput!
      $identifier: ProductSetIdentifiers
      $synchronous: Boolean
    ) {
      productSet(input: $input, identifier: $identifier, synchronous: $synchronous) {
        product {
          id
          title
          handle
          status
          onlineStoreUrl
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `,
  collectionAddProducts: `#graphql
    mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        userErrors {
          field
          message
        }
      }
    }
  `,
  collectionCreate: `#graphql
    mutation CollectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  collectionUpdate: `#graphql
    mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  pageCreate: `#graphql
    mutation PageCreate($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page {
          id
          title
          handle
          isPublished
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  pageUpdate: `#graphql
    mutation PageUpdate($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          title
          handle
          isPublished
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  productByHandle: `#graphql
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          onlineStoreUrl
          variants(first: 1) {
            nodes {
              id
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `,
  productMediaByHandle: `#graphql
    query ProductMediaByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          onlineStoreUrl
          media(first: 20) {
            nodes {
              mediaContentType
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `,
  collectionByHandle: `#graphql
    query CollectionByHandle($query: String!) {
      collections(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          availablePublicationsCount {
            count
          }
          products(first: 250) {
            nodes {
              id
            }
          }
        }
      }
    }
  `,
  pageByHandle: `#graphql
    query PageByHandle($query: String!) {
      pages(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          isPublished
        }
      }
    }
  `,
  publications: `#graphql
    query Publications($first: Int!) {
      publications(first: $first) {
        nodes {
          id
          name
        }
      }
    }
  `,
  publishablePublish: `#graphql
    mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
  metaobjectUpsert: `#graphql
    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
          type
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `,
  metaobjectDefinitions: `#graphql
    query MetaobjectDefinitions($first: Int!) {
      metaobjectDefinitions(first: $first) {
        nodes {
          id
          type
          name
          fieldDefinitions {
            key
          }
        }
      }
    }
  `,
  metaobjectDefinitionCreate: `#graphql
    mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
          fieldDefinitions {
            key
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `,
  metaobjectDefinitionUpdate: `#graphql
    mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
          fieldDefinitions {
            key
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `,
};

function normalizeMetaobjectType(type: string): string {
  return type.replace(/^\$app:/, "").replace(/^app--\d+--/, "");
}

function metaobjectTypeMatches(actualType: string, expectedType: string): boolean {
  return normalizeMetaobjectType(actualType) === normalizeMetaobjectType(expectedType);
}

async function shopifyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const accessToken = await getShopifyAccessToken();
  const response = await fetch(shopifyGraphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<Record<string, unknown>>;
  };

  if (payload.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }

  if (!payload.data) {
    throw new Error("Shopify response did not include data");
  }

  return payload.data;
}

async function getShopifyAccessToken(): Promise<string> {
  if (config.shopifyClientId && config.shopifyClientSecret) {
    if (
      cachedAccessToken &&
      Date.now() < cachedAccessTokenExpiresAt - 60_000
    ) {
      return cachedAccessToken;
    }

    const response = await fetch(shopifyTokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.shopifyClientId,
        client_secret: config.shopifyClientSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Shopify token HTTP ${response.status}: ${text}`);
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!payload.access_token) {
      throw new Error(
        `Shopify token response missing access_token: ${JSON.stringify(payload)}`,
      );
    }

    cachedAccessToken = payload.access_token;
    cachedAccessTokenExpiresAt =
      Date.now() + Math.max(payload.expires_in ?? 86_400, 60) * 1000;

    return cachedAccessToken;
  }

  if (config.shopifyAdminAccessToken) {
    return config.shopifyAdminAccessToken;
  }

  throw new Error(
    "Shopify auth is not configured: set SHOPIFY_ADMIN_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET",
  );
}

function assertNoUserErrors(step: string, userErrors: ShopifyUserError[]) {
  if (!userErrors.length) {
    return;
  }

  throw new Error(`${step} failed: ${JSON.stringify(userErrors)}`);
}

function isDuplicateHandleError(userErrors: ShopifyUserError[]): boolean {
  return userErrors.some((error) => {
    const fieldPath = (error.field ?? []).join(".");
    return (
      /already in use|already taken|has already been taken|must be unique/i.test(
        error.message,
      ) || /handle/i.test(fieldPath)
    );
  });
}

async function findExistingProductByHandle(
  handle: string,
): Promise<ShopifyProductRecord | null> {
  const data = await shopifyGraphQL<{
    products: {
      nodes: ShopifyProductWithDefaultVariant[];
    };
  }>(QUERIES.productByHandle, {
    query: `handle:${handle}`,
  });

  return data.products.nodes[0] ?? null;
}

async function findExistingProductWithDefaultVariantByHandle(
  handle: string,
): Promise<ShopifyProductWithDefaultVariant | null> {
  const data = await shopifyGraphQL<{
    products: {
      nodes: ShopifyProductWithDefaultVariant[];
    };
  }>(QUERIES.productByHandle, {
    query: `handle:${handle}`,
  });

  return data.products.nodes[0] ?? null;
}

async function findExistingCollectionByHandle(
  handle: string,
): Promise<ShopifyCollectionWithProductMembership | null> {
  const data = await shopifyGraphQL<{
    collections: {
      nodes: ShopifyCollectionWithProductMembership[];
    };
  }>(QUERIES.collectionByHandle, {
    query: `handle:${handle}`,
  });

  return data.collections.nodes[0] ?? null;
}

async function findExistingPageByHandle(handle: string): Promise<ShopifyPageRecord | null> {
  const data = await shopifyGraphQL<{
    pages: {
      nodes: ShopifyPageRecord[];
    };
  }>(QUERIES.pageByHandle, {
    query: `handle:${handle}`,
  });

  return data.pages.nodes[0] ?? null;
}

export async function getProductByHandle(handle: string) {
  return findExistingProductByHandle(handle);
}

export async function getCollectionByHandle(handle: string) {
  return findExistingCollectionByHandle(handle);
}

export async function getPageByHandle(handle: string) {
  return findExistingPageByHandle(handle);
}

export async function listMetaobjectDefinitions(): Promise<ShopifyMetaobjectDefinitionRecord[]> {
  const data = await shopifyGraphQL<{
    metaobjectDefinitions: {
      nodes: ShopifyMetaobjectDefinitionRecord[];
    };
  }>(QUERIES.metaobjectDefinitions, {
    first: 50,
  });

  return data.metaobjectDefinitions.nodes;
}

async function getOnlineStorePublicationId(): Promise<string | null> {
  const data = await shopifyGraphQL<{
    publications: {
      nodes: Array<{
        id: string;
        name: string;
      }>;
    };
  }>(QUERIES.publications, { first: 20 });

  const onlineStorePublication = data.publications.nodes.find((node) =>
    /online store/i.test(node.name),
  );

  return onlineStorePublication?.id ?? null;
}

export async function publishResource(id: string): Promise<boolean> {
  const publicationId = await getOnlineStorePublicationId();

  if (!publicationId) {
    return false;
  }

  const data = await shopifyGraphQL<{
    publishablePublish: {
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.publishablePublish, {
    id,
    input: [{ publicationId }],
  });

  assertNoUserErrors("publishablePublish", data.publishablePublish.userErrors);
  return true;
}

async function updateDefaultVariantPricing(
  productId: string,
  variantId: string,
  price: string,
  compareAtPrice?: string,
) {
  const data = await shopifyGraphQL<ProductVariantsBulkUpdateResponse>(
    QUERIES.productVariantsBulkUpdate,
    {
      productId,
      variants: [
        {
          id: variantId,
          price,
          compareAtPrice,
        },
      ],
    },
  );

  assertNoUserErrors(
    "productVariantsBulkUpdate",
    data.productVariantsBulkUpdate.userErrors,
  );
}

async function updateProductStatus(
  productId: string,
  status: "ACTIVE" | "DRAFT",
): Promise<ShopifyProductRecord> {
  const data = await shopifyGraphQL<ProductUpdateResponse>(QUERIES.productUpdate, {
    product: {
      id: productId,
      status,
    },
  });

  assertNoUserErrors("productUpdate", data.productUpdate.userErrors);

  if (!data.productUpdate.product) {
    throw new Error("Product update returned null product");
  }

  return data.productUpdate.product;
}

export async function createProduct(
  product: ProductPayload,
  options?: {
    publish?: boolean;
  },
): Promise<ShopifyProductRecord> {
  const data = await shopifyGraphQL<ProductCreateResponse>(QUERIES.productCreate, {
    product: {
      title: product.title,
      handle: product.handle,
      descriptionHtml: product.descriptionHtml,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      status: product.status,
      seo: {
        title: product.seoTitle,
        description: product.seoDescription,
      },
    },
    media: [],
  });

  if (isDuplicateHandleError(data.productCreate.userErrors)) {
    const existingProduct = await findExistingProductByHandle(product.handle);

    if (existingProduct) {
      return (
        await enrichPublishedProductByHandle({
          handle: product.handle,
          title: product.title,
          descriptionHtml: product.descriptionHtml,
          productType: product.productType,
          tags: product.tags,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          collectionHandles: product.collections,
          publish: options?.publish ?? product.status === "ACTIVE",
        })
      ).product;
    }
  }

  assertNoUserErrors("productCreate", data.productCreate.userErrors);

  const createdProduct = data.productCreate.product;
  if (!createdProduct) {
    throw new Error("Product creation returned null product");
  }

  const defaultVariantId = createdProduct.variants.nodes[0]?.id;
  if (!defaultVariantId) {
    throw new Error(`Product ${createdProduct.handle} did not return a default variant`);
  }

  await updateDefaultVariantPricing(
    createdProduct.id,
    defaultVariantId,
    product.price,
    product.compareAtPrice,
  );

  if (options?.publish ?? product.status === "ACTIVE") {
    await publishResource(createdProduct.id);
  }

  return {
    id: createdProduct.id,
    title: createdProduct.title,
    handle: createdProduct.handle,
    status: createdProduct.status,
    onlineStoreUrl: createdProduct.onlineStoreUrl,
  };
}

export async function createCollection(
  collection: CollectionPayload,
  options?: {
    productIds?: string[];
    publish?: boolean;
  },
): Promise<{
  collection: ShopifyCollectionRecord;
  published: boolean;
}> {
  const data = await shopifyGraphQL<{
    collectionCreate: {
      collection: ShopifyCollectionRecord | null;
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.collectionCreate, {
    input: {
      title: collection.title,
      handle: collection.handle,
      descriptionHtml: collection.descriptionHtml,
      seo: {
        title: collection.seoTitle,
        description: collection.seoDescription,
      },
      products: options?.productIds,
    },
  });

  if (isDuplicateHandleError(data.collectionCreate.userErrors)) {
    const existingCollection = await findExistingCollectionByHandle(collection.handle);

    if (existingCollection) {
      const updatedCollection = await shopifyGraphQL<CollectionUpdateResponse>(
        QUERIES.collectionUpdate,
        {
          input: {
            id: existingCollection.id,
            title: collection.title,
            handle: collection.handle,
            descriptionHtml: collection.descriptionHtml,
            seo: {
              title: collection.seoTitle,
              description: collection.seoDescription,
            },
          },
        },
      ).then((result) => {
        assertNoUserErrors("collectionUpdate", result.collectionUpdate.userErrors);

        if (!result.collectionUpdate.collection) {
          throw new Error("Collection update returned null collection");
        }

        return result.collectionUpdate.collection;
      });
      const published = options?.publish ? await publishResource(updatedCollection.id) : false;

      return {
        collection: updatedCollection,
        published,
      };
    }
  }

  assertNoUserErrors("collectionCreate", data.collectionCreate.userErrors);

  const createdCollection = data.collectionCreate.collection;
  if (!createdCollection) {
    throw new Error("Collection creation returned null collection");
  }

  const published = options?.publish ? await publishResource(createdCollection.id) : false;

  return {
    collection: createdCollection,
    published,
  };
}

export async function createPage(page: PagePayload): Promise<ShopifyPageRecord> {
  const data = await shopifyGraphQL<{
    pageCreate: {
      page: ShopifyPageRecord | null;
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.pageCreate, {
    page: {
      title: page.title,
      handle: page.handle,
      body: page.bodyHtml,
      isPublished: true,
    },
  });

  if (isDuplicateHandleError(data.pageCreate.userErrors)) {
    const existingPage = await findExistingPageByHandle(page.handle);

    if (existingPage) {
      return await shopifyGraphQL<PageUpdateResponse>(QUERIES.pageUpdate, {
        id: existingPage.id,
        page: {
          title: page.title,
          handle: page.handle,
          body: page.bodyHtml,
          isPublished: true,
        },
      }).then((result) => {
        assertNoUserErrors("pageUpdate", result.pageUpdate.userErrors);

        if (!result.pageUpdate.page) {
          throw new Error("Page update returned null page");
        }

        return result.pageUpdate.page;
      });
    }
  }

  assertNoUserErrors("pageCreate", data.pageCreate.userErrors);

  const createdPage = data.pageCreate.page;
  if (!createdPage) {
    throw new Error("Page creation returned null page");
  }

  return createdPage;
}

export async function retireProductByHandle(
  handle: string,
): Promise<RetiredProductResult> {
  const existingProduct = await findExistingProductByHandle(handle);

  if (!existingProduct) {
    return {
      handle,
      found: false,
      retired: false,
    };
  }

  const updatedProduct =
    existingProduct.status === "DRAFT"
      ? existingProduct
      : await updateProductStatus(existingProduct.id, "DRAFT");

  return {
    handle,
    found: true,
    retired: true,
    product: {
      ...updatedProduct,
      status: "DRAFT",
    },
  };
}

async function addProductToCollectionByHandle(
  productId: string,
  collectionHandle: string,
): Promise<void> {
  const collection = await findExistingCollectionByHandle(collectionHandle);

  if (!collection) {
    throw new Error(`Collection not found for handle: ${collectionHandle}`);
  }

  if (collection.products?.nodes.some((product) => product.id === productId)) {
    return;
  }

  await addProductsToCollection(collection.id, [productId]);
}

async function addProductsToCollection(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  if (!productIds.length) {
    return;
  }

  const data = await shopifyGraphQL<{
    collectionAddProducts: {
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.collectionAddProducts, {
    id: collectionId,
    productIds: Array.from(new Set(productIds)),
  });

  const nonDuplicateErrors = data.collectionAddProducts.userErrors.filter(
    (error) => !/already exists|already added|already associated/i.test(error.message),
  );

  assertNoUserErrors("collectionAddProducts", nonDuplicateErrors);
}

function normalizeMediaUrls(mediaUrls: string[] | undefined): string[] {
  if (!mediaUrls?.length) {
    return [];
  }

  const uniqueMediaUrls = new Set<string>();

  for (const mediaUrl of mediaUrls) {
    const trimmedMediaUrl = mediaUrl.trim();
    if (!trimmedMediaUrl) {
      continue;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedMediaUrl);
    } catch {
      continue;
    }

    if (!/^https?:$/i.test(parsedUrl.protocol)) {
      continue;
    }

    uniqueMediaUrls.add(parsedUrl.toString());
  }

  return Array.from(uniqueMediaUrls);
}

function guessProductMediaExtension(mediaUrl: string): string {
  try {
    const pathname = new URL(mediaUrl).pathname.toLowerCase();
    const extensionMatch = pathname.match(/\.(avif|gif|heic|jpe?g|png|svg|webp)$/i);
    if (extensionMatch) {
      return extensionMatch[0];
    }
  } catch {
    return ".jpg";
  }

  return ".jpg";
}

function buildProductSetFiles(handle: string, mediaUrls: string[], alt: string) {
  return mediaUrls.map((mediaUrl, index) => ({
    alt,
    contentType: "IMAGE",
    duplicateResolutionMode: "REPLACE",
    filename: `${handle}-${String(index + 1).padStart(2, "0")}${guessProductMediaExtension(
      mediaUrl,
    )}`,
    originalSource: mediaUrl,
  }));
}

export async function getProductMediaUrlsByHandle(handle: string, limit = 10) {
  const data = await shopifyGraphQL<{
    products: {
      nodes: ShopifyProductWithMedia[];
    };
  }>(QUERIES.productMediaByHandle, {
    query: `handle:${handle}`,
  });

  const product = data.products.nodes[0] ?? null;

  if (!product) {
    return {
      product: null,
      mediaUrls: [],
      mediaAlt: undefined,
    };
  }

  const mediaUrls = normalizeMediaUrls(
    product.media.nodes.flatMap((node) => {
      const mediaUrl = node.image?.url?.trim();
      return mediaUrl ? [mediaUrl] : [];
    }),
  ).slice(0, limit);

  const mediaAlt =
    product.media.nodes.find(
      (node) => typeof node.image?.altText === "string" && node.image.altText.trim().length > 0,
    )?.image?.altText?.trim() ?? product.title;

  return {
    product,
    mediaUrls,
    mediaAlt,
  };
}

export async function enrichPublishedProductByHandle(
  input: ShopifyEnrichProductInput,
): Promise<ShopifyEnrichProductResult> {
  const existingProduct = await findExistingProductByHandle(input.handle);

  if (!existingProduct) {
    throw new Error(`Product not found for handle: ${input.handle}`);
  }

  const shouldUpdateFields =
    input.title !== undefined ||
    input.descriptionHtml !== undefined ||
    input.productType !== undefined ||
    input.tags !== undefined ||
    input.seoTitle !== undefined ||
    input.seoDescription !== undefined;

  const mediaUrls = normalizeMediaUrls(input.mediaUrls);
  const shouldSyncMedia = mediaUrls.length > 0;
  const shouldUpdatePricing = input.price !== undefined || input.compareAtPrice !== undefined;
  const productInput = {
    title: input.title,
    descriptionHtml: input.descriptionHtml,
    productType: input.productType,
    tags: input.tags,
    seo:
      input.seoTitle || input.seoDescription
        ? {
            title: input.seoTitle,
            description: input.seoDescription,
          }
        : undefined,
  };

  const updatedProduct = shouldSyncMedia
    ? await shopifyGraphQL<ProductSetResponse>(QUERIES.productSet, {
        synchronous: true,
        identifier: {
          id: existingProduct.id,
        },
        input: {
          ...productInput,
          files: buildProductSetFiles(
            existingProduct.handle,
            mediaUrls,
            input.mediaAlt ?? input.title ?? existingProduct.title,
          ),
        },
      }).then((data) => {
        assertNoUserErrors("productSet", data.productSet.userErrors);

        if (!data.productSet.product) {
          throw new Error("Product set returned null product");
        }

        return data.productSet.product;
      })
    : shouldUpdateFields
      ? await shopifyGraphQL<ProductUpdateResponse>(QUERIES.productUpdate, {
          product: {
            id: existingProduct.id,
            ...productInput,
          },
        }).then((data) => {
          assertNoUserErrors("productUpdate", data.productUpdate.userErrors);

          if (!data.productUpdate.product) {
            throw new Error("Product update returned null product");
          }

          return data.productUpdate.product;
        })
      : existingProduct;

    if (shouldUpdatePricing) {
      const productWithDefaultVariant = await findExistingProductWithDefaultVariantByHandle(
        input.handle,
      );
      const defaultVariant = productWithDefaultVariant?.variants.nodes[0];

      if (!defaultVariant) {
        throw new Error(`Product ${input.handle} did not return a default variant`);
      }

      await updateDefaultVariantPricing(
        updatedProduct.id,
        defaultVariant.id,
        input.price ?? defaultVariant.price,
        input.compareAtPrice ?? defaultVariant.compareAtPrice ?? undefined,
      );
    }

  const collectionHandles = input.collectionHandles ?? [];
  for (const collectionHandle of collectionHandles) {
    await addProductToCollectionByHandle(updatedProduct.id, collectionHandle);
  }

  const published = input.publish === true ? await publishResource(updatedProduct.id) : false;

  return {
    product: published
      ? {
          ...updatedProduct,
          status: "ACTIVE",
        }
      : updatedProduct,
    collectionHandles,
    published,
  };
}

export async function upsertMetaobject(
  metaobject: LaunchMetaobjectSeed,
): Promise<ShopifyMetaobjectRecord> {
  const data = await shopifyGraphQL<{
    metaobjectUpsert: {
      metaobject: ShopifyMetaobjectRecord | null;
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.metaobjectUpsert, {
    handle: {
      type: metaobject.type,
      handle: metaobject.handle,
    },
    metaobject: {
      fields: metaobject.fields,
    },
  });

  assertNoUserErrors("metaobjectUpsert", data.metaobjectUpsert.userErrors);

  const upsertedMetaobject = data.metaobjectUpsert.metaobject;
  if (!upsertedMetaobject) {
    throw new Error("Metaobject upsert returned null metaobject");
  }

  return upsertedMetaobject;
}

export async function ensureMetaobjectDefinitions(
  definitions: MetaobjectDefinitionSpec[],
): Promise<{
  created: ShopifyMetaobjectDefinitionRecord[];
  updated: ShopifyMetaobjectDefinitionRecord[];
  existing: ShopifyMetaobjectDefinitionRecord[];
}> {
  const existingDefinitions = await listMetaobjectDefinitions();
  const created: ShopifyMetaobjectDefinitionRecord[] = [];
  const updated: ShopifyMetaobjectDefinitionRecord[] = [];
  const existing: ShopifyMetaobjectDefinitionRecord[] = [];

  for (const definition of definitions) {
    const currentDefinition = existingDefinitions.find((entry) =>
      metaobjectTypeMatches(entry.type, definition.type),
    );
    if (currentDefinition) {
      const existingFieldKeys = new Set((currentDefinition.fieldDefinitions ?? []).map((field) => field.key));
      const missingFields = definition.fieldDefinitions.filter(
        (fieldDefinition) => !existingFieldKeys.has(fieldDefinition.key),
      );

      if (!missingFields.length) {
        existing.push(currentDefinition);
        continue;
      }

      const updateResult = await shopifyGraphQL<MetaobjectDefinitionUpdateResponse>(
        QUERIES.metaobjectDefinitionUpdate,
        {
          id: currentDefinition.id,
          definition: {
            name: definition.name,
            description: definition.description,
            displayNameKey: definition.displayNameKey,
            access: definition.access,
            fieldDefinitions: missingFields.map((fieldDefinition) => ({
              create: fieldDefinition,
            })),
          },
        },
      );

      assertNoUserErrors(
        "metaobjectDefinitionUpdate",
        updateResult.metaobjectDefinitionUpdate.userErrors,
      );

      if (!updateResult.metaobjectDefinitionUpdate.metaobjectDefinition) {
        throw new Error(`Metaobject definition update returned null for type: ${definition.type}`);
      }

      updated.push(updateResult.metaobjectDefinitionUpdate.metaobjectDefinition);
      continue;
    }

    const data = await shopifyGraphQL<MetaobjectDefinitionCreateResponse>(
      QUERIES.metaobjectDefinitionCreate,
      {
        definition: {
          type: definition.type,
          name: definition.name,
          description: definition.description,
          displayNameKey: definition.displayNameKey,
          access: definition.access,
          fieldDefinitions: definition.fieldDefinitions,
        },
      },
    );

    assertNoUserErrors("metaobjectDefinitionCreate", data.metaobjectDefinitionCreate.userErrors);

    if (!data.metaobjectDefinitionCreate.metaobjectDefinition) {
      throw new Error(`Metaobject definition creation returned null for type: ${definition.type}`);
    }

    created.push(data.metaobjectDefinitionCreate.metaobjectDefinition);
    existingDefinitions.push(data.metaobjectDefinitionCreate.metaobjectDefinition);
  }

  return {
    created,
    updated,
    existing,
  };
}
