import { config } from "./config.js";
import type {
  CollectionPayload,
  LaunchMetaobjectSeed,
  PagePayload,
  ProductPayload,
  RetiredProductResult,
  ShopifyEnrichProductInput,
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
  collectionAddProducts: `#graphql
    mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        job {
          id
        }
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
  productByHandle: `#graphql
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          onlineStoreUrl
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
};

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
      nodes: ShopifyProductRecord[];
    };
  }>(QUERIES.productByHandle, {
    query: `handle:${handle}`,
  });

  return data.products.nodes[0] ?? null;
}

async function findExistingCollectionByHandle(
  handle: string,
): Promise<(ShopifyCollectionRecord & { availablePublicationsCount?: { count: number } }) | null> {
  const data = await shopifyGraphQL<{
    collections: {
      nodes: Array<
        ShopifyCollectionRecord & {
          availablePublicationsCount?: {
            count: number;
          };
        }
      >;
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
      if (options?.publish || product.status === "ACTIVE") {
        const updatedProduct =
          existingProduct.status === "ACTIVE"
            ? existingProduct
            : await updateProductStatus(existingProduct.id, "ACTIVE");

        await publishResource(updatedProduct.id);
        return {
          ...updatedProduct,
          status: "ACTIVE",
        };
      }

      return existingProduct;
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
      const published = options?.publish ? await publishResource(existingCollection.id) : false;

      return {
        collection: existingCollection,
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
      return existingPage;
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

  const data = await shopifyGraphQL<{
    collectionAddProducts: {
      userErrors: ShopifyUserError[];
    };
  }>(QUERIES.collectionAddProducts, {
    id: collection.id,
    productIds: [productId],
  });

  const nonDuplicateErrors = data.collectionAddProducts.userErrors.filter(
    (error) => !/already exists|already added|already associated/i.test(error.message),
  );

  assertNoUserErrors("collectionAddProducts", nonDuplicateErrors);
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

  const updatedProduct = shouldUpdateFields
    ? await shopifyGraphQL<ProductUpdateResponse>(QUERIES.productUpdate, {
        product: {
          id: existingProduct.id,
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
        },
      }).then((data) => {
        assertNoUserErrors("productUpdate", data.productUpdate.userErrors);

        if (!data.productUpdate.product) {
          throw new Error("Product update returned null product");
        }

        return data.productUpdate.product;
      })
    : existingProduct;

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
