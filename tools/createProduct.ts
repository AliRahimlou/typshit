import type OpenAI from "openai";

import { createProduct } from "../shopify.js";
import type { ProductPayload } from "../types.js";
import {
  readFaqArray,
  readOptionalString,
  readRecord,
  readString,
  readStringArray,
} from "./validators.js";

export const CREATE_PRODUCT_TOOL_NAME = "create_product";

export const createProductTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: CREATE_PRODUCT_TOOL_NAME,
  description: "Create a Shopify product with pricing, SEO copy, and optional FAQ content.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      handle: { type: "string" },
      descriptionHtml: { type: "string" },
      vendor: { type: "string" },
      productType: { type: "string" },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      price: { type: "string" },
      compareAtPrice: { type: "string" },
      status: {
        type: "string",
        enum: ["ACTIVE", "DRAFT"],
      },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      faq: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: { type: "string" },
            a: { type: "string" },
          },
          required: ["q", "a"],
        },
      },
      collections: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "handle",
      "descriptionHtml",
      "vendor",
      "productType",
      "tags",
      "price",
      "status",
      "seoTitle",
      "seoDescription",
      "faq",
      "collections",
    ],
  },
};

export async function handleCreateProduct(input: unknown) {
  const record = readRecord(input, "create_product");

  const payload: ProductPayload = {
    title: readString(record.title, "title"),
    handle: readString(record.handle, "handle"),
    descriptionHtml: readString(record.descriptionHtml, "descriptionHtml"),
    vendor: readString(record.vendor, "vendor"),
    productType: readString(record.productType, "productType"),
    tags: readStringArray(record.tags, "tags"),
    price: readString(record.price, "price"),
    compareAtPrice: readOptionalString(record.compareAtPrice, "compareAtPrice"),
    status: readString(record.status, "status") as ProductPayload["status"],
    seoTitle: readString(record.seoTitle, "seoTitle"),
    seoDescription: readString(record.seoDescription, "seoDescription"),
    faq: readFaqArray(record.faq, "faq"),
    collections: readStringArray(record.collections, "collections"),
  };

  return createProduct(payload);
}
