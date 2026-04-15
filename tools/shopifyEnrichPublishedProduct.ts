import type OpenAI from "openai";

import { enrichPublishedProductByHandle } from "../shopify.js";
import { readOptionalString, readRecord, readString, readStringArray } from "./validators.js";

export const SHOPIFY_ENRICH_PUBLISHED_PRODUCT_TOOL_NAME = "shopify_enrich_published_product";

export const shopifyEnrichPublishedProductTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: SHOPIFY_ENRICH_PUBLISHED_PRODUCT_TOOL_NAME,
  description:
    "Enhance a Zendrop-published Shopify product with SEO, copy, tags, collection assignments, and storefront media after it has been linked from Zendrop.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      handle: { type: "string" },
      title: { type: "string" },
      descriptionHtml: { type: "string" },
      productType: { type: "string" },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      collectionHandles: {
        type: "array",
        items: { type: "string" },
      },
      mediaUrls: {
        type: "array",
        items: { type: "string" },
      },
      mediaAlt: { type: "string" },
      publish: { type: "boolean" },
    },
    required: ["handle"],
  },
};

export async function handleShopifyEnrichPublishedProduct(input: unknown) {
  const record = readRecord(input, "shopify_enrich_published_product");

  return enrichPublishedProductByHandle({
    handle: readString(record.handle, "handle"),
    title: readOptionalString(record.title, "title"),
    descriptionHtml: readOptionalString(record.descriptionHtml, "descriptionHtml"),
    productType: readOptionalString(record.productType, "productType"),
    tags: Array.isArray(record.tags) ? readStringArray(record.tags, "tags") : undefined,
    seoTitle: readOptionalString(record.seoTitle, "seoTitle"),
    seoDescription: readOptionalString(record.seoDescription, "seoDescription"),
    collectionHandles: Array.isArray(record.collectionHandles)
      ? readStringArray(record.collectionHandles, "collectionHandles")
      : undefined,
    mediaUrls: Array.isArray(record.mediaUrls)
      ? readStringArray(record.mediaUrls, "mediaUrls")
      : undefined,
    mediaAlt: readOptionalString(record.mediaAlt, "mediaAlt"),
    publish: record.publish === true,
  });
}