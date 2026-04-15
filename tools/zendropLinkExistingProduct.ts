import type OpenAI from "openai";

import { zendropLinkExistingProduct } from "../zendrop.js";
import { readOptionalString, readRecord } from "./validators.js";

export const ZENDROP_LINK_EXISTING_PRODUCT_TOOL_NAME = "zendrop_link_existing_product";

export const zendropLinkExistingProductTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: ZENDROP_LINK_EXISTING_PRODUCT_TOOL_NAME,
  description:
    "Preview or confirm a Zendrop link for an existing Shopify product so fulfillment stays connected without creating duplicate listings.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      storeProductId: { type: "string" },
      productId: { type: "string" },
      handle: { type: "string" },
      title: { type: "string" },
      confirmationToken: { type: "string" },
      storeVariantId: { type: "string" },
      catalogVariantId: { type: "string" },
    },
  },
};

export async function handleZendropLinkExistingProduct(input: unknown) {
  const record = readRecord(input, "zendrop_link_existing_product");
  return zendropLinkExistingProduct({
    storeProductId: readOptionalString(record.storeProductId, "storeProductId"),
    productId: readOptionalString(record.productId, "productId"),
    handle: readOptionalString(record.handle, "handle"),
    title: readOptionalString(record.title, "title"),
    confirmationToken: readOptionalString(record.confirmationToken, "confirmationToken"),
    storeVariantId: readOptionalString(record.storeVariantId, "storeVariantId"),
    catalogVariantId: readOptionalString(record.catalogVariantId, "catalogVariantId"),
  });
}