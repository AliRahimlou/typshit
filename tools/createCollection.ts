import type OpenAI from "openai";

import { createCollection } from "../shopify.js";
import type { CollectionPayload } from "../types.js";
import {
  readOptionalString,
  readRecord,
  readString,
  readStringArray,
} from "./validators.js";

export const CREATE_COLLECTION_TOOL_NAME = "create_collection";

export const createCollectionTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: CREATE_COLLECTION_TOOL_NAME,
  description: "Create a Shopify collection and optionally attach existing product IDs.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      handle: { type: "string" },
      descriptionHtml: { type: "string" },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      productIds: {
        type: "array",
        items: { type: "string" },
      },
      publish: { type: "boolean" },
    },
    required: ["title", "handle", "descriptionHtml", "seoTitle", "seoDescription"],
  },
};

export async function handleCreateCollection(input: unknown) {
  const record = readRecord(input, "create_collection");

  const payload: CollectionPayload = {
    title: readString(record.title, "title"),
    handle: readString(record.handle, "handle"),
    descriptionHtml: readString(record.descriptionHtml, "descriptionHtml"),
    seoTitle: readString(record.seoTitle, "seoTitle"),
    seoDescription: readString(record.seoDescription, "seoDescription"),
    productHandles: [],
  };

  const publishValue = record.publish;
  const publish =
    typeof publishValue === "boolean"
      ? publishValue
      : readOptionalString(publishValue, "publish");

  return createCollection(payload, {
    productIds: Array.isArray(record.productIds)
      ? readStringArray(record.productIds, "productIds")
      : undefined,
    publish: typeof publish === "boolean" ? publish : undefined,
  });
}
