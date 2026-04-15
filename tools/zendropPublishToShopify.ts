import type OpenAI from "openai";

import { zendropPublishToShopify } from "../zendrop.js";
import { readOptionalString, readRecord } from "./validators.js";

export const ZENDROP_PUBLISH_TO_SHOPIFY_TOOL_NAME = "zendrop_publish_to_shopify";

export const zendropPublishToShopifyTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: ZENDROP_PUBLISH_TO_SHOPIFY_TOOL_NAME,
  description:
    "Publish an item from Zendrop to Shopify so the listing stays linked for fulfillment.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      productId: { type: "string" },
      importListItemId: { type: "string" },
      handle: { type: "string" },
    },
  },
};

export async function handleZendropPublishToShopify(input: unknown) {
  const record = readRecord(input, "zendrop_publish_to_shopify");
  return zendropPublishToShopify({
    productId: readOptionalString(record.productId, "productId"),
    importListItemId: readOptionalString(record.importListItemId, "importListItemId"),
    handle: readOptionalString(record.handle, "handle"),
  });
}