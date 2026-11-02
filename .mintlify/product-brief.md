# Product brief

## Description
Reporters.io helps people research journalists and media outlets, inspect associated article references, and access available contact details.

## Primary audience
Developers and AI-agent users integrating media research into their applications. The API and MCP launch follows the existing Soldfetch and RealtyCrawl distribution patterns approved by the user.

## Jobs to be done
1. Create a scoped key and make a first search request.
2. Inspect a reporter or outlet and its associated coverage using stable IDs.
3. Reveal contacts explicitly when the account and key permit it, or connect the same workflow through MCP or an agent skill.

## Motivation
Provide programmatic access to existing Reporters.io research capabilities under one product domain. The initial contract covers eleven operations; list/export automation and OAuth are outside this release.

## Access policy
Creating API keys and all REST API and MCP operations require an active Professional (Pro) subscription. Revoked and expired keys are denied; existing keys also lose access when an account loses active Pro status. Existing keys may still be revoked after a downgrade. Public docs and OpenAPI remain readable without a subscription.

## Decisions
The docs use the almond Mintlify theme, the existing #FE6320 brand palette and logo, and reporters.io/docs as the public base path. REST uses reporters.io/api/v1 and MCP uses reporters.io/api/mcp. These values were supplied by the approved implementation plan.
