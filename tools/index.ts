import type OpenAI from "openai";

import {
  CREATE_COLLECTION_TOOL_NAME,
  createCollectionTool,
  handleCreateCollection,
} from "./createCollection.js";
import {
  CREATE_METAOBJECT_TOOL_NAME,
  createMetaobjectTool,
  handleCreateMetaobject,
} from "./createMetaobject.js";
import {
  CREATE_PAGE_TOOL_NAME,
  createPageTool,
  handleCreatePage,
} from "./createPage.js";
import {
  CREATE_PRODUCT_TOOL_NAME,
  createProductTool,
  handleCreateProduct,
} from "./createProduct.js";
import {
  RETIRE_PRODUCT_TOOL_NAME,
  handleRetireProduct,
  retireProductTool,
} from "./retireProduct.js";
import {
  SHOPIFY_ENRICH_PUBLISHED_PRODUCT_TOOL_NAME,
  handleShopifyEnrichPublishedProduct,
  shopifyEnrichPublishedProductTool,
} from "./shopifyEnrichPublishedProduct.js";
import {
  ZENDROP_ADD_TO_IMPORT_LIST_TOOL_NAME,
  handleZendropAddToImportList,
  zendropAddToImportListTool,
} from "./zendropAddToImportList.js";
import {
  ZENDROP_PUBLISH_TO_SHOPIFY_TOOL_NAME,
  handleZendropPublishToShopify,
  zendropPublishToShopifyTool,
} from "./zendropPublishToShopify.js";
import {
  ZENDROP_SEARCH_PRODUCTS_TOOL_NAME,
  handleZendropSearchProducts,
  zendropSearchProductsTool,
} from "./zendropSearchProducts.js";

export const toolDefinitions: OpenAI.Responses.FunctionTool[] = [
  createProductTool,
  createCollectionTool,
  createPageTool,
  createMetaobjectTool,
  retireProductTool,
  zendropSearchProductsTool,
  zendropAddToImportListTool,
  zendropPublishToShopifyTool,
  shopifyEnrichPublishedProductTool,
];

export async function executeToolCall(toolName: string, input: unknown) {
  switch (toolName) {
    case CREATE_PRODUCT_TOOL_NAME:
      return handleCreateProduct(input);
    case CREATE_COLLECTION_TOOL_NAME:
      return handleCreateCollection(input);
    case CREATE_PAGE_TOOL_NAME:
      return handleCreatePage(input);
    case CREATE_METAOBJECT_TOOL_NAME:
      return handleCreateMetaobject(input);
    case RETIRE_PRODUCT_TOOL_NAME:
      return handleRetireProduct(input);
    case ZENDROP_SEARCH_PRODUCTS_TOOL_NAME:
      return handleZendropSearchProducts(input);
    case ZENDROP_ADD_TO_IMPORT_LIST_TOOL_NAME:
      return handleZendropAddToImportList(input);
    case ZENDROP_PUBLISH_TO_SHOPIFY_TOOL_NAME:
      return handleZendropPublishToShopify(input);
    case SHOPIFY_ENRICH_PUBLISHED_PRODUCT_TOOL_NAME:
      return handleShopifyEnrichPublishedProduct(input);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
