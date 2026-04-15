import type OpenAI from "openai";

import { createPage } from "../shopify.js";
import type { PagePayload } from "../types.js";
import { readRecord, readString } from "./validators.js";

export const CREATE_PAGE_TOOL_NAME = "create_page";

export const createPageTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: CREATE_PAGE_TOOL_NAME,
  description: "Create a published Shopify page such as FAQ, shipping, about, or returns.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      handle: { type: "string" },
      bodyHtml: { type: "string" },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
    },
    required: ["title", "handle", "bodyHtml", "seoTitle", "seoDescription"],
  },
};

export async function handleCreatePage(input: unknown) {
  const record = readRecord(input, "create_page");

  const payload: PagePayload = {
    title: readString(record.title, "title"),
    handle: readString(record.handle, "handle"),
    bodyHtml: readString(record.bodyHtml, "bodyHtml"),
    seoTitle: readString(record.seoTitle, "seoTitle"),
    seoDescription: readString(record.seoDescription, "seoDescription"),
  };

  return createPage(payload);
}
