# Reporters.io documentation

Mintlify source for [reporters.io/docs](https://reporters.io/docs). REST base: `https://reporters.io/api/v1`; hosted MCP: `https://reporters.io/api/mcp`. Creating API keys and using REST or MCP require an active Professional (Pro) subscription. The documentation and public OpenAPI specification remain readable without a subscription.

## Develop

```bash
npm test
npx mint validate
npx mint broken-links
npx mint dev --no-open
```

`docs.json` defines the branded navigation and interactive OpenAPI reference. `openapi.json` is generated from the Reporters.io application contract. Update it from that source rather than editing a second contract independently.

## Publish

Connect `ricciflow-api/reporters-api-docs` in Mintlify with branch `main` and content directory `/`. Configure the product domain `reporters.io` with the `/docs` public base path. The application must proxy `/docs`, nested docs paths, and Mintlify root asset/API paths to the assigned Mintlify origin. Use the actual project origin returned by Mintlify; do not assume a subdomain is available.

Documentation generation does not publish the site. Verify the deployment and the product-domain routes before reporting the docs live.

## Validate a release

`npm test` checks all navigation targets, public-contract endpoint references, internal links, branding assets, and the first-release operation surface. `npm run check:live` also compares the docs contract with the deployed public API contract. `npm run check:site` checks HTTPS and rendered documentation routes without API credentials or billable data requests.

[Documentation](https://reporters.io/docs) · [MCP](https://github.com/ricciflow-api/reporters-mcp) · [Agent skills](https://github.com/ricciflow-api/reporters-agent-skills) · [Examples](https://github.com/ricciflow-api/reporters-api-examples)
