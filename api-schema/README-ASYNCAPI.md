# AsyncAPI Docs

This folder contains the AsyncAPI spec for the Socket.IO namespaces and events, alongside the OpenAPI spec for REST.

Commands (run inside `api-schema`):

- Build static HTML docs into `generated/asyncapi-docs`:

  npm run asyncapi:build

- Live preview docs (dev server on port 8090):

  npm run asyncapi:preview

- Watch and rebuild static docs on changes:

  npm run asyncapi:watch

- Preview both REST (OpenAPI) and Realtime (AsyncAPI) together in Redocly (port 8082):

  npm run preview:all

  This uses `redocly.yaml` which registers both:

  - rest: openapi.yaml
  - realtime: asyncapi.yaml (type: asyncapi)

You can serve `generated/asyncapi-docs` with any static server or point your reverse proxy to it.
