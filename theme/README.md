# typsh.it Theme Kit

This folder adds the missing storefront layer that the backend workflows do not publish on their own.

It is a homepage kit for an Online Store 2.0 Shopify theme, not a complete standalone theme. The catalog, collections, pages, and metaobjects are already handled by the TypeScript backend in the repo. These theme files are the missing visible layer.

## What is included

- `assets/typsh-homepage.css`: shared visual system for the homepage sections
- `assets/typsh-it-wordmark.svg`: theme-local wordmark asset
- `assets/typsh-it-monogram.svg`: theme-local favicon/monogram asset
- `assets/typsh-it-color-cycle-wordmark.svg`: animated neon wordmark derived from the boxed logo studies in `assets/typshit/`
- `config/settings_schema.json` and `layout/theme.liquid`: minimal scaffold files so Shopify CLI treats the folder as a valid theme root
- `sections/header.liquid`, `sections/footer.liquid`, `sections/header-group.json`, and `sections/footer-group.json`: repo-owned shell files that replace the generic Spotlight header/footer with the branded typsh.it navigation and logo wiring
- `assets/typsh-commerce.css` and `assets/typsh-commerce.js`: lightweight commerce layer for product pages, collection filtering, quick add, sticky ATC, recently viewed, announcement bar, and cart drawer behavior
- `sections/typsh-*.liquid`: homepage sections plus product-page, collection-page, UGC, FAQ, recommendations, and pre-lander sections
- `snippets/typsh-*.liquid`: reusable icon, homepage card, commerce card, category card, and animated logo helpers
- `templates/index.json`, `templates/product.json`, `templates/collection.json`, and `templates/page.prelander.json`: storefront templates wired for the expanded theme system

## Recommended install path

1. Pull or duplicate the live Shopify theme into a separate local theme workspace.
2. Copy the files in this folder into that theme's `assets`, `sections`, `snippets`, and `templates` directories.
3. Back up the existing `templates/index.json`, then replace it with this kit's `templates/index.json`.
4. Upload `assets/typsh-it-monogram.svg` as the favicon.
5. Choose the header logo variant you want to use: `assets/typsh-it-wordmark.svg` for static branding or `assets/typsh-it-color-cycle-wordmark.svg` for the animated neon version.
6. If your theme header supports only image uploads, use the chosen SVG directly as the uploaded logo asset.
7. If you want to render the logo through Liquid instead, replace the current logo markup in the header with:

```liquid
{% render 'typsh-brand-logo', animated: true, width: 220, alt: 'typsh.it' %}
```
8. In Shopify Navigation, wire the header menu to: Home, Shop, Best Sellers, Track Order, FAQ, Contact.
9. In Shopify Navigation, wire the footer menu to: About, Contact, FAQ, Shipping Policy, Return & Refund Policy, Privacy Policy, Terms of Service, Track Order.
10. In the theme editor, confirm the CTA links still point at the current collection and product URLs.
11. Publish the updated theme after mobile and desktop QA.

## Suggested Shopify CLI workflow

Use this only after you have theme access:

```bash
shopify theme dev --store typsh.it
shopify theme push --store typsh.it --theme <theme-id>
```

## Notes

- The current homepage blueprint is implemented with fixed settings defaults so it is immediately usable.
- The theme kit now includes a stronger commerce layer: sticky ATC, a native cart drawer, quick add, collection filtering, dedicated PDP sections, UGC reels, recently viewed, and a pre-lander template.
- The sections intentionally reference the live launch handles directly because that is the fastest way to make the homepage visibly correct.
- The deploy script pushes only `assets`, `sections`, `snippets`, and `templates` so the scaffold `layout/` and `config/` files are never uploaded over the store's real theme shell.
- The backend already seeded app-owned theme metaobjects, but these theme sections do not depend on them yet. They can be upgraded later once the final theme direction is locked.
- The animated wordmark cycles through the same lime, blue, pink, and violet palette used in the logo JPG studies under `assets/typshit/`.
- Reviews, tracking, bundles, email popup, and SMS app integrations are still expected to be layered in through the app stack plan after the theme is published, but the theme now has native placeholder and placement support for those systems.