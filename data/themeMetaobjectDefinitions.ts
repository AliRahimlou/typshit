import type { MetaobjectDefinitionSpec } from "../types.js";

export const themeMetaobjectDefinitions: MetaobjectDefinitionSpec[] = [
  {
    type: "$app:typsh_theme_homepage",
    name: "Theme Homepage",
    description: "Merchant-editable homepage content for the typsh.it launch storefront.",
    displayNameKey: "hero_headline",
    access: {
      admin: "MERCHANT_READ_WRITE",
      storefront: "PUBLIC_READ",
    },
    fieldDefinitions: [
      { key: "hero_headline", name: "Hero headline", type: "single_line_text_field", required: true },
      { key: "hero_subheadline", name: "Hero subheadline", type: "multi_line_text_field" },
      { key: "primary_cta_label", name: "Primary CTA label", type: "single_line_text_field" },
      { key: "primary_cta_href", name: "Primary CTA href", type: "single_line_text_field" },
      { key: "secondary_cta_label", name: "Secondary CTA label", type: "single_line_text_field" },
      { key: "secondary_cta_href", name: "Secondary CTA href", type: "single_line_text_field" },
      {
        key: "featured_product_handles",
        name: "Featured product handles",
        type: "multi_line_text_field",
        description: "JSON array string of Shopify product handles.",
      },
      {
        key: "bundle_handles",
        name: "Bundle handles",
        type: "multi_line_text_field",
        description: "JSON array string of bundle handles used on the homepage.",
      },
    ],
  },
  {
    type: "$app:typsh_theme_bundle",
    name: "Theme Bundle",
    description: "Reusable bundle merchandising card content.",
    displayNameKey: "title",
    access: {
      admin: "MERCHANT_READ_WRITE",
      storefront: "PUBLIC_READ",
    },
    fieldDefinitions: [
      { key: "title", name: "Title", type: "single_line_text_field", required: true },
      { key: "summary", name: "Summary", type: "multi_line_text_field" },
      {
        key: "product_handles",
        name: "Product handles",
        type: "multi_line_text_field",
        description: "JSON array string of Shopify product handles.",
      },
      { key: "cta_label", name: "CTA label", type: "single_line_text_field" },
    ],
  },
  {
    type: "$app:typsh_theme_value_prop",
    name: "Theme Value Prop",
    description: "Short trust-strip or value-proposition block for the storefront.",
    displayNameKey: "label",
    access: {
      admin: "MERCHANT_READ_WRITE",
      storefront: "PUBLIC_READ",
    },
    fieldDefinitions: [
      { key: "label", name: "Label", type: "single_line_text_field", required: true },
      { key: "description", name: "Description", type: "multi_line_text_field" },
    ],
  },
];

export function getThemeMetaobjectDefinitions() {
  return themeMetaobjectDefinitions;
}