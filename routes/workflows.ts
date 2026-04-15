import { Router } from "express";

import { getLaunchCatalog, listLaunchCatalogs } from "../data/launchCatalog.js";
import { getSourcingPlan } from "../data/sourcingPlan.js";
import { getLaunchStrategy } from "../data/launchStrategy.js";
import { generateLaunchCatalogAssets } from "../openai.js";
import {
  createCollection,
  createPage,
  createProduct,
  getCollectionByHandle,
  getPageByHandle,
  getProductByHandle,
  retireProductByHandle,
  upsertMetaobject,
} from "../shopify.js";
import {
  getZendropConnectionStatus,
  zendropAddToImportList,
  zendropLinkExistingProduct,
  zendropPublishToShopify,
  zendropSearchProducts,
  zendropSyncLinkedProductAssets,
} from "../zendrop.js";
import type {
  LaunchReadinessCheck,
  LaunchCatalogAssets,
  LaunchCatalogSeed,
  LaunchCatalogWorkflowResult,
  WorkflowWarning,
} from "../types.js";

const LEGACY_PRODUCT_HANDLES = ["unisex-t-shirt", "unisex-t-shirt-1"];

function resolveCatalogFromBody(body: {
  catalogKey?: unknown;
}): LaunchCatalogSeed {
  const catalogKey =
    typeof body?.catalogKey === "string" ? body.catalogKey : undefined;
  return getLaunchCatalog(catalogKey);
}

function resolvePublishFlag(body: {
  publish?: unknown;
}): boolean {
  return body?.publish === true;
}

function resolveProductIdMap(body: {
  productIdByHandle?: unknown;
}): Record<string, string> {
  if (!body?.productIdByHandle || typeof body.productIdByHandle !== "object") {
    return {};
  }

  return Object.entries(body.productIdByHandle as Record<string, unknown>).reduce<
    Record<string, string>
  >((accumulator, [handle, id]) => {
    if (typeof id === "string" && id.length > 0) {
      accumulator[handle] = id;
    }

    return accumulator;
  }, {});
}

function resolveStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolvePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return undefined;
  }

  return value;
}

async function runLaunchCatalogWorkflow(
  seed: LaunchCatalogSeed,
  options: {
    publish: boolean;
    includeProducts?: boolean;
    includeCollections?: boolean;
    includePages?: boolean;
    includeMetaobjects?: boolean;
    productIdByHandle?: Record<string, string>;
  },
): Promise<LaunchCatalogWorkflowResult> {
  const assets = await generateLaunchCatalogAssets(seed, {
    publish: options.publish,
  });
  const warnings: WorkflowWarning[] = [];

  const createdProducts = [];
  const createdPages = [];
  const createdCollections = [];
  const createdMetaobjects = [];
  const productIdByHandle = { ...(options.productIdByHandle ?? {}) };

  if (options.includeProducts !== false) {
    for (const product of assets.products) {
      const createdProduct = await createProduct(product, {
        publish: options.publish,
      });

      createdProducts.push(createdProduct);
      productIdByHandle[product.handle] = createdProduct.id;
    }
  }

  if (options.includeCollections !== false) {
    for (const collection of assets.collections) {
      const missingProductHandles = collection.productHandles.filter(
        (handle) => !productIdByHandle[handle],
      );

      if (missingProductHandles.length) {
        warnings.push({
          step: "create_collections",
          message: `Collection ${collection.handle} is missing product IDs for: ${missingProductHandles.join(
            ", ",
          )}`,
        });
      }

      const productIds = collection.productHandles
        .map((handle) => productIdByHandle[handle])
        .filter((value): value is string => Boolean(value));

      const createdCollection = await createCollection(collection, {
        productIds,
        publish: options.publish,
      });

      createdCollections.push({
        ...createdCollection.collection,
        addProductsJobId: null,
        published: createdCollection.published,
      });
    }
  }

  if (options.includePages !== false) {
    for (const page of assets.pages) {
      createdPages.push(await createPage(page));
    }
  }

  if (options.includeMetaobjects !== false) {
    for (const metaobject of assets.metaobjects) {
      try {
        createdMetaobjects.push(await upsertMetaobject(metaobject));
      } catch (error) {
        if (!metaobject.optional) {
          throw error;
        }

        warnings.push({
          step: "create_metaobjects",
          message: `Skipped optional metaobject ${metaobject.type}/${metaobject.handle}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });

        createdMetaobjects.push({
          type: metaobject.type,
          handle: metaobject.handle,
          skipped: true as const,
        });
      }
    }
  }

  return {
    assets,
    products: createdProducts,
    collections: createdCollections,
    pages: createdPages,
    metaobjects: createdMetaobjects,
    warnings,
  };
}

function sliceAssets(assets: LaunchCatalogAssets, key: "collections" | "pages" | "products") {
  return {
    [key]: assets[key],
  };
}

export const workflowsRouter = Router();

workflowsRouter.get("/launch-strategy", (_request, response) => {
  response.json({
    strategy: getLaunchStrategy(),
  });
});

workflowsRouter.get("/zendrop-status", async (_request, response) => {
  try {
    response.json({
      zendrop: await getZendropConnectionStatus(),
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.get("/sourcing-plan", (_request, response) => {
  response.json({
    sourcingPlan: getSourcingPlan(),
  });
});

workflowsRouter.get("/catalogs", (_request, response) => {
  response.json({
    catalogs: listLaunchCatalogs(),
  });
});

workflowsRouter.post("/bootstrap-store", async (request, response) => {
  try {
    const seed = resolveCatalogFromBody(request.body as { catalogKey?: unknown });
    const publish = resolvePublishFlag(request.body as { publish?: unknown });

    const result = await runLaunchCatalogWorkflow(seed, {
      publish,
    });

    response.json({
      workflow: "bootstrap_store",
      catalogKey: seed.key,
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/create-launch-catalog", async (request, response) => {
  try {
    const seed = resolveCatalogFromBody(request.body as { catalogKey?: unknown });
    const publish = resolvePublishFlag(request.body as { publish?: unknown });

    const result = await runLaunchCatalogWorkflow(seed, {
      publish,
    });

    response.json({
      workflow: "create_launch_catalog",
      catalogKey: seed.key,
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/create-policy-pages", async (request, response) => {
  try {
    const seed = resolveCatalogFromBody(request.body as { catalogKey?: unknown });
    const publish = resolvePublishFlag(request.body as { publish?: unknown });

    const result = await runLaunchCatalogWorkflow(seed, {
      publish,
      includeProducts: false,
      includeCollections: false,
      includeMetaobjects: false,
    });

    response.json({
      workflow: "create_policy_pages",
      catalogKey: seed.key,
      assets: sliceAssets(result.assets, "pages"),
      pages: result.pages,
      warnings: result.warnings,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/create-collections", async (request, response) => {
  try {
    const seed = resolveCatalogFromBody(request.body as { catalogKey?: unknown });
    const publish = resolvePublishFlag(request.body as { publish?: unknown });
    const productIdByHandle = resolveProductIdMap(
      request.body as { productIdByHandle?: unknown },
    );

    const result = await runLaunchCatalogWorkflow(seed, {
      publish,
      includeProducts: false,
      includePages: false,
      includeMetaobjects: false,
      productIdByHandle,
    });

    response.json({
      workflow: "create_collections",
      catalogKey: seed.key,
      assets: sliceAssets(result.assets, "collections"),
      collections: result.collections,
      warnings: result.warnings,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/retire-products", async (request, response) => {
  try {
    const body = request.body as {
      handles?: unknown;
    };

    const handles = Array.isArray(body?.handles)
      ? body.handles.filter((value): value is string => typeof value === "string")
      : LEGACY_PRODUCT_HANDLES;

    const results = [];

    for (const handle of handles) {
      results.push(await retireProductByHandle(handle));
    }

    response.json({
      workflow: "retire_products",
      handles,
      results,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/zendrop-search-products", async (request, response) => {
  try {
    const body = request.body as {
      query?: unknown;
      market?: unknown;
      limit?: unknown;
    };

    if (typeof body?.query !== "string" || body.query.trim().length === 0) {
      return response.status(400).json({
        error: "Missing query",
      });
    }

    const result = await zendropSearchProducts({
      query: body.query,
      market: typeof body.market === "string" ? body.market : "US",
      limit: typeof body.limit === "number" ? body.limit : 10,
    });

    response.json({
      workflow: "zendrop_search_products",
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/zendrop-add-to-import-list", async (request, response) => {
  try {
    const body = request.body as {
      productId?: unknown;
      handle?: unknown;
      title?: unknown;
    };

    const result = await zendropAddToImportList({
      productId: typeof body.productId === "string" ? body.productId : undefined,
      handle: typeof body.handle === "string" ? body.handle : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
    });

    response.json({
      workflow: "zendrop_add_to_import_list",
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/zendrop-link-existing-product", async (request, response) => {
  try {
    const body = request.body as {
      storeProductId?: unknown;
      productId?: unknown;
      handle?: unknown;
      title?: unknown;
      confirmationToken?: unknown;
      storeVariantId?: unknown;
      catalogVariantId?: unknown;
    };

    const result = await zendropLinkExistingProduct({
      storeProductId:
        typeof body.storeProductId === "string" ? body.storeProductId : undefined,
      productId: typeof body.productId === "string" ? body.productId : undefined,
      handle: typeof body.handle === "string" ? body.handle : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      confirmationToken:
        typeof body.confirmationToken === "string" ? body.confirmationToken : undefined,
      storeVariantId:
        typeof body.storeVariantId === "string" ? body.storeVariantId : undefined,
      catalogVariantId:
        typeof body.catalogVariantId === "string" ? body.catalogVariantId : undefined,
    });

    response.json({
      workflow: "zendrop_link_existing_product",
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/zendrop-publish-to-shopify", async (request, response) => {
  try {
    const body = request.body as {
      productId?: unknown;
      importListItemId?: unknown;
      handle?: unknown;
    };

    const result = await zendropPublishToShopify({
      productId: typeof body.productId === "string" ? body.productId : undefined,
      importListItemId:
        typeof body.importListItemId === "string" ? body.importListItemId : undefined,
      handle: typeof body.handle === "string" ? body.handle : undefined,
    });

    response.json({
      workflow: "zendrop_publish_to_shopify",
      ...result,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.post("/zendrop-sync-linked-product-assets", async (request, response) => {
  try {
    const body = request.body as {
      catalogKey?: unknown;
      handle?: unknown;
      handles?: unknown;
      title?: unknown;
      productId?: unknown;
      importListItemId?: unknown;
      publish?: unknown;
      maxImages?: unknown;
    };

    const seed = resolveCatalogFromBody(body);
    const requestedHandles = new Set<string>();

    if (typeof body.handle === "string" && body.handle.trim().length > 0) {
      requestedHandles.add(body.handle.trim());
    }

    for (const handle of resolveStringList(body.handles)) {
      requestedHandles.add(handle);
    }

    const handles = requestedHandles.size
      ? Array.from(requestedHandles)
      : seed.products.map((product) => product.handle);
    const publish = body.publish === true;
    const maxImages = resolvePositiveInteger(body.maxImages);
    const productId = typeof body.productId === "string" ? body.productId : undefined;
    const importListItemId =
      typeof body.importListItemId === "string" ? body.importListItemId : undefined;
    const title = typeof body.title === "string" ? body.title : undefined;
    const results = [];
    const errors = [];

    for (const handle of handles) {
      const catalogProduct = seed.products.find((product) => product.handle === handle);

      try {
        results.push(
          await zendropSyncLinkedProductAssets({
            handle,
            title: handles.length === 1 ? title ?? catalogProduct?.title : catalogProduct?.title,
            publish,
            maxImages,
            productId: handles.length === 1 ? productId : undefined,
            importListItemId: handles.length === 1 ? importListItemId : undefined,
          }),
        );
      } catch (error) {
        errors.push({
          handle,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    response.status(errors.length ? (results.length ? 207 : 500) : 200).json({
      workflow: "zendrop_sync_linked_product_assets",
      catalogKey: seed.key,
      handles,
      publish,
      maxImages: maxImages ?? null,
      results,
      errors,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

workflowsRouter.get("/launch-readiness", async (_request, response) => {
  try {
    const strategy = getLaunchStrategy();
    const sourcingPlan = getSourcingPlan();
    const catalog = getLaunchCatalog(undefined);

    const productChecks = await Promise.all(
      catalog.products.map(async (product) => {
        const record = await getProductByHandle(product.handle);
        return {
          handle: product.handle,
          exists: Boolean(record),
          active: record?.status === "ACTIVE",
          title: record?.title ?? product.title,
        };
      }),
    );

    const collectionChecks = await Promise.all(
      catalog.collections.map(async (collection) => {
        const record = await getCollectionByHandle(collection.handle);
        const publicationCount = record?.availablePublicationsCount?.count ?? 0;
        return {
          handle: collection.handle,
          exists: Boolean(record),
          published: publicationCount > 0,
          title: record?.title ?? collection.title,
        };
      }),
    );

    const pageChecks = await Promise.all(
      catalog.pages.map(async (page) => {
        const record = await getPageByHandle(page.handle);
        return {
          handle: page.handle,
          exists: Boolean(record),
          published: record?.isPublished === true,
          title: record?.title ?? page.title,
        };
      }),
    );

    const legacyChecks = await Promise.all(
      strategy.cleanup.retireProductHandles.map(async (handle) => {
        const record = await getProductByHandle(handle);
        return {
          handle,
          retired: !record || record.status === "DRAFT",
          status: record?.status ?? "missing",
        };
      }),
    );

    const checks: LaunchReadinessCheck[] = [
      {
        area: "catalog",
        status: productChecks.every((item) => item.exists && item.active) ? "ready" : "in-progress",
        details: `${productChecks.filter((item) => item.exists && item.active).length}/${productChecks.length} launch products are active in Shopify.`,
      },
      {
        area: "collections",
        status: collectionChecks.every((item) => item.exists && item.published) ? "ready" : "in-progress",
        details: `${collectionChecks.filter((item) => item.exists && item.published).length}/${collectionChecks.length} launch collections are published.`,
      },
      {
        area: "pages",
        status: pageChecks.every((item) => item.exists && item.published) ? "ready" : "in-progress",
        details: `${pageChecks.filter((item) => item.exists && item.published).length}/${pageChecks.length} launch pages are published.`,
      },
      {
        area: "legacy-cleanup",
        status: legacyChecks.every((item) => item.retired) ? "ready" : "in-progress",
        details: `${legacyChecks.filter((item) => item.retired).length}/${legacyChecks.length} legacy products are retired from storefront visibility.`,
      },
      {
        area: "supplier-connections",
        status: "manual",
        details: `${sourcingPlan.requiredManualConnections.length} supplier connection steps still require logging into Zendrop, Spocket, or CJdropshipping and installing apps in Shopify.`,
      },
      {
        area: "theme-and-logo",
        status: "manual",
        details: "Homepage layout, navigation wiring, and logo replacement still require theme customization or an app/theme deployment path.",
      },
      {
        area: "apps-and-retention",
        status: "manual",
        details: `${strategy.apps.length} recommended apps/flows still need merchant-side installation and configuration.`,
      },
    ];

    response.json({
      strategy,
      sourcingPlan,
      checks,
      products: productChecks,
      collections: collectionChecks,
      pages: pageChecks,
      legacyProducts: legacyChecks,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
