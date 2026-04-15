# AGENTS.md

## Store And Theme Reality

- This repo deploys to the live Shopify store `h2mrh0-jm.myshopify.com`.
- The current live theme is `Spotlight` `#174906900781`.
- The `theme/` directory in this repo is a partial Online Store 2.0 overlay, not a standalone theme replacement.
- The deploy path intentionally pushes only `assets/`, `sections/`, `snippets/`, and `templates/` from `theme/`.
- `layout/` and `config/` exist locally for theme tooling and validation, but the normal deploy script does not upload them.

## Deploy Commands

- Use `npm run store:deploy` for the normal end-to-end storefront deploy.
- Use `npm run store:sync-data` if only Shopify data, products, collections, pages, or metaobjects changed.
- Use `npm run theme:push` if only theme files changed.
- Use `npm run theme:list` before assuming a theme ID or live role.

## Theme Audit Rules

- Always verify four routes after a theme deploy:
  - `/`
  - one product page
  - one collection page
  - one content page such as `/pages/track-order`
- Do not assume the homepage reflects the same cache state as product or content pages. Re-check the root path separately.
- If the homepage alone looks stale after a successful push, make a real homepage-output change and redeploy before concluding the push failed.

## Content Guardrails

- Do not ship placeholder copy that says things like `placeholder`, `UGC frame`, or notes to future app installs.
- If a UGC block has no real image, give it a fallback product image or another graceful visual fallback in Liquid.
- Keep homepage trust and social-proof copy customer-facing. Do not leave internal implementation notes visible in defaults.

## Structural Guardrails

- Header and footer changes belong in:
  - `theme/sections/header.liquid`
  - `theme/sections/footer.liquid`
  - `theme/sections/header-group.json`
  - `theme/sections/footer-group.json`
- Homepage changes belong in `theme/templates/index.json` plus the referenced `typsh-*` sections.
- Product and collection experience changes belong in `theme/templates/product.json`, `theme/templates/collection.json`, and the referenced commerce sections.

## Verification Clues

- Custom shell present:
  - `typsh-shell.css`
  - `typsh-shell-header`
  - `typsh-shell-footer`
- Custom commerce present:
  - `typsh-commerce.css`
  - `typsh-commerce.js`
  - `data-typsh-*` markers
- If a page still shows stock Spotlight shell markers like `section-footer.css`, `Powered by Shopify`, or stock `header` markup where the custom shell should be, audit that route specifically before changing more code.

## Workflow Notes

- `agent_instructions.md` is the business and merchandising brief.
- This `AGENTS.md` file is the operational guide for future theme and deploy work.