import OpenAI from "openai";

import { config } from "./config.js";
import { executeToolCall, toolDefinitions } from "./tools/index.js";
import type {
  AgentToolResult,
  LaunchCatalogAssets,
  LaunchCatalogSeed,
  PublicationStatus,
} from "./types.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey,
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleFromHandle(handle: string): string {
  return handle
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createProductDescription(seed: LaunchCatalogSeed["products"][number]): string {
  const intro = seed.faq?.[0]?.a ?? `${seed.title} is a practical everyday upgrade built to solve a real problem fast.`;
  const faqHtml = (seed.faq ?? [])
    .map(
      (entry) =>
        `<h3>${escapeHtml(entry.q)}</h3><p>${escapeHtml(entry.a)}</p>`,
    )
    .join("");

  return [
    `<p>${escapeHtml(intro)}</p>`,
    `<h2>Why it helps</h2><ul>${seed.bullets
      .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
      .join("")}</ul>`,
    `<h2>Shipping</h2><p>Free US shipping is built into the price. Orders are processed as quickly as possible and tracking is provided when available.</p>`,
    `<h2>Returns and support</h2><p>If your order arrives damaged or defective, contact support@typsh.it within 30 days and the team will help resolve it.</p>`,
    faqHtml ? `<h2>FAQ</h2>${faqHtml}` : "",
  ].join("");
}

function createCollectionDescription(seed: LaunchCatalogSeed["collections"][number]): string {
  return `<p>${escapeHtml(seed.summary)}</p>`;
}

function createPageBody(seed: LaunchCatalogSeed["pages"][number]): string {
  const pageBodies: Record<string, string> = {
    about: "<h1>About typsh.it</h1><p>typsh.it curates useful finds that actually make life easier. The store focuses on clean, problem-solving products for home, tech, and everyday convenience in the United States.</p><p>Every launch product is selected for practical value, clean presentation, and lower-friction day-to-day use.</p>",
    contact: "<h1>Contact</h1><p>Need help with an order or product question? Email support@typsh.it and include your order number when available.</p><p>Customer support is focused on clear, responsive help for US orders.</p>",
    faq: "<h1>FAQ</h1><h2>What does typsh.it sell?</h2><p>typsh.it sells practical products for home, tech, and everyday convenience.</p><h2>Where do you ship?</h2><p>We currently launch for the United States market only.</p><h2>How much is shipping?</h2><p>Shipping is free within the US.</p><h2>How do returns work?</h2><p>If an item arrives damaged or defective, contact support@typsh.it within 30 days for help.</p>",
    shipping: "<h1>Shipping Policy</h1><p>typsh.it currently serves the United States only. Free US shipping is built into product pricing.</p><p>Orders are processed as quickly as possible. Tracking details are provided when available after fulfillment.</p>",
    returns: "<h1>Return &amp; Refund Policy</h1><p>If your item arrives damaged or defective, contact support@typsh.it within 30 days of delivery.</p><p>Include your order number and a short description of the issue so support can help with the next steps.</p>",
    privacy: "<h1>Privacy Policy</h1><p>typsh.it collects the information needed to process orders, provide support, and improve the shopping experience.</p><p>Customer data is handled for store operations, order communication, and service improvements in line with applicable policies.</p>",
    terms: "<h1>Terms of Service</h1><p>By using typsh.it, you agree to the store terms covering purchases, payments, shipping, returns, and general site use.</p><p>Product availability, pricing, and store policies may be updated as needed.</p>",
    "track-order": "<h1>Track Order</h1><p>Once your order has been fulfilled, tracking details are shared when available.</p><p>If you need help locating your shipment update, contact support@typsh.it with your order number.</p>",
  };

  return pageBodies[seed.kind] ?? `<h1>${escapeHtml(seed.title)}</h1><p>${escapeHtml(seed.summary)}</p>`;
}

function generateLaunchCatalogAssetsLocally(
  seed: LaunchCatalogSeed,
  resolvedProductStatus: PublicationStatus,
): LaunchCatalogAssets {
  return {
    products: seed.products.map((product) => ({
      title: product.title,
      handle: product.handle,
      descriptionHtml: createProductDescription(product),
      vendor: seed.vendor,
      productType: product.category,
      tags: product.tags ?? [],
      price: product.price.toFixed(2),
      compareAtPrice: product.compareAtPrice?.toFixed(2),
      status: product.status ?? resolvedProductStatus,
      seoTitle: `${product.title} | ${seed.storeName}`,
      seoDescription: product.faq?.[0]?.a ?? product.bullets[0],
      faq: product.faq ?? [],
      collections: product.collections,
    })),
    collections: seed.collections.map((collection) => ({
      title: collection.title,
      handle: collection.handle,
      descriptionHtml: createCollectionDescription(collection),
      seoTitle: `${collection.title} | ${seed.storeName}`,
      seoDescription: collection.summary,
      productHandles: collection.productHandles,
    })),
    pages: seed.pages.map((page) => ({
      title: page.title,
      handle: page.handle,
      bodyHtml: createPageBody(page),
      seoTitle: `${page.title} | ${seed.storeName}`,
      seoDescription: page.summary,
    })),
    metaobjects: seed.metaobjects,
  };
}

const launchCatalogSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    products: {
      type: "array",
      items: {
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
    },
    collections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          handle: { type: "string" },
          descriptionHtml: { type: "string" },
          seoTitle: { type: "string" },
          seoDescription: { type: "string" },
          productHandles: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "title",
          "handle",
          "descriptionHtml",
          "seoTitle",
          "seoDescription",
          "productHandles",
        ],
      },
    },
    pages: {
      type: "array",
      items: {
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
    },
  },
  required: ["products", "collections", "pages"],
};

function parseOutputJson<T>(label: string, outputText: string): T {
  try {
    return JSON.parse(outputText) as T;
  } catch (error) {
    throw new Error(
      `${label} did not return valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function isFunctionCall(
  item: OpenAI.Responses.ResponseOutputItem,
): item is OpenAI.Responses.ResponseFunctionToolCall {
  return item.type === "function_call";
}

export async function generateLaunchCatalogAssets(
  seed: LaunchCatalogSeed,
  options?: {
    publish?: boolean;
    productStatus?: PublicationStatus;
  },
): Promise<LaunchCatalogAssets> {
  const resolvedProductStatus =
    options?.publish === true ? "ACTIVE" : options?.productStatus ?? seed.defaultProductStatus;

  if (
    !config.openaiApiKey ||
    config.openaiApiKey.startsWith("your_") ||
    config.openaiApiKey.startsWith("sk-xxx")
  ) {
    return generateLaunchCatalogAssetsLocally(seed, resolvedProductStatus);
  }

  try {
    const response = await client.responses.create({
      model: config.openaiModel,
      temperature: 0.3,
      instructions:
        "You are writing launch-ready Shopify store content. Return structured JSON only. Preserve every provided handle, collection membership, page handle, price, compare-at price, and product count exactly. Generate concise, premium copy optimized for SEO and answer-engine retrieval. Do not invent extra products, pages, or collections.",
      input: [
        {
          role: "user",
          content: JSON.stringify({
            seed,
            resolvedProductStatus,
            requirements: {
              productDescriptionFormat:
                "Use compact HTML with a short intro paragraph and a bullet list built from the supplied product bullets.",
              pageRequirements:
                "Write practical policy page copy with clear headings and tight paragraphs.",
            },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "launch_catalog_assets",
          strict: true,
          schema: launchCatalogSchema,
        },
        verbosity: "low",
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty launch catalog response");
    }

    const generated = parseOutputJson<
      Omit<LaunchCatalogAssets, "metaobjects">
    >("launch catalog assets", response.output_text);

    return {
      ...generated,
      metaobjects: seed.metaobjects,
    };
  } catch {
    return generateLaunchCatalogAssetsLocally(seed, resolvedProductStatus);
  }
}

export async function runAgentGoal(
  goal: string,
  context?: Record<string, unknown>,
): Promise<{
  summary: string;
  toolResults: AgentToolResult[];
}> {
  const instructions =
    "You are a Shopify operations agent. Use tools to create products, collections, pages, and metaobjects. Prefer DRAFT products unless the user explicitly asks to publish immediately. Do not attempt theme edits.";

  const initialInput = context
    ? [
        {
          role: "user" as const,
          content: JSON.stringify({
            goal,
            context,
          }),
        },
      ]
    : [{ role: "user" as const, content: goal }];

  let response = await client.responses.create({
    model: config.openaiModel,
    temperature: 0.2,
    instructions,
    input: initialInput,
    tools: toolDefinitions,
    parallel_tool_calls: false,
  });

  const toolResults: AgentToolResult[] = [];

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const toolCalls = response.output.filter(isFunctionCall);

    if (!toolCalls.length) {
      return {
        summary: response.output_text || "No actions taken.",
        toolResults,
      };
    }

    const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];

    for (const toolCall of toolCalls) {
      const parsedArgs = parseOutputJson<Record<string, unknown>>(
        `${toolCall.name} arguments`,
        toolCall.arguments,
      );
      const result = await executeToolCall(toolCall.name, parsedArgs);

      toolResults.push({
        tool: toolCall.name,
        result,
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      });
    }

    response = await client.responses.create({
      model: config.openaiModel,
      instructions,
      previous_response_id: response.id,
      input: toolOutputs,
      tools: toolDefinitions,
      parallel_tool_calls: false,
    });
  }

  throw new Error("Agent exceeded the tool call limit for a single request");
}
